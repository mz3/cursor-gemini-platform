AI-Assisted Development Prompt: Meta-Application Platform

Objective: Generate a complete, ready-to-develop meta-application platform with Docker Compose, Node.js v24, TypeScript, React, and hot-reloading for all services. The generated platform should require minimal manual revision and support rapid iteration, robust testing, and a modern developer experience.

---

## Project Vision
We are building a highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications. The platform's UI is driven by the same modeling system, creating a "meta" experience. Users define their data schemas, and the platform provides a UI to manage that data and generates, builds, and manages a complete, standalone Dockerized application based on their design.

## System Architecture
- **platform-api**: Node.js v24, TypeScript, REST API, TypeORM, JWT auth, connects to Postgres and Redis, uses ts-node-dev for hot reload.
- **platform-ui**: React (TypeScript), Tailwind CSS, React Router, Axios, runs on Node.js v24, uses Vite for hot reload, proxy to API, E2E tests with Cypress (Playwright is the preferred tool for new E2E tests).
- **worker**: Node.js v24, TypeScript, background jobs, connects to Postgres and Redis, uses ts-node-dev for hot reload, listens to Redis queues, builds Docker images.
- **postgres**: PostgreSQL 14, runs on port 5433, seeded with initial data.
- **redis**: Redis 7, message queue for async jobs.

All custom services use Dockerfiles based on node:24-alpine. Source code is NOT copied into the image; instead, it is mounted as a volume for live reload. node_modules is excluded from mounts to avoid conflicts.

## Docker Compose Configuration
- Compose file defines all 5 services with correct ports, healthchecks, and environment variables.
- platform-api: port 4000, volume ./platform-api:/app, command: npm run dev
- platform-ui: port 3000, volume ./platform-ui:/app, command: npm start
- worker: volume ./worker:/app, command: npm run dev, mounts Docker socket and generated-apps
- postgres: port 5433:5432, volume postgres-data:/var/lib/postgresql/data
- redis: port 6379:6379
- All services on a shared bridge network

## Development Workflow
- Start all services: `docker compose up --build`
- Code changes are reflected live (hot reload) due to volume mounts; no need to rebuild containers for code changes
- If hot reload fails, restart the affected container: `docker restart <service>`
- Logs: `docker logs <service> --tail 50`
- Access container shell: `docker exec -it <service> sh`

## Testing
- **API**: Jest for unit tests, Supertest for integration tests (`cd platform-api && npm test`)
- **UI**: React Testing Library for unit tests (`cd platform-ui && npm test`)
- **E2E**: Cypress for end-to-end tests (`cd platform-ui && npm run test:e2e`). Playwright is the preferred tool for new E2E tests.
- **Coverage**: Aim for >80% coverage; run `
