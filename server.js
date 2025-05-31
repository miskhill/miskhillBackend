const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { gql } = require('graphql-tag');
const cors = require('cors');
const bodyParser = require('body-parser');
const gel = require('gel');

// Define your GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String
  }

  type Query {
    hello: String
    users: [User!]
  }

  type Mutation {
    createUser(name: String!, email: String): User
  }
`;

const client = gel.createClient();

// Define your resolvers
const resolvers = {
  Query: {
    hello: (parent, args, context, info) => {
      console.log('Request received for hello resolver - timestamp:', new Date().toISOString());
      return 'Hello world!';
    },
    users: async () => {
      console.log('Request received for users resolver - timestamp:', new Date().toISOString());
      return await client.query(`SELECT User { id, name, email };`);
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      console.log(`Request received to create user: ${name}, ${email} - timestamp:`, new Date().toISOString());
      const result = await client.queryOne(
        `INSERT User {
          name := <str>$name,
          email := <optional str>$email
        };`,
        { name, email },
      );
      // The insert query by default returns the id of the new object.
      // We need to fetch the full object if we want to return it.
      // Or, adjust the insert query to return more fields.
      // For simplicity, let's fetch it separately for now.
      return await client.queryRequiredSingle(
        `SELECT User { id, name, email } FILTER .id = <uuid>$id;`,
        { id: result.id },
      );
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
