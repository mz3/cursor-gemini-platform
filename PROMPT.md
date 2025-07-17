AI-Assisted Development Prompt: Meta-Application Platform

Objective: Generate a complete, ready-to-develop meta-application platform with Docker Compose, Node.js v24, TypeScript, React, and hot-reloading for all services. The generated platform should require minimal manual revision and support rapid iteration, robust testing, and a modern developer experience.

---

## Project Vision
We are building a highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications. The platform's UI is driven by the same modeling system, creating a "meta" experience. Users define their data schemas, and the platform provides a UI to manage that data and generates, builds, and manages a complete, standalone Dockerized application based on their design.

## System Architecture
- **platform-api**: Node.js v24, TypeScript, REST API, TypeORM, JWT auth, connects to Postgres and Redis, uses ts-node-dev for hot reload.
- **platform-ui**: React (TypeScript), Tailwind CSS, React Router, Axios, runs on Node.js v24, uses react-scripts start for hot reload, proxy to API, E2E tests with Cypress.
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
- **E2E**: Cypress for end-to-end tests (`cd platform-ui && npm run test:e2e`)
- **Coverage**: Aim for >80% coverage; run `cd platform-api && npm run test:coverage`
- Test structure: .spec.ts for unit, .integration.ts for integration, .e2e.ts for E2E

## UI/UX Layout
- Sidebar navigation with Dashboard, Models, Applications, Settings
- Top bar with hamburger for mobile, no global "New App" button
- "New Application" button appears only on the Applications page
- Models and Applications pages have their own "New Model"/"New Application" buttons
- Uses React Context for auth, Tailwind for styling, React Router for navigation

## Initial Database Seeding
- On first run, the API seeds the database with default models: User, Model, Application, Property, Relationship, Component, Template
- Default admin user: admin@platform.com / admin123

## Best Practices & Troubleshooting
- Use TypeScript strict mode, proper interfaces, and error handling
- Use ESLint and Prettier for code style
- Use conventional commits and atomic PRs
- Never commit sensitive data; use .env files for secrets
- If hot reload breaks, check volume mounts, file permissions, and restart containers
- For database issues, check health status, connection strings, and seed data
- For frontend issues, check browser console, proxy config, and network requests

## Example docker-compose.yml (abbreviated)
```
version: '3.8'
services:
  platform-api:
    build: ./platform-api
    image: platform-api
    ports: ["4000:4000"]
    volumes:
      - ./platform-api:/app
      - /app/node_modules
    environment: {...}
    depends_on: {...}
  platform-ui:
    build: ./platform-ui
    image: platform-ui
    ports: ["3000:3000"]
    volumes:
      - ./platform-ui:/app
      - /app/node_modules
    environment: {...}
    depends_on: {...}
  worker:
    build: ./worker
    image: platform-worker
    volumes:
      - ./worker:/app
      - /app/node_modules
      - /var/run/docker.sock:/var/run/docker.sock
      - ./generated-apps:/app/generated-apps
    environment: {...}
    depends_on: {...}
  postgres:
    image: postgres:14-alpine
    ports: ["5433:5432"]
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment: {...}
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    environment: {...}
volumes:
  postgres-data:
networks:
  platform-net:
    driver: bridge
```

---

**By following this prompt, the generated platform will be ready for modern, iterative development with hot reload, robust testing, and a clean, maintainable architecture.**
