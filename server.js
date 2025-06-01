const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const fs = require('fs');
const path = require('path');
const { gql } = require('graphql-tag'); // gql will be used by ApolloServer if schema is passed as string, but not strictly needed if typeDefs is AST from loadFileSync
const cors = require('cors');
const bodyParser = require('body-parser');
const gel = require('gel');
const e = require('./dbschema/edgeql-js'); // Import edgeql-js query builder

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf-8');

const client = gel.createClient();

/** @type {import('./generated/graphql').Resolvers} */
const resolvers = {
  Query: {
    hello: (parent, args, context, info) => {
      console.log('Request received for hello resolver - timestamp:', new Date().toISOString());
      return 'Hello world!';
    },
    users: async () => {
      console.log('Request received for users resolver - timestamp:', new Date().toISOString());
      // Use edgeql-js query builder
      return await e.select(e.User, () => ({
        id: true,
        name: true,
        email: true,
      })).run(client);
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      console.log(`Request received to create user: ${name}, ${email} - timestamp:`, new Date().toISOString());
      const newUserQuery = e.select(
        e.insert(e.User, {
          name: name,
          email: email,
        }),
        () => ({
          id: true,
          name: true,
          email: true,
        })
      );
      return await newUserQuery.run(client);
    },
  },
};

async function startServer() {
  const app = express();

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );

  app.use((req, res) => {
    res.status(404).send('Not found');
  });

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();
