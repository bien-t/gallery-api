import {
    GraphQLObjectType,
} from 'graphql'


const Logout = new GraphQLObjectType({
    name: 'Logout',
    fields: () => ({
        message: String
    })
})

export default Logout