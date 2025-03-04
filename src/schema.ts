import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    email: String!
    name: String
    avatar: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    year: Int!
    genre: String!
    isbn: String!
    description: String!
    pages: Int!
    language: String!
    rating: Float!
    status: String!
    coverUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateBookInput {
    title: String!
    author: String!
    year: Int!
    genre: String!
    isbn: String!
    description: String!
    pages: Int!
    language: String!
    rating: Float!
    status: String!
    coverUrl: String
  }

  input UpdateBookInput {
    title: String
    author: String
    year: Int
    genre: String
    isbn: String
    description: String
    pages: Int
    language: String
    rating: Float
    status: String
    coverUrl: String
  }

  type Query {
    me: User
    books: [Book!]!
    book(id: ID!): Book
  }

  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    signin(email: String!, password: String!): AuthPayload!
    createBook(input: CreateBookInput!): Book!
    updateBook(id: ID!, input: UpdateBookInput!): Book!
    deleteBook(id: ID!): Book!
    deleteBooks(ids: [ID!]!): [Book!]!
  }
`;
