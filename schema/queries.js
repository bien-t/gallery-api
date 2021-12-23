import {
    GraphQLID,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType,
    GraphQLString,
} from 'graphql'
import Gallery from './types/gallery.js'

const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        galleryInfo: {
            type: new GraphQLList(new GraphQLNonNull(Gallery)),
            args: {
                _id: {
                    type: GraphQLID
                },
            },
            resolve: async (source, args, { models, user }) => {
                if (args && args._id) {
                    return await models.Gallery.find({ user: user._id, _id: args._id })
                } else {
                    return await models.Gallery.find({ _id: user.galleries[0] })
                }
            }
        },
        userGalleries: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: async (source, args, { models, user }) => {
                const gallery = await models.Gallery.find({ _id: user.galleries[0] })
                const response = JSON.stringify(gallery)
                return response
            }
        },
    })
})


export default QueryType