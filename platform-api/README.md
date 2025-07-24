# Platform API

This is the Node.js/TypeScript API service for the Meta-Application Platform. It provides RESTful endpoints, authentication, and database access for the platform.

## Prerequisites
- Node.js 18+ (for local dev)
- Docker & Docker Compose (for containerized dev)
- PostgreSQL and Redis (or use Docker Compose)

## Setup (Local Dev)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set environment variables as needed.
3. Start the database and Redis (or use Docker Compose):
   ```bash
   docker compose up -d postgres redis
   ```

## Running the API (Local Dev)

```bash
npm run dev
```

## Database Migrations

- **Run migrations:**
  ```bash
  npm run migrate
  ```
- **Revert last migration:**
  ```bash
  npm run migration:revert
  ```

## Seeding the Database

- **Seed initial data:**
  ```bash
  npm run seed
  ```

## Testing

- **Unit tests:**
  ```bash
  npm run test:unit
  ```
- **Integration tests:**
  ```bash
  npm run test:integration
  ```
- **All tests:**
  ```bash
  npm test
  ```

## Useful NPM Scripts

- `npm run dev` — Start the API in development mode with hot reload
- `npm run migrate` — Compile and run all pending database migrations
- `npm run seed` — Compile and run the seed script to populate the database
- `npm run test:unit` — Run all unit tests (files matching `.spec.ts` or `health.test.ts`)
- `npm run test:integration` — Run all integration tests (files matching `.integration.ts`)
- `npm test` — Run all tests

## Docker Compose

To run the API and all dependencies in Docker Compose:

```bash
docker compose up --build
```

- The API will be available at `http://localhost:4000`
- The database at `localhost:5433` (Postgres)
- Redis at `localhost:6379`

## Notes
- Use the provided migration and seed scripts to keep your database schema and data up to date.
- For CI/CD, use the same npm scripts for migrations and tests.
