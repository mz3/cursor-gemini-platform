# Cursor Rules Index

This directory contains comprehensive rules and guidelines for the cursor-gemini-platform project. These rules are organized by category and provide specific guidance for different aspects of development.

## Core Development Rules

### 🚀 [Full-Stack Features](./fullstack-features.md)
**Purpose**: Complete pattern for implementing new features spanning backend and frontend
- Backend implementation (entities, migrations, routes)
- Frontend implementation (components, routing)
- Testing patterns and workflows
- File organization and best practices

### 🔧 [Development](./development.md)
**Purpose**: General development workflow and practices
- **Current Mode**: Native Development (API/Webapp/Bot run locally, DB/Redis via Docker)
- **Alternative Mode**: Docker Development (all services in containers - disabled)
- Feature development workflow
- Microservices architecture overview
- Development commands and container management
- Best practices for code quality, API, frontend, and database
- Troubleshooting guides

### 🗄️ [Migrations](./migrations.md)
**Purpose**: Database migration patterns and commands
- **Current Mode**: Native migration commands (from api/ folder)
- **Alternative Mode**: Docker migration commands (disabled - for reference)
- Migration workflow and best practices
- Database connection and configuration
- TypeORM configuration patterns
- Troubleshooting migration issues

## Development Modes

### Native Development Mode (Current)
- **API**: Run locally from `api/` folder with environment variables
- **Webapp**: Run locally from `webapp/` folder with `npm run dev`
- **Bot**: Run locally from `bot/` folder with environment variables
- **Database**: PostgreSQL via Docker (port 5433)
- **Cache**: Redis via Docker (port 6379)

### Docker Development Mode (Disabled)
- All services run in Docker containers
- See individual rule files for Docker commands
- Used for reference when switching to Docker mode

## Quick Start Commands

### Native Development
```bash
# Start infrastructure
docker-compose up postgres redis -d

# Start API
cd api/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev

# Start Webapp
cd webapp/
npm run dev

# Start Bot (if needed)
cd bot/
NODE_ENV=development DB_HOST=127.0.0.1 DB_PORT=5433 DB_USER=platform_user DB_PASSWORD=platform_password DB_NAME=platform_db REDIS_HOST=127.0.0.1 REDIS_PORT=6379 npm run dev
```

### Database Operations (Native Mode)
```bash
# Generate migration
cd api/
npm run migration:generate -- src/migrations/NewMigration

# Run migrations
npm run migration:run

# Check status
npm run migration:show
```

## Service URLs
- **API**: http://localhost:4000
- **Webapp**: http://localhost:3000
- **Database**: localhost:5433
- **Redis**: localhost:6379

## Architecture Overview

### Microservices
- **API Service**: Node.js/Express.js/TypeScript/TypeORM
- **Webapp Service**: React/TypeScript/Vite/Tailwind CSS
- **Bot Service**: Node.js/TypeScript (Worker)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis

### Development Best Practices
- Use TypeScript for all services
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Use conventional commits format
- Implement proper error handling
- Use JWT for authentication
- Follow RESTful API conventions
- Use React functional components with hooks
- Implement proper state management
- Use Tailwind CSS for styling

## Troubleshooting

### Common Issues
- **API Connection**: Check if API is running on port 4000
- **Database Connection**: Verify PostgreSQL is running on port 5433
- **Webapp Issues**: Check if webapp is running on port 3000
- **Migration Issues**: Ensure you're in the api/ folder when running migrations

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

## Rule Updates

### When to Update Rules
- After implementing new features that change development patterns
- When discovering better practices or workflows
- When adding new tools or technologies
- When fixing common issues or pain points

### How to Update Rules
1. Identify the specific rule file that needs updating
2. Make the necessary changes
3. Update this index file if needed
4. Test the new rules in practice
5. Document any learnings or improvements

## Usage Guidelines

### For New Features
1. Check the [Full-Stack Features](./fullstack-features.md) guide
2. Follow the established patterns for entities, migrations, routes, and components
3. Use the native development commands from [Development](./development.md)
4. Follow migration patterns from [Migrations](./migrations.md)

### For Database Changes
1. Create or update TypeORM entities
2. Generate migrations using native commands
3. Review and test migrations
4. Update database configuration if needed

### For API Development
1. Follow RESTful conventions
2. Implement proper error handling
3. Use JWT authentication where needed
4. Write comprehensive tests

### For Frontend Development
1. Use React functional components with hooks
2. Implement proper state management
3. Use Tailwind CSS for styling
4. Follow responsive design principles

## Environment Configuration

### Required Environment Variables
```bash
# API Environment
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=platform_user
DB_PASSWORD=platform_password
DB_NAME=platform_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
API_PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Development Tools
- **TypeScript**: Strict mode for all services
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeORM**: Database ORM
- **React**: Frontend framework
- **Tailwind CSS**: Styling framework
- **Vite**: Build tool for webapp
