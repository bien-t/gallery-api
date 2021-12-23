import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
} from 'graphql'
import User from './user.js'
import Error from './error.js'
const UserPayload = new GraphQLObjectType({
    name: 'UserPayload',
    fields: () => ({
        user:{
            type:User
        },
        errors:{
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Error)))
        }
    })
})


export default UserPayload