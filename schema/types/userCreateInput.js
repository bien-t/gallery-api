import {
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLString
} from 'graphql'

const UserCreateInput = new GraphQLInputObjectType({
    name:'UserCreateInput',
    fields:()=>({
        email:{
            type:new GraphQLNonNull(GraphQLString)
        },
        confirmEmail:{
            type:new GraphQLNonNull(GraphQLString)
        },
        password:{
            type:new GraphQLNonNull(GraphQLString)
        },
        confirmPassword:{
            type:new GraphQLNonNull(GraphQLString)
        }
    })
})

export default UserCreateInput