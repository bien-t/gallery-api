import {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLNonNull,

} from 'graphql'
import User from './user.js'
import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'
const Image = new GraphQLObjectType({
    name: 'Image',
    fields: () => ({
        _id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        size: {
            type: new GraphQLNonNull(GraphQLString)
        },
        type: {
            type: new GraphQLNonNull(GraphQLString)
        },
        galleryId: {
            type: new GraphQLNonNull(GraphQLID)
        },
        user: {
            type: new GraphQLNonNull(User),
            resolve: async (parent, args, { models }) => {
                return await models.User.findById(parent.user)
            }
        },
        path: {
            type: new GraphQLNonNull(GraphQLString)
        },
        mime: {
            type: new GraphQLNonNull(GraphQLString)
        },
        miniatureImage: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: async (parent, args) => {
                const __dirname = path.dirname(fileURLToPath(import.meta.url));
                let read = (await fs.promises.readFile(path.join(__dirname, `/../../upload/${parent.miniaturePath}`)).catch(function(error){
                    if(error.code==='ENOENT'){
                        return 'no image'
                    }
                })).toString('base64')
                return read
            }

        }
    })
})

export default Image