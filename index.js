import { ApolloServer, AuthenticationError } from 'apollo-server-express'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import depthLimit from 'graphql-depth-limit'
import { createComplexityLimitRule } from 'graphql-validation-complexity'
import { graphqlUploadExpress } from 'graphql-upload'

import express from 'express'
import http from 'http';
import helmet from 'helmet'
import db from './db.js';
import schema from './schema/index.js'
import models from './models/index.js';
import session from 'express-session'
import connectStore from 'connect-mongo'
import path from 'path'
import { fileURLToPath } from 'url';
import mongoose from "mongoose";

const port = process.env.PORT || 4000
const url = {
  mongoUrl: process.env.MONGODB_URL || process.env.MONGO_HOST ||
    'mongodb://' + (process.env.IP || 'localhost') + ':' + (process.env.MONGO_PORT || '27017') + '/gallery'
}
const corsOptions = {
  credentials: true,
  origin: process.env.CLIENT_SERVER || 'http://localhost:1234'
}

const requireAuth = (req, res, next) => {
  if (req && req.session && req.session.id && req.session.user) {
    if (req.params.userId === req.session.user._id) {
      next()
    }
  }
}

const router = express.Router()
router.route('/image/:userId/:imageId').get(requireAuth, async (req, res) => {
  const checkId = mongoose.Types.ObjectId.isValid(req.params.imageId)
  if(checkId){
    const image = await models.Image.findById(req.params.imageId)
    if(image===null){
       return res.sendStatus(404)
    }
    res.header('Access-Control-Allow-Origin', corsOptions.origin)
    res.header('Access-Control-Allow-Credentials', true)
    return res.sendFile(path.join(__dirname, `upload/${image.path}`))
  } else {
    return res.sendStatus(404)
  }
})

router.route('/save/:userId/:imageId').get(requireAuth, async (req, res) => {
  const checkId = mongoose.Types.ObjectId.isValid(req.params.imageId)
  if(checkId){
    const image = await models.Image.findById(req.params.imageId)

    if(image===null){
       return res.sendStatus(404)
    }

    res.header('Access-Control-Allow-Origin', corsOptions.origin)
    res.header('Access-Control-Allow-Credentials', true)  

    return res.download(path.join(__dirname, `upload/${image.path}`),`${image.name}.${image.type}`)
  } else {
    return res.sendStatus(404)
  }
})

const getUser = async (req) => {
  if (req.body.operationName === 'userLogin' || req.body.operationName === 'userCreate') {
   return true
 } else if (req && req.session && req.session.id && req.session.user) {
   return await models.User.findById(req.session.user._id)
 } else {
   return false
 }  
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function apolloServer(schema) {
  db.connect(url.mongoUrl)
  const app = express()
  app.set("trust proxy", 1);
  app.use(session({
    name: 'gId',
    resave: false,
    secret: 'config.sessionSecret',
    saveUninitialized: false,
    store: connectStore.create({
      mongoUrl: url.mongoUrl,
      collectionName: 'session',
      ttl: 1000 * 60 * 60 / 1000
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
      sameSite: 'none', //set to true for localhost
      secure: true, //set to false for localhost
      httpOnly:true
    }
  }))

  app.use(helmet({
    contentSecurityPolicy: false
  }))

  app.use('/', router)
  app.use(graphqlUploadExpress());

  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema,
    validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: async ({ req, res }) => {
      let user = await getUser(req)
     if (!user) throw new AuthenticationError('you must be logged in');
      return { req, models, res, user }
    },

    formatError: (err) => {
      const errorReport = {
        message: err.message,
        locations: err.locations,
        stack: err.stack ? err.stack.split('\n') : [],
        path: err.path
      }
      console.error('GraphQL Error ', errorReport)
      return { message: errorReport.message }
    }

  })

  await server.start()
  server.applyMiddleware({ app, cors: corsOptions, path: '/api', })

  await new Promise(resolve => httpServer.listen({ port: port }, resolve));
}

apolloServer(schema)
