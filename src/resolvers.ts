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
        // Admins can see all tickets, users see only their own
        authorId: user.role === UserRole.ADMIN ? undefined : user.id,
      };

      if (date) {
        const searchDate = new Date(date);
        whereClause.createdAt = {
          gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          lt: new Date(searchDate.setHours(23, 59, 59, 999)),
        };
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      return prisma.ticket.findMany({
        where: whereClause,
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

      return prisma.ticket.create({
        data: {
          subject: validatedInput.subject,
          content: validatedInput.content,
          status: TicketStatus.NEW,
          authorId: user.id,
        },
      });
    },

    takeTicket: async (
      _parent: any,
      { id }: { id: number },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) throw new GraphQLError("Ticket not found");

      if (user.role !== UserRole.ADMIN && ticket.authorId !== user.id) {
        throw new GraphQLError("Unauthorized to take this ticket");
      }

      return prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    },

    completeTicket: async (
      _parent: any,
      { id, resolution }: { id: number; resolution: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({ where: { id } });
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
      });
    },

    cancelTicket: async (
      _parent: any,
      { id, cancelReason }: { id: number; cancelReason: string },
      { prisma, user }: Context
    ) => {
      if (!user) throw new GraphQLError("Not authenticated");

      const ticket = await prisma.ticket.findUnique({ where: { id } });
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
      });
    },

    cancelInProgressTickets: async (
      _parent: any,
      _args: any,
      { prisma, user }: Context
    ) => {
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
};
