# Development Environment Rules

## Development Mode

### Current Mode: Native Development
- **API**: Run locally from `api/` folder
- **Webapp**: Run locally from `webapp/` folder
- **Bot**: Run locally from `bot/` folder
- **Database**: PostgreSQL via Docker (port 5433)
- **Cache**: Redis via Docker (port 6379)

### Alternative Mode: Docker Development (Disabled)
- All services run in Docker containers
- See Docker rules below for reference

## Native Development Commands

### Start Infrastructure (Docker)
```bash
# Start only database and cache services
docker-compose up postgres redis -d

# Check status
docker-compose ps
```

### Start API Service
```bash
cd api/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev
```

### Start Webapp Service
```bash
cd webapp/
npm run dev
```

### Start Bot Service
```bash
cd bot/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev
```

### Database Operations (Native Mode)
```bash
# Connect to database
psql -h localhost -p 5433 -U platform_user -d platform_db

# Or via Docker if needed
docker exec -it platform-postgres psql -U platform_user -d platform_db

# Generate migration (from api/ folder)
npm run migration:generate -- src/migrations/NewMigration

# Run migrations (from api/ folder)
npm run migration:run

# Revert migration (from api/ folder)
npm run migration:revert

# Check migration status (from api/ folder)
npm run migration:show
```

## Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Start infrastructure
docker-compose up postgres redis -d

# Terminal 2: Start API
cd api/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev

# Terminal 3: Start Webapp
cd webapp/
npm run dev

# Terminal 4: Start Bot (if needed)
cd bot/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev
```

### 2. Service URLs
- **API**: http://localhost:4000
- **Webapp**: http://localhost:3000
- **Database**: localhost:5433
- **Redis**: localhost:6379

### 3. Testing API Endpoints
```bash
# Health check
curl http://localhost:4000/health

# Test API endpoints
curl http://localhost:4000/api/bots
curl http://localhost:4000/api/features
```

## Docker Development Mode (Disabled - For Reference)

### Docker Commands (When switching to Docker mode)
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up api -d
docker-compose up webapp -d
docker-compose up bot -d

# View logs
docker-compose logs api
docker-compose logs webapp
docker-compose logs bot

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

### Database Operations (Docker Mode)
```bash
# Generate migration
docker exec -it api npm run migration:generate -- src/migrations/NewMigration

# Run migrations
docker exec -it api npm run migration:run

# Revert migration
docker exec -it api npm run migration:revert

# Check migration status
docker exec -it api npm run migration:show

# Connect to database
docker exec -it platform-postgres psql -U platform_user -d platform_db
```

## Architecture Overview

### Microservices
- **API Service**: Node.js/Express.js/TypeScript/TypeORM
- **Webapp Service**: React/TypeScript/Vite/Tailwind CSS
- **Bot Service**: Node.js/TypeScript (Worker)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis

### Development Best Practices

#### Code Quality
- Use TypeScript for all services
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Use conventional commits format

#### API Development
- Use TypeORM entities for database models
- Implement proper error handling
- Use JWT for authentication
- Follow RESTful API conventions
- Implement proper validation

#### Frontend Development
- Use React functional components with hooks
- Implement proper state management
- Use Tailwind CSS for styling
- Follow responsive design principles
- Implement proper error boundaries

#### Database Best Practices
- Use migrations for schema changes
- Implement proper relationships
- Use UUIDs for primary keys
- Implement soft deletes where appropriate
- Use proper indexing strategies

## Troubleshooting

### Common Issues

#### API Connection Issues
```bash
# Check if API is running
curl http://localhost:4000/health

# Check API logs
# (In native mode, check terminal output)
# (In Docker mode: docker-compose logs api)
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Test database connection
psql -h localhost -p 5433 -U platform_user -d platform_db

# Check database logs
docker-compose logs postgres
```

#### Webapp Issues
```bash
# Check if webapp is running
curl http://localhost:3000

# Check webapp logs
# (In native mode, check terminal output)
# (In Docker mode: docker-compose logs webapp)
```

#### Migration Issues
```bash
# Check migration status
npm run migration:show

# Reset database (if needed)
docker-compose down postgres
docker volume rm docker_postgres-data
docker-compose up postgres -d
npm run migration:run
```

### Performance Optimization
- Use proper database indexing
- Implement caching strategies
- Optimize API queries
- Use lazy loading for components
- Implement proper pagination

### Security Best Practices
- Use environment variables for secrets
- Implement proper authentication
- Validate all inputs
- Use HTTPS in production
- Implement rate limiting
