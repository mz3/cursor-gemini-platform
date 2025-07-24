# feature development

- start with requirements and planning
- implement db layer first, then api, then frontend
- write unit, integration, and e2e tests (aim for >80% coverage)
- use docker compose for local dev; all services have volume mounts for hot reload
- api uses ts-node-dev, ui uses react-scripts start, worker uses ts-node-dev
- to run migrations: npm run migration:run (in platform-api)
- to seed database: npm run seed (in platform-api)
- check container logs to verify hot reload worked correctly after modifications
- rebuild container(s) if hot reload did not trigger correctly
- check container logs to verify apps started correctly when starting them up
- push to feature branch, monitor CI
- merge only after all tests pass

## microservices overview
- platform-api: Node.js/TypeScript API (4000)
- platform-ui: React frontend (3000)
- worker: Node.js/TypeScript background worker
- postgres: PostgreSQL (5433)
- redis: Redis (6379)

## test structure
- unit: jest (api), react-testing-library (ui)
- integration: supertest (api)
- e2e: cypress (ui)
- run all tests in docker containers
- coverage goal: >80%

## debugging
- api: docker logs, Postman/curl, check DB/Redis
- frontend: browser console, proxy config, network tab
- db: psql, check migrations, seed data

## best practices
- use strict TypeScript, proper interfaces, avoid any
- keep code organized, use clear naming, small functions
- use try-catch, custom errors, log errors
- document endpoints, update README, add inline comments

## troubleshooting
- hot reload: check volume mounts, permissions, restart containers
- networking: use service names, not localhost
- db: check container health, run migrations, verify seed data
