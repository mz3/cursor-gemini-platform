# Development Rules

## Feature Development Workflow

### 1. Planning & Requirements
- Start with clear requirements and acceptance criteria
- Plan database schema changes first
- Design API endpoints and frontend components
- Consider testing strategy early

### 2. Database-First Approach
- **Entity Design**: Define TypeORM entities with proper relationships
- **Migration Generation**: Use `docker exec -it api npm run migration:generate` in api/
- **Migration Execution**: Run migrations with `docker exec -it api npm run migration:run` in api/
- **Database Seeding**: Use `docker exec -it api npm run seed` in api/ for test data
- **Relationship Types**: Always use `Relation<T>` generic for TypeORM relationships

### 3. API Development
- **Route Structure**: Follow RESTful conventions
- **Validation**: Use class-validator for input validation
- **Error Handling**: Implement comprehensive error handling
- **Authentication**: Use JWT middleware for protected routes
- **Testing**: Write unit and integration tests

### 4. Frontend Development
- **Component Structure**: Use functional components with hooks
- **State Management**: Use React Context for global state
- **API Integration**: Use axios for API calls
- **Styling**: Use Tailwind CSS for styling
- **Testing**: Write unit tests with React Testing Library

### 5. Testing Strategy
- **Unit Tests**: Focus on business logic (Jest for API, React Testing Library for UI)
- **Integration Tests**: Test API endpoints with Supertest
- **E2E Tests**: Use Cypress for end-to-end testing
- **Coverage Goal**: Maintain >80% test coverage
- **Test Order**: Unit → Integration → E2E (fastest to slowest)

## Microservices Architecture

### Service Overview
- **api**: Node.js/TypeScript backend (port 4000)
  - Express.js, TypeORM, JWT auth
  - PostgreSQL database, Redis cache
  - Hot reload with ts-node-dev
- **webapp**: React frontend (port 3000)
  - React, TypeScript, Tailwind CSS
  - Vite for development, hot reload
  - Proxy to API for development
- **bot**: Background worker service
  - Node.js/TypeScript background processing
  - Redis job queue integration
  - Docker image building capabilities
- **postgres**: PostgreSQL database (port 5433)
  - Persistent data storage
  - Health checks and monitoring
- **redis**: Redis cache/message queue (port 6379)
  - Session storage and job queuing
  - Health checks and monitoring

### Development Environment
- **Docker Compose**: All services run in containers
- **Volume Mounts**: Source code mounted for hot reload
- **Network**: Services communicate via Docker network
- **Environment**: Consistent environment across team

## Development Commands

### Starting Development
```bash
# Start all services
cd docker && docker compose up --build

# Start specific service
docker compose up api

# View logs
docker logs <service> --tail 50

# Access container shell
docker exec -it <service> sh
```

### Database Operations (Docker Environment)
```bash
# Generate migration
docker exec -it api npm run migration:generate -- src/migrations/NewMigration

# Run migrations
docker exec -it api npm run migration:run

# Revert migration
docker exec -it api npm run migration:revert

# Seed database
docker exec -it api npm run seed

# Check database
docker exec -it postgres psql -U platform_user -d platform_db

# View database tables
docker exec -it postgres psql -U platform_user -d platform_db -c "\dt"

# Check specific table
docker exec -it postgres psql -U platform_user -d platform_db -c "SELECT * FROM [table_name];"
```

### Testing Commands
```bash
# API unit tests
docker exec -it api npm run test:unit

# API integration tests
docker exec -it api npm run test:integration

# Webapp unit tests
docker exec -it webapp npm test

# Webapp E2E tests
docker exec -it webapp npm run test:e2e

# All tests
docker exec -it api npm run test:unit && docker exec -it api npm run test:integration && docker exec -it webapp npm test
```

### Container Management
```bash
# Rebuild specific service
docker-compose up --build [service]

# Restart specific service
docker-compose restart [service]

# Stop and remove containers
docker-compose down

# View running containers
docker-compose ps

# View container logs
docker-compose logs [service]
```

## Best Practices

