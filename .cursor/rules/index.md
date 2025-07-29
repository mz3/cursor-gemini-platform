# Cursor Rules Index

## Overview
This document provides an index of all cursor rules and their purposes. These rules help maintain consistency, best practices, and efficient development workflows across the platform.

## Core Development Rules

### 🚀 [Full-Stack Features](./fullstack-features.md)
**Purpose**: Complete pattern for implementing new features spanning backend and frontend
- Backend implementation (entities, migrations, routes)
- Frontend implementation (components, routing)
- Testing patterns and workflows
- File organization and best practices

### 🔧 [Development](./development.md)
**Purpose**: General development workflow and practices
- Feature development workflow
- Microservices architecture overview
- Development commands and container management
- Best practices for code quality, API, frontend, and database
- Troubleshooting guides

### 🗄️ [Migrations](./migrations.md)
**Purpose**: Database migration patterns and commands
- TypeORM migration commands using docker exec
- Migration workflow and best practices
- Database connection and configuration
- TypeORM configuration patterns

## Architecture & Design

### 🏗️ [Architecture](./architecture.md)
**Purpose**: System architecture and design patterns
- Microservices architecture overview
- Service communication patterns
- Data flow and integration points
- Scalability considerations

### 🔐 [Security](./security.md)
**Purpose**: Security best practices and implementation
- Authentication and authorization patterns
- JWT implementation and management
- Input validation and sanitization
- Security headers and middleware

## Testing & Quality

### 🧪 [Testing](./testing.md)
**Purpose**: Testing strategies and implementation
- Unit testing patterns
- Integration testing approaches
- E2E testing with Cypress
- Test coverage and quality metrics

### 🐛 [Bugfixes](./bugfixes.md)
**Purpose**: Bug fixing workflow and practices
- Bug identification and reproduction
- Debugging techniques and tools
- Fix implementation and verification
- Prevention strategies

## DevOps & Deployment

### 🐳 [Docker](./docker.md)
**Purpose**: Containerization and Docker practices
- Docker configuration and optimization
- Container management and monitoring
- Development environment setup
- Production deployment considerations

### 🚀 [Deployment](./deployment.md)
**Purpose**: Deployment strategies and processes
- Production deployment workflows
- Environment configuration
- Monitoring and logging
- Rollback procedures

### 🔄 [CI/CD](./cicd.md)
**Purpose**: Continuous integration and deployment
- Automated testing and building
- Deployment pipelines
- Quality gates and checks
- Release management

## Version Control & Collaboration

### 📝 [Git](./git.md)
**Purpose**: Git workflow and best practices
- Branch naming conventions
- Commit message standards
- Code review processes
- Merge strategies

### 🔄 [Pull Requests](./pull_requests.md)
**Purpose**: Pull request workflow and standards
- PR creation and review process
- Code review guidelines
- Merge criteria and checks
- Documentation requirements

### 🐙 [GitHub](./gh.md)
**Purpose**: GitHub-specific workflows and tools
- Issue management and tracking
- Project board organization
- GitHub Actions integration
- Repository management

### 🚀 [Fly.io](./flyctl.md)
**Purpose**: Fly.io deployment and management
- Application deployment
- Environment configuration
- Scaling and monitoring
- Database management

## Personality & Communication

### 👤 [Personality](./personality.md)
**Purpose**: AI assistant personality and communication style
- Response tone and style
- Technical communication patterns
- User interaction guidelines
- Problem-solving approach

## Documentation

### 📚 [README](./README.md)
**Purpose**: Project documentation standards
- README file structure and content
- API documentation patterns
- Code documentation standards
- User guide creation

## Rule Usage Guidelines

### When to Use Each Rule

#### For New Feature Development
1. Start with **Full-Stack Features** rule for complete implementation pattern
2. Reference **Development** rule for workflow and best practices
3. Use **Migrations** rule for database changes
4. Follow **Testing** rule for comprehensive testing

#### For Bug Fixes
1. Use **Bugfixes** rule for systematic approach
2. Reference **Testing** rule for verification
3. Follow **Git** rule for version control

#### For Deployment
1. Use **Docker** rule for container management
2. Follow **Deployment** rule for production deployment
3. Reference **CI/CD** rule for automated processes

#### For Database Changes
1. Use **Migrations** rule for database schema changes
2. Reference **Development** rule for database best practices
3. Follow **Testing** rule for data integrity verification

### Rule Integration

#### Cross-Reference Patterns
- **Full-Stack Features** references **Migrations** for database changes
- **Development** references **Docker** for container management
- **Testing** references **Security** for security testing
- **Deployment** references **CI/CD** for automated deployment

#### Workflow Integration
1. **Planning**: Use Architecture and Development rules
2. **Implementation**: Use Full-Stack Features and Development rules
3. **Testing**: Use Testing and Security rules
4. **Deployment**: Use Docker, Deployment, and CI/CD rules
5. **Maintenance**: Use Bugfixes and Git rules

## Rule Maintenance

### Updating Rules
- Update rules when new patterns are discovered
- Validate rule recommendations through testing
- Document rule changes in CHANGELOG
- Share rule updates with the team

### Rule Validation
- Test rule recommendations in development environment
- Verify rule consistency across different contexts
- Ensure rules work with current toolchain
- Validate rule effectiveness through user feedback

## Quick Reference

### Common Commands
```bash
# Start development environment
cd docker && docker-compose up --build

# Run migrations
docker exec -it api npm run migration:run

# Access database
docker exec -it postgres psql -U platform_user -d platform_db

# View logs
docker-compose logs [service]

# Rebuild service
docker-compose up --build [service]
```

### File Locations
- **API**: `api/src/` - Backend TypeScript code
- **Frontend**: `webapp/src/` - React TypeScript code
- **Docker**: `docker/` - Container configuration
- **Deployment**: `deploy/` - Production deployment files

### Key Services
- **API**: http://localhost:4000 - Backend API
- **Webapp**: http://localhost:3000 - React frontend
- **Database**: localhost:5433 - PostgreSQL
- **Redis**: localhost:6379 - Cache and message queue

## Rule Effectiveness

### Success Metrics
- Consistent code quality across features
- Reduced development time for new features
- Fewer bugs and deployment issues
- Improved team collaboration and knowledge sharing

### Continuous Improvement
- Regular rule review and updates
- Feedback collection from development team
- Performance monitoring and optimization
- Tool integration and automation
