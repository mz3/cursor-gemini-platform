AI-Assisted Development Prompt: Meta-Application Platform

Objective: Generate a complete, ready-to-develop meta-application platform with Docker Compose, Node.js v24, TypeScript, React, and hot-reloading for all services. The generated platform should require minimal manual revision and support rapid iteration, robust testing, and a modern developer experience.

---

## Project Vision
We are building a highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications. The platform's UI is driven by the same modeling system, creating a "meta" experience. Users define their data schemas, and the platform provides a UI to manage that data and generates, builds, and manages a complete, standalone Dockerized application based on their design.

## App Features

### User Management
- **Authentication**: JWT-based authentication system with secure login/logout
- **User Registration**: User account creation with email and password
- **User Profiles**: User information management and profile updates
- **Session Management**: Secure session handling with token refresh

### Data Modeling System
- **Model Creation**: Visual interface for creating data models with custom fields
- **Field Types**: Support for various data types (text, number, date, boolean, etc.)
- **Model Relationships**: Define relationships between models (one-to-many, many-to-many)
- **Model Validation**: Built-in validation rules and constraints
- **Model Versioning**: Track changes and maintain model history

### Application Management
- **Application Generation**: Automatically generate applications from data models
- **Application Templates**: Pre-built templates for common application types
- **Custom Components**: Create and manage reusable UI components
- **Application Deployment**: Deploy generated applications as standalone Docker containers
- **Application Monitoring**: Track application performance and usage

### Workflow Engine
- **Workflow Design**: Visual workflow builder with drag-and-drop interface
- **Action Library**: Pre-built actions for common operations (API calls, data processing, notifications)
- **Custom Actions**: Create custom actions using JavaScript/TypeScript
- **Workflow Triggers**: Define when workflows should execute (on data change, scheduled, manual)
- **Workflow History**: Track workflow execution and results
- **Error Handling**: Robust error handling and retry mechanisms

### Prompt System with Versioning
- **Prompt Management**: Create, edit, and organize prompts for LLM interactions
- **Prompt Types**: Support for different prompt types (LLM prompts, code generation prompts)
- **Version Control**: Full versioning system for prompts with history tracking
- **Prompt Templates**: Reusable prompt templates with variable substitution
- **Prompt Testing**: Test prompts with sample inputs and view outputs
- **Prompt Categories**: Organize prompts by category and purpose
- **Collaborative Editing**: Multiple users can work on prompts with version tracking

### Code Generation
- **Template Engine**: Advanced template system for generating application code
- **Multi-Language Support**: Generate code in multiple programming languages
- **Code Templates**: Pre-built templates for common application patterns
- **Custom Templates**: Create and manage custom code templates
- **Generated App Storage**: Store and manage generated applications
- **Build System**: Automated build process for generated applications

### Background Processing
- **Job Queue**: Redis-based job queue for background processing
- **Async Operations**: Handle long-running operations asynchronously
- **Job Monitoring**: Track job progress and status
- **Error Recovery**: Automatic retry mechanisms for failed jobs
- **Resource Management**: Efficient resource allocation for background tasks

### API & Integration
- **RESTful API**: Complete REST API with proper HTTP status codes
- **API Documentation**: Auto-generated API documentation
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **CORS Support**: Cross-origin resource sharing configuration
- **Webhook Support**: Webhook system for external integrations
- **API Versioning**: API versioning for backward compatibility

### Database & Storage
- **PostgreSQL Integration**: Full PostgreSQL database integration with TypeORM
- **Data Migration**: Automated database migrations
- **Data Seeding**: Initial data seeding for development and testing
- **Connection Pooling**: Efficient database connection management
- **Data Backup**: Automated backup and recovery systems

### Security Features
- **Password Hashing**: Secure password hashing with bcrypt
- **JWT Authentication**: Stateless authentication with JWT tokens
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Protection**: TypeORM query builder prevents SQL injection
- **XSS Protection**: Cross-site scripting protection
- **CSRF Protection**: Cross-site request forgery protection

### Testing & Quality Assurance
- **Unit Testing**: Comprehensive unit tests with Jest
- **Integration Testing**: API integration tests with Supertest
- **E2E Testing**: End-to-end tests with Cypress
- **Test Coverage**: Maintain >80% test coverage
- **Automated Testing**: CI/CD pipeline with automated testing
- **Performance Testing**: Load testing and performance monitoring

### Developer Experience
- **Hot Reloading**: Live code reloading for all services
- **TypeScript Support**: Full TypeScript support with strict mode
- **ESLint & Prettier**: Code formatting and linting
- **Error Handling**: Comprehensive error handling and logging
- **Debugging Tools**: Built-in debugging and development tools
- **Documentation**: Comprehensive documentation and examples

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
- **Coverage**: Aim for >80% coverage; run `cd platform-api && npm run test:coverage`

# Cursor Rules for Meta-Application Platform

## Security & Privacy
- **Never remember or store user credentials** (passwords, API keys, tokens, etc.) in conversation context
- **Do not reference specific user account details** like email addresses or usernames
- **Use placeholder values** when discussing authentication flows or examples

## Workflow & Problem Solving
- **Favor continuing work without prompting** until the issue is fixed or acceptance criteria are met
- **Proactively debug and fix issues** rather than asking for permission at each step
- **Complete the full solution** before asking for next steps
- **Focus on getting tests passing** and functionality working end-to-end

## Fly.io Cache Busting
- If frontend changes are not being deployed, Fly.io may be using a cached Docker build layer.
- To force a fresh build, use:
  - `fly deploy --build-arg CACHEBUST=$(date +%s)`
  - or `fly deploy --no-cache`
- Making a trivial change to the Dockerfile (like adding a comment) can also bust the cache.
- If issues persist, destroy and recreate the app.