### Code Quality
- **TypeScript**: Use strict mode, proper interfaces, avoid `any`
- **Naming**: Use clear, descriptive names for functions and variables
- **Functions**: Keep functions small and focused
- **Error Handling**: Use try-catch, custom errors, proper logging
- **Documentation**: Add inline comments and update README files

### Database Best Practices
- **Relationships**: Use `Relation<T>` generic for TypeORM relationships
- **Migrations**: Always generate migrations for schema changes using docker exec
- **Indexing**: Add indexes for frequently queried fields
- **Validation**: Use database constraints and application validation
- **Seeding**: Maintain consistent seed data for development

### API Best Practices
- **RESTful Design**: Follow REST conventions
- **Status Codes**: Use appropriate HTTP status codes
- **Response Format**: Consistent JSON response format
- **Error Messages**: Clear, actionable error messages
- **Rate Limiting**: Implement rate limiting for public endpoints

### Frontend Best Practices
- **Component Design**: Reusable, composable components
- **State Management**: Minimize prop drilling with Context
- **Performance**: Use React.memo, useMemo, useCallback appropriately
- **Accessibility**: Follow WCAG guidelines
- **Responsive Design**: Mobile-first approach with Tailwind

## Troubleshooting

### Hot Reload Issues
1. **Check Volume Mounts**: Verify source code is mounted correctly
2. **File Permissions**: Ensure proper file permissions
3. **Container Restart**: Restart affected container
4. **Logs**: Check container logs for errors
5. **Node Modules**: Ensure node_modules is excluded from mounts

### Database Issues
1. **Container Health**: Verify PostgreSQL container is healthy
2. **Migrations**: Run pending migrations with docker exec
3. **Connection**: Check database connection settings
4. **Seed Data**: Verify seed data is loaded
5. **Network**: Ensure services can communicate

### Test Failures
1. **Environment**: Ensure all containers are running
2. **Database State**: Check database state and migrations
3. **Port Conflicts**: Verify no port conflicts
4. **Dependencies**: Ensure all dependencies are installed
5. **Logs**: Check test logs for specific errors

### Network Issues
1. **Service Names**: Use Docker service names, not localhost
2. **Network**: Verify services are on same Docker network
3. **Ports**: Check port mappings in docker-compose.yml
4. **Health Checks**: Ensure dependent services are healthy
5. **DNS**: Use service names for internal communication

### Migration Issues
1. **Use Docker Exec**: Always use `docker exec -it api` for migration commands
2. **Check Entity Config**: Verify entity is properly configured
3. **Review Migration**: Check generated migration file for accuracy
4. **Database Connection**: Ensure API can connect to database
5. **Rollback**: Test migration rollback if needed

## Development Workflow Updates

### After Feature Completion
- Update this development.md file with any new processes
- Document any discovered best practices
- Update README files with new instructions
- Share learnings with the team

### Continuous Improvement
- **Process Updates**: Update rules when better processes are discovered
- **Tool Integration**: Integrate new tools and practices
- **Documentation**: Keep documentation current
- **Testing**: Validate all rule recommendations

## Environment Configuration

### Development Environment Variables
```bash
# API Environment
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_USER=platform_user
DB_PASSWORD=platform_password
DB_NAME=platform_db
REDIS_HOST=redis
REDIS_PORT=6379
API_PORT=4000
JWT_SECRET=dev-jwt-secret

# Webapp Environment
REACT_APP_API_URL=http://api:4000
REACT_APP_WS_URL=ws://api:4000
```

### TypeORM Configuration
```typescript
// Example TypeORM relationship
@Entity()
export class User {
  @OneToOne(() => UserSettings, settings => settings.user)
  settings: Relation<UserSettings>;
}

@Entity()
export class UserSettings {
  @OneToOne(() => User, user => user.settings)
  user: Relation<User>;
}
```

## Performance Considerations

### Development Performance
- **Hot Reload**: Use volume mounts for fast development
- **Caching**: Leverage Docker layer caching
- **Parallel Testing**: Run tests in parallel when possible
- **Resource Limits**: Monitor container resource usage

### Production Performance
- **Database Indexing**: Optimize database queries
- **Caching**: Implement Redis caching strategies
- **CDN**: Use CDN for static assets
- **Monitoring**: Implement performance monitoring
