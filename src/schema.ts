import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  type Query {
    me: User
    tickets(date: DateTime, startDate: DateTime, endDate: DateTime): [Ticket!]!
  }

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    signin(email: String!, password: String!): AuthPayload!
    createTicket(subject: String!, content: String!): Ticket!
    takeTicket(id: Int!): Ticket!
    completeTicket(id: Int!, resolution: String!): Ticket!
    cancelTicket(id: Int!, cancelReason: String!): Ticket!
    cancelInProgressTickets: CancellationResult!
  }

  type User {
    id: Int!
    email: String!
    name: String
    role: UserRole!
    tickets: [Ticket!]!
  }

  type Ticket {
    id: Int!
    subject: String!
    content: String!
    status: TicketStatus!
    resolution: String
    cancelReason: String
    createdAt: String!
    updatedAt: String!
    author: User!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type CancellationResult {
    message: String!
  }

  enum TicketStatus {
    NEW
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum UserRole {
    USER
    ADMIN
  }
`;
