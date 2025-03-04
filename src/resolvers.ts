import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validateBook } from "./validators";
import type { Context } from "./context";

export const resolvers = {
  Query: {
    me: (_parent: any, _args: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated");
      }
      return context.user;
    },
    books: async (_parent: any, _args: any, { prisma }: Context) => {
      return prisma.book.findMany();
    },
    book: async (_parent: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.book.findUnique({ where: { id } });
    },
  },
  Mutation: {
    signup: async (
      _parent: any,
      {
        email,
        password,
        name,
      }: { email: string; password: string; name?: string },
      { prisma }: Context
    ) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new GraphQLError("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      return { token, user };
    },
    signin: async (
      _parent: any,
      { email, password }: { email: string; password: string },
      { prisma }: Context
    ) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError("Invalid credentials");
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new GraphQLError("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      return { token, user };
    },
    createBook: async (
      _parent: any,
      { input }: { input: any },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      const validatedData = validateBook(input);
      return prisma.book.create({ data: validatedData });
    },
    updateBook: async (
      _parent: any,
      { id, input }: { id: string; input: any },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      const validatedData = validateBook(input, true);
      return prisma.book.update({
        where: { id },
        data: validatedData,
      });
    },
    deleteBook: async (
      _parent: any,
      { id }: { id: string },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      return prisma.book.delete({ where: { id } });
    },
    deleteBooks: async (
      _parent: any,
      { ids }: { ids: string[] },
      { prisma, user }: Context
    ) => {
      if (!user) {
        throw new GraphQLError("Not authenticated");
      }

      const booksToDelete = await prisma.book.findMany({
        where: { id: { in: ids } },
      });

      await prisma.book.deleteMany({
        where: { id: { in: ids } },
      });

      return booksToDelete;
    },
  },
};
