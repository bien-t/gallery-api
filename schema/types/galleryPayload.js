import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
} from 'graphql'


import Error from './error.js'
import Gallery from './gallery.js'

const GalleryPayload = new GraphQLObjectType({
    name: 'GalleryPayload',
    fields: () => ({
        gallery: {
            type: Gallery
        },
        errors: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Error)))
        }
    })

})

export default GalleryPayload