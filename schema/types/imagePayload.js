import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
} from 'graphql'


import Error from './error.js'
import Image from './image.js'

const ImagePayload = new GraphQLObjectType({
    name: 'ImagePayload',
    fields: () => ({
        image: {
            type: Image
        },
        errors: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Error)))
        }
    })

})

export default ImagePayload