# Meta-Application Platform

A highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications powered by ai bots.

## Cursor Rules / Documentation

Make sure to keep cursor rules short and simple, using effective rules only and no unnecessary detail.

Update cursor rules and documentation as you learn. For example, when running docker commands, if you use an unsupported flag or run the command from the wrong dir, add the correct command to the documentatin for next time.

## Tech Stack

### Backend (API)
- **Runtime**: Node.js v24 + TypeScript
- **Framework**: Express.js
- **ORM**: TypeORM with PostgreSQL
- **Authentication**: JWT + bcryptjs
- **Validation**: class-validator + Joi
- **Testing**: Jest + Supertest
- **Port**: 4000

### Frontend (Webapp)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Lucide React icons
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Query (@tanstack/react-query)
- **Testing**: Jest + Cypress E2E
- **Port**: 3000 (served by Nginx)

### Worker (Bot)
- **Runtime**: Node.js v24 + TypeScript
- **Queue**: Redis for job processing
- **File System**: fs-extra for operations
- **Templating**: EJS for code generation

### Infrastructure
- **Database**: PostgreSQL 14 (port 5433)
- **Cache/Queue**: Redis 7 (port 6379)
- **Containerization**: Docker + Docker Compose
- **Deployment**: Fly.io with separate apps for API and UI

## Development Environment

### Local Development
```bash
# Start all services
cd docker
docker-compose -f docker-compose.dev1.yml -p platform-dev1 up -d

# API development
cd api
npm run dev                    # Start with hot reload
npm run migration:run         # Run database migrations
npm run test:unit            # Run unit tests
npm run test:integration     # Run integration tests

# Frontend development
cd webapp
npm run dev                  # Start Vite dev server (hot reload enabled)
npm run test:e2e:local      # Run E2E tests locally

# Bot development
cd bot
npm run dev                  # Start with hot reload
```

### Development Workflow
- **Frontend Changes**: Vite hot reloads automatically - no container restart needed
- **Backend Changes**: May require container restart: `docker restart api`
- **Database Changes**: Run migrations: `docker exec -it api npm run migration:run`
- **Container Restart**: Only needed for Dockerfile changes or backend API modifications

### Database Operations
```bash
cd api

# Run migrations
npm run migration:run

# Generate new migration
npm run migration:generate -- src/migrations/[MigrationName]

# Revert migration
npm run migration:revert
```

## File Organization

### Project Structure
```
cursor-gemini-platform/
├── api/                    # Backend API service
├── webapp/                 # React frontend
├── bot/                    # Background worker
├── cli/                    # Notion CLI tools
├── docker/                 # Docker configuration
├── deploy/                 # Deployment files
└── telegram/               # Telegram bot integration
```

### API Structure
```
api/src/
├── entities/               # TypeORM entities
├── routes/                 # Express routes
├── services/               # Business logic
├── config/                 # Configuration
├── middleware/             # Express middleware
├── migrations/             # Database migrations
├── fixtures/               # Seed data
└── utils/                  # Utilities
```

### Frontend Structure
```
webapp/src/
├── components/             # React components
├── contexts/               # React contexts
├── services/               # API services
├── utils/                  # Utilities
└── index.tsx              # App entry point
```

## Core Patterns

### Backend Patterns
- **Entities**: Use TypeORM decorators with proper relationships
- **Routes**: RESTful endpoints with proper error handling
- **Services**: Business logic separation from routes
- **Validation**: Use class-validator for DTOs
- **Testing**: Unit tests for services, integration tests for routes

### Frontend Patterns
- **Components**: Functional components with TypeScript interfaces
- **State Management**: React Query for server state, React Context for auth and global state
- **API Integration**: Axios with proper error handling
- **Styling**: Tailwind CSS with dark mode support
- **Testing**: Jest for unit tests, Cypress for E2E

### Database Patterns
- **Migrations**: Timestamped migration files
- **Entities**: Proper relationships and constraints
- **Seeding**: Fixture-based database seeding
- **UUIDs**: Use UUIDs for all primary keys

