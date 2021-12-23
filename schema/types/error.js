import {
 GraphQLObjectType,
 GraphQLNonNull,
 GraphQLString
} from 'graphql'


const Error = new GraphQLObjectType({
    name:'Error',
    fields:()=>({
        message:{
            type: new GraphQLNonNull(GraphQLString)
        }
    })
})

export default Error