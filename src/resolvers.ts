import { GraphQLError } from "graphql";
import { TicketStatus, UserRole } from "@prisma/client";
import type { Context } from "./context";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validateSignupInput,
  validateSigninInput,
  validateCreateTicketInput,
  validateUpdateTicketInput,
} from "./validators";

export const resolvers = {
  Query: {
    me: (_parent: any, _args: any, context: Context) => {
      if (!context.user) throw new GraphQLError("Not authenticated");
      return context.user;
    },

    tickets: async (
      _parent: any,
      {
        date,
        startDate,
        endDate,
      }: { date?: string; startDate?: string; endDate?: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      let whereClause: any = {
        authorId: user.role === UserRole.ADMIN ? undefined : user.id,
      };

      if (date) {
        const searchDate = new Date(date);
        if (isNaN(searchDate.getTime())) {
          throw new GraphQLError(
            "Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)."
          );
        }
        whereClause.createdAt = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999)),
        };
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new GraphQLError(
            "Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)."
          );
        }
        whereClause.createdAt = {
          gte: start,
          lte: end,
        };
      }

      return prisma.ticket.findMany({
        where: whereClause,
        include: {
          author: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    signup: async (
      _parent: any,
      args: { email: string; password: string; name?: string },
      { prisma }: Context
    ) => {
      const validatedInput = validateSignupInput(args);
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedInput.email },
      });
      if (existingUser) throw new GraphQLError("User already exists");

      const hashedPassword = await bcrypt.hash(validatedInput.password, 10);
      const user = await prisma.user.create({
        data: {
          email: validatedInput.email,
          password: hashedPassword,
          name: validatedInput.name,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      return { token, user };
    },

    signin: async (
      _parent: any,
      args: { email: string; password: string },
      { prisma }: Context
    ) => {
      const validatedInput = validateSigninInput(args);
      const user = await prisma.user.findUnique({
        where: { email: validatedInput.email },
      });
      if (
        !user ||
        !(await bcrypt.compare(validatedInput.password, user.password))
      ) {
        throw new GraphQLError("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      return { token, user };
    },

    createTicket: async (
      _parent: any,
      args: { subject: string; content: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const validatedInput = validateCreateTicketInput(args);

      const ticket = await prisma.ticket.create({
        data: {
          subject: validatedInput.subject,
          content: validatedInput.content,
          status: TicketStatus.NEW,
          authorId: user.id,
        },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });

      if (!ticket.author) {
        throw new GraphQLError("Author not found for the created ticket");
      }

      return ticket;
    },

    takeTicket: async (
      _parent: any,
      { id }: { id: number },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          author: true,
        },
      });
      if (!ticket) throw new GraphQLError("Ticket not found");

      if (user.role !== UserRole.ADMIN && ticket.authorId !== user.id) {
        throw new GraphQLError("Unauthorized to take this ticket");
      }

      return prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });
    },

    completeTicket: async (
      _parent: any,
      { id, resolution }: { id: number; resolution: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });
      if (!ticket) throw new GraphQLError("Ticket not found");

      if (user.role !== UserRole.ADMIN && ticket.authorId !== user.id) {
        throw new GraphQLError("Unauthorized to complete this ticket");
      }

      const validatedInput = validateUpdateTicketInput({ resolution });
      return prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.COMPLETED,
          resolution: validatedInput.resolution,
        },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });
    },

    cancelTicket: async (
      _parent: any,
      { id, cancelReason }: { id: number; cancelReason: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });
      if (!ticket) throw new GraphQLError("Ticket not found");

      if (user.role !== UserRole.ADMIN && ticket.authorId !== user.id) {
        throw new GraphQLError("Unauthorized to cancel this ticket");
      }

      const validatedInput = validateUpdateTicketInput({ cancelReason });
      return prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.CANCELLED,
          cancelReason: validatedInput.cancelReason,
        },
        include: {
          author: {
            include: {
              tickets: true,
            },
          },
        },
      });
    },

    cancelInProgressTickets: async (
      _parent: any,
      _args: any,
      { prisma, user }: Context
    ) => {
      //NOTE Making current user admin for testing purposes
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { role: UserRole.ADMIN },
      // });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new GraphQLError("Unauthorized to perform bulk cancellation");
      }

      const result = await prisma.ticket.updateMany({
        where: { status: TicketStatus.IN_PROGRESS },
        data: {
          status: TicketStatus.CANCELLED,
          cancelReason: "Bulk cancellation of in-progress tickets",
        },
      });

      return { message: `Cancelled ${result.count} tickets` };
    },
  },

  User: {
    tickets: async (user: any, _args: any, { prisma }: Context) => {
      return prisma.ticket.findMany({
        where: { authorId: user.id },
      });
    },
  },
};
