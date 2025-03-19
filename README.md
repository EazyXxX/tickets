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
```
