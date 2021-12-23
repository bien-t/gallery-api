import {
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString
} from 'graphql'

const UserLoginInput = new GraphQLInputObjectType({
    name:'UserLoginInput',
    fields:()=>({
        email:{
            type:new GraphQLNonNull(GraphQLString)
        },
        password:{
            type:new GraphQLNonNull(GraphQLString)
        }
    })
})

export default UserLoginInput