import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLID
} from 'graphql'

import { GraphQLUpload } from 'graphql-upload'
import bcrypt from 'bcrypt'
import getErrorMessage from '../dbError.js'

import UserCreateInput from './types/userCreateInput.js'
import UserPayload from './types/userPayload.js'
import UserLoginInput from './types/userLoginInput.js'
import GalleryInput from './types/galleryInput.js'
import GalleryPayload from './types/galleryPayload.js'
import ImagePayload from './types/imagePayload.js'
import { createWriteStream } from 'fs'
import fs from 'fs'

import sharp from 'sharp'

const MutationType = new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
        userCreate: {
            type: new GraphQLNonNull(UserPayload),
            args: {
                input: {
                    type: new GraphQLNonNull(UserCreateInput)
                }
            },
            resolve: async (source, { input }, { models, req }) => {
                const payload = { errors: [] }

                if (input.password.length < 6) {
                    payload.errors.push({
                        message: 'Password is too short'
                    })
                }
                if (payload.errors.length === 0) {
                    input.email = input.email.trim().toLowerCase()
                    const hashedPassword = await bcrypt.hash(input.password, 10)
                    try {
                        const user = new models.User({ email: input.email })
                        const userPassword = new models.Password({ user: user._id, hashedPassword })
                        await user.save()
                        await userPassword.save()
                        payload.user = user
                        req.session.user = { _id: user._id }

                        const gallery = new models.Gallery({
                            name: 'root',
                            user: user._id,
                            path: 'root'
                        })
                        gallery.idPath = gallery._id

                        await gallery.save()
                        await models.User.findByIdAndUpdate(user._id, {
                            $push: {
                                galleries: gallery._id,
                            }
                        })
                    } catch (err) {
                        payload.errors.push({ message: getErrorMessage(err) })
                        return payload
                    }
                }
                return payload
            }
        },
        userLogin: {
            type: new GraphQLNonNull(UserPayload),
            args: {
                input: {
                    type: new GraphQLNonNull(UserLoginInput)
                }
            },
            resolve: async (parent, { input }, { models, req }) => {
                const payload = { errors: [] }
                if (!input.email || !input.password) {
                    payload.errors.push({
                        message: 'Invalid username or password'
                    })
                }
                if (payload.errors.length === 0) {
                    input.email = input.email.trim().toLowerCase()


                    const user = await models.User.findOne(({ email: input.email }))
                    if (!user) {
                        payload.errors.push({ message: `Email and password don't match` })
                        return payload
                    }
                    const password = await models.Password.findOne({ user: user._id })
                    const validatePassword = await bcrypt.compare(input.password, password.hashedPassword)
                    if (!validatePassword) {
                        payload.errors.push({ message: `Email and password don't match` })
                        return payload
                    }

                    req.session.user = { _id: user._id }
                    payload.user = user
                }

                return payload
            }
        },
        galleryAdd: {
            type: new GraphQLNonNull(GalleryPayload),
            args: {
                input: {
                    type: new GraphQLNonNull(GalleryInput)
                }
            },
            resolve: async (parent, { input }, { models, user }) => {
                const payload = { errors: [] }
                if (payload.errors.length === 0) {
                    const parentGalleryPaths = await models.Gallery.findById(input.parentGalleryId).select('path idPath -_id')

                    const gallery = new models.Gallery({
                        name: input.name,
                        user: user._id,
                        path: parentGalleryPaths.path ? `${parentGalleryPaths.path}/${input.name}` : 'root',
                        parentGalleryId: input.parentGalleryId
                    })
                    gallery.idPath = parentGalleryPaths.idPath ? `${parentGalleryPaths.idPath}/${gallery._id}` : `${gallery._id}`
                    const result = await gallery.save()

                    await models.Gallery.findByIdAndUpdate(input.parentGalleryId, { $push: { childGalleries: gallery._id } })
                    await models.User.findByIdAndUpdate(user._id, {
                        $push: {
                            galleries: gallery._id
                        },
                    })
                    payload.gallery = result
                }

                return payload
            }
        },
        imageAdd: {
            type: new GraphQLNonNull(ImagePayload),
            args: {
                images: {
                    type: new GraphQLList(GraphQLUpload)
                },
                galleryId: {
                    type: GraphQLID
                }
            },
            resolve: async (parent, { images, galleryId }, { models, user }) => {
                const payload = { errors: [] }

                const results = await Promise.allSettled(images.map(async image => {
                    const imageId = new models.Image()
                    const { createReadStream, filename, mimetype } = await image;
                    const stream = createReadStream()
                    const imageDetails = {
                        name: '',
                        size: '',
                        type: '',
                        mime: '',
                        galleryId: '',
                        user: '',
                        path: '',
                        miniaturePath: ''
                    }

                    imageDetails.name = filename.split('.')[0]
                    imageDetails.type = mimetype.split('/')[1]
                    imageDetails.mime = mimetype
                    imageDetails.user = user._id
                    imageDetails.galleryId = galleryId
                    imageDetails._id = imageId._id

                    await fs.promises.mkdir(`upload/${user._id}`, { recursive: true })

                    const path = `${user._id}/${imageDetails._id}.${imageDetails.type}`


                    const out = createWriteStream(`upload/${path}`);
                    stream.pipe(out);

                    const buffer = new Promise((resolve, reject) => {
                        const _buf = [];

                        stream.on("data", (chunk) => _buf.push(chunk));
                        stream.on("end", () => resolve(Buffer.concat(_buf)));
                        stream.on("error", (err) => reject(err));

                    });

                    const buf = await buffer
                    imageDetails.size = Buffer.byteLength(buf)
                    const miniaturePath = `${user._id}/min-${imageDetails._id}.${imageDetails.type}`
                    sharp(buf).resize(180, 160).toFile(`upload/${miniaturePath}`)

                    imageDetails.miniaturePath = miniaturePath
                    imageDetails.path = path

                    return imageDetails

                }))

                const reduced = results.reduce((imagesArray, { value, reason }) => {
                    if (value) imagesArray.push(value)
                    else console.error(`Failed to store upload: ${reason}`);
                    return imagesArray
                }, [])

                reduced.forEach(async (image, index) => {
                    await models.Image.create(image)
                    await models.Gallery.findByIdAndUpdate(galleryId, {
                        $push: {
                            images: image._id
                        }
                    })
                    await models.User.findByIdAndUpdate(user.id, {
                        $push: {
                            images: image._id
                        }
                    })
                })

                return payload
            }
        },
        logout: {
            type: GraphQLString,
            resolve: async (source, _, { req, res }) => new Promise((resolve, reject) => {
                req.session.destroy(err => {
                    if (err) throw err;
                    res.clearCookie('gId')
                    resolve('Deleted')
                })
            })
        },
        imageRename: {
            type: new GraphQLNonNull(ImagePayload),
            args: {
                name: {
                    type: GraphQLString
                },
                id: {
                    type: GraphQLID
                }
            },
            resolve: async (soruce, args, { models }) => {
                const payload = { errors: [] }
                await models.Image.findByIdAndUpdate(args.id, {
                    name: args.name
                })
                return payload
            }
        },
        imageDelete: {
            type: new GraphQLNonNull(ImagePayload),
            args: {
                id: {
                    type: GraphQLID
                }
            },
            resolve: async (source, args, { models }) => {
                const payload = { errors: [] }
                const image = await models.Image.findById(args.id)
                await fs.promises.rm(`upload/${image.path}`).catch(function(error){
                    if(error.code==='ENOENT'){
                        return 'no image'
                    }
                })
                await fs.promises.rm(`upload/${image.miniaturePath}`).catch(function(error){
                    if(error.code==='ENOENT'){
                        return 'no image'
                    }
                })
                await models.Image.findByIdAndDelete(args.id)
                await models.Gallery.findByIdAndUpdate(image.galleryId, {
                    $pull: {
                        images: image._id
                    }
                })

                return payload
            }
        },
        imageMove: {
            type: new GraphQLNonNull(ImagePayload),
            args: {
                id: {
                    type: GraphQLID
                },
                newGallery: {
                    type: GraphQLID
                }
            },
            resolve: async (source, args, { models }) => {
                const payload = { errors: [] }
                const image = await models.Image.findById(args.id)
                await models.Image.findByIdAndUpdate(args.id, {
                    galleryId: args.newGallery

                })

                await models.Gallery.findByIdAndUpdate(image.galleryId, {
                    $pull: {
                        images: image._id
                    }
                })
                await models.Gallery.findByIdAndUpdate(args.newGallery, {
                    $push: {
                        images: args.id
                    }
                })

                return payload
            }
        },
        galleryRename: {
            type: new GraphQLNonNull(GalleryPayload),
            args: {
                name: {
                    type: GraphQLString
                },
                id: {
                    type: GraphQLID
                }
            },
            resolve: async (source, args, { models }) => {
                const payload = { errors: [] }
                const loop = async (childId) => {
                    const gallery = await models.Gallery.findById(childId._id)

                    if (gallery.childGalleries.length > 0) {
                        gallery.childGalleries.forEach((child) => {
                            loop(child)
                        })
                    }
                    const galleryIndex = gallery.idPath.split('/').indexOf(args.id)
                    const pathArray = gallery.path.split('/')
                    pathArray[galleryIndex] = args.name
                    const pathString = pathArray.join('/')
                    await models.Gallery.findByIdAndUpdate(childId._id, {
                        path: pathString
                    })
                }

                const gallery = await models.Gallery.findById(args.id)

                if (gallery.childGalleries.length > 0) {
                    gallery.childGalleries.forEach(async (child) => {
                        loop(child)
                    })
                }

                const galleryIndex = gallery.idPath.split('/').indexOf(args.id)
                const pathArray = gallery.path.split('/')
                pathArray[galleryIndex] = args.name
                const pathString = pathArray.join('/')
                await models.Gallery.findByIdAndUpdate(args.id, {
                    name: args.name,
                    path: pathString
                })
                return payload
            }
        },
        galleryDelete: {
            type: new GraphQLNonNull(GalleryPayload),
            args: {
                id: {
                    type: GraphQLID
                }
            },
            resolve: async (source, args, { models }) => {
                const payload = { errors: [] }

                const loop = async (child) => {
                    const gallery = await models.Gallery.findById(child._id)

                    if (gallery.childGalleries.length > 0) {
                        gallery.childGalleries.forEach((child) => {
                            loop(child)
                        })
                    }
                    if (gallery.images.length > 0) {
                        gallery.images.forEach(async (imageId) => {

                            const image = await models.Image.findById(imageId)
                            await fs.promises.rm(`upload/${image.path}`).catch(function(error){
                                if(error.code==='ENOENT'){
                                    return 'no image'
                                }
                            })
                            await fs.promises.rm(`upload/${image.miniaturePath}`).catch(function(error){
                                if(error.code==='ENOENT'){
                                    return 'no image'
                                }
                            })
                            await models.Image.findByIdAndDelete(imageId)
                        })
                    }

                    await models.Gallery.findByIdAndDelete(child._id)
                }
                const gallery = await models.Gallery.findById(args.id)

                if (gallery.childGalleries.length > 0) {
                    gallery.childGalleries.forEach(async (child) => {
                        loop(child)
                    })
                }
                if (gallery.images.length > 0) {
                    gallery.images.forEach(async (imageId) => {

                        const image = await models.Image.findById(imageId)
                        await fs.promises.rm(`upload/${image.path}`).catch(function(error){
                            if(error.code==='ENOENT'){
                                return 'no image'
                            }
                        })
                        await fs.promises.rm(`upload/${image.miniaturePath}`).catch(function(error){
                            if(error.code==='ENOENT'){
                                return 'no image'
                            }
                        })
                        await models.Image.findByIdAndDelete(imageId)
                    })
                }

                await models.Gallery.findByIdAndUpdate(gallery.parentGalleryId, {
                    $pull: {
                        childGalleries: args.id
                    }
                })
                await models.Gallery.findByIdAndDelete(args.id)

                return payload

            }
        },

    })
})


export default MutationType