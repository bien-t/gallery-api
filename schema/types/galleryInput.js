import {
    GraphQLNonNull,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLID,
} from 'graphql'


const GalleryInput = new GraphQLInputObjectType({
    name: 'GalleryInput',
    fields: () => ({
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        path: {
            type: new GraphQLNonNull(GraphQLString)
        },
        parentGalleryId: {
            type: new GraphQLNonNull(GraphQLID)
        }
    })
})

export default GalleryInput