## AI Models Feature

### Backend AI Models
- **Entity**: `AIModel` with provider enum (gemini, openai, anthropic, deepseek, local)
- **Services**: Individual LLM services (GeminiService, OpenAIService, ClaudeService, DeepSeekService, LocalLLMService)
- **Factory**: `LLMServiceFactory` for provider selection
- **Routes**: `/api/ai-models` with CRUD operations, test connection, and response generation
- **Integration**: Bots link to AI models via `aiModelId` foreign key

### Frontend AI Models
- **Components**: AIModels (list), CreateAIModel, EditAIModel, ViewAIModel (with test chat)
- **Service**: `aiModelService.ts` with React Query hooks
- **Features**: Provider icons, test connection, chat interface, model selection in Bot forms
- **Routing**: `/ai-models`, `/ai-models/create`, `/ai-models/:id`, `/ai-models/:id/edit`

### LLM Provider Support
- **Gemini**: Google's Gemini models (🤖)
- **OpenAI**: ChatGPT models (🧠)
- **Anthropic**: Claude models (🎭)
- **DeepSeek**: DeepSeek models (🔍)
- **Local**: LM Studio local models (🏠)

### AI Model Configuration
- **API Keys**: Stored in Secrets entity, linked via `secretId`
- **Base URLs**: Configurable for local LLMs (e.g., LM Studio)
- **Model IDs**: Provider-specific model identifiers
- **Capabilities**: Text description of model capabilities
- **Configuration**: JSON field for provider-specific settings

## Authentication & Security
- **JWT**: Token-based authentication
- **Password Hashing**: bcryptjs for password security
- **CORS**: Proper CORS configuration
- **Helmet**: Security headers middleware
- **Input Validation**: Comprehensive validation on all inputs

## Deployment
- **Fly.io**: Separate apps for API and UI
- **Docker**: Multi-stage builds for production
- **Environment**: Proper environment variable management
- **Secrets**: Fly.io secrets for sensitive data
- **Scaling**: Horizontal scaling with Fly.io
- You are developer number 1 and you use the dev1 environment.

You use the docker-compose.dev1.yml containers and don't interfere with other containers running in docker.

## Docker Compose Commands

**ALWAYS** use the explicit docker-compose file and project name to avoid using dev1 containers:
- Use: `docker-compose -f docker-compose-dev1.yml -p platform-dev1 up -d`
- Use: `docker-compose -f docker-compose-dev1.yml -p platform-dev1 build`
- Use: `docker-compose -f docker-compose-dev1.yml -p platform-dev1 logs`
- Use: `docker-compose -f docker-compose-dev1.yml -p platform-dev1 exec`

**NEVER** use just `docker-compose` without the `-f` flag, as it may default to the wrong configuration file.

**NEVER** use just `docker-compose` without the `-p` or `--project-name` flag, as it may default to the wrong configuration.

When running local containers, start them in the background (i.e. `docker compose up -d`) and then use `docker logs` to make sure they start correctly. Note that using `-f` with `docker logs` will keep the terminal open indefinitely.

Do not use `docker compose down` as even with the `-f` flag it will shut down other containers. Instead use `docker stop` with the 5 dev1 container IDs to avoid interfering with other dev environments.

## Container Names

The correct container names from docker-compose-dev1.yml are:
- `webapp-dev1` (not webapp)
- `api-dev1` (not api)
- `bot-worker-dev1` (not bot-worker)
- `platform-postgres-dev1` (not platform-postgres)
- `platform-redis-dev1` (not platform-redis)

## Avoiding environment conflicts

**CRITICAL: Never interfere with dev1 environment**
- NEVER run `docker-compose down` without specifying the exact file
- NEVER kill or restart dev1 containers
- ALWAYS use explicit docker-compose files: `docker-compose -f docker-compose.dev1.yml`
- ALWAYS check which containers are running before making changes
- If dev1 containers are running, leave them alone and work with dev1 only
