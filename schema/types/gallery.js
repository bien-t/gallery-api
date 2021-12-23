import {
GraphQLObjectType,
GraphQLID,
GraphQLList,
GraphQLString,
GraphQLNonNull

} from 'graphql'
import User from './user.js'
import Image from './image.js'
const Gallery = new GraphQLObjectType({
    name:'Gallery',
    fields:()=>({
        _id:{
            type:new GraphQLNonNull(GraphQLString)
        },
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        user: {
            type: new GraphQLNonNull(User),
            resolve:async(parent,args,{models})=>{
                return await models.User.findById(parent.user)
            }
        },
        images: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Image))),
            resolve: async(parent,args,{models})=>{
                return await models.Image.find({_id:parent.images})
            }
        },
        path: {
            type: new GraphQLNonNull(GraphQLString)
        },
        idPath:{
            type:new GraphQLNonNull(GraphQLString)
        },
        parentGalleryId: {
            type: new GraphQLNonNull(GraphQLID)
        },
        childGalleries: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Gallery))),
            resolve:async(parent,args,{models})=>{
                return await models.Gallery.find({_id:parent.childGalleries})
            }
        }
    })
})

export default Gallery