import {
    GraphQLSchema
} from 'graphql'
import QueryType from './queries.js';
import MutationType from './mutations.js';

const schema = new GraphQLSchema({
    query:QueryType,
    mutation:MutationType
});


export default schema;