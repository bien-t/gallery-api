import {
GraphQLObjectType,
GraphQLNonNull,
GraphQLID,
GraphQLString,
GraphQLList

} from 'graphql'


const User = new GraphQLObjectType({
    name:'User',
    fields:()=>({
        _id:{
            type:new GraphQLNonNull(GraphQLID)
        },
        email:{
            type: new GraphQLNonNull(GraphQLString)
        },
        images:{
            type: new GraphQLList(new GraphQLNonNull(GraphQLID))
        }
    })
})

export default User