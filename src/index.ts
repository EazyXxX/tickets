import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { createLogger } from "./utils/logger";
import { context } from "./context";

const logger = createLogger();
const app = express();

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const corsOptions = {
    origin: "*", // TODO: заменить на домен моего приложения
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  await server.start();

  app.use(cors(corsOptions));
  app.use(morgan("dev"));
  app.use(express.json());

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context,
    })
  );

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
});

//TODO Нужно доделать функционал связанный с access и refresh токенами
