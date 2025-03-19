# Ticktes backend

### A backend part of the tickets app

## How to run the app?

### Prerequesites:

- npm

- docker

### Installation steps:

1. Run docker daemon

2. Create a container via `npm run start-postgres`

3. Run migrations via `npm run migrate`

4. `npm run dev` for development mode

5. `npm run build` to build the app for production

You should also add .env file with PORT and DATABASE_URL variables in order to start this app.

Example:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/tickets?schema=public"
PORT=3000
JWT_SECRET=your_super_secure_secret_key
```

Apollo Sandbox is available at {PORT}/graphql

You have to authorize via signUp route before making any other queries/mutations.
Just put the received token in `Authorization` header and continue testing this app.

### App's features:

##### Authentication

`signUp`: Create a new user account
`signIn`: Authenticate and receive a JWT token
`me`: Retrieve authenticated user details

##### Ticket Management

Create Ticket: Add a new ticket with subject and content
Take Ticket: Change ticket status to IN_PROGRESS (owner or admin)
Complete Ticket: Mark ticket as completed with resolution (owner or admin)
Cancel Ticket: Cancel ticket with cancelReason (owner or admin)
Fetch Tickets: Retrieve tickets by date, startDate, or endDate (admins see all, users see their own)
Bulk Cancel: Admins can cancel all IN_PROGRESS tickets

##### User Roles

Admin: Full access to all tickets and bulk operations
User: Access only to their own tickets

##### Validation

Input validation using Zod for all operations

### Used technologies:

Node.js, Express, GraphQL, Prisma, JWT, bcrypt, Zod, Apollo Client, Docker, Postgresql
