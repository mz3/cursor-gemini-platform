# Feature Development Workflow

## Phase 1: Requirements & Planning

### 1.1 Requirements Gathering
- **Start with user requirements**: Understand what the user wants to achieve
- **Clarify and complete**: Work with the user to fill in missing details
- **Document requirements**: Write clear, testable requirements
- **Consider edge cases**: Think about error scenarios and boundary conditions

### 1.2 Risk Assessment & Approach
- **Identify risks**: Technical, performance, security, and business risks
- **Evaluate approaches**: Consider multiple implementation strategies
- **Choose the best approach**: Balance complexity, maintainability, and performance
- **Plan the implementation**: Break down into manageable phases

### 1.3 Implementation Plan
- **Database layer**: Schema changes, migrations, entities
- **API layer**: Routes, controllers, services, validation
- **Frontend layer**: Components, state management, UI/UX
- **Testing strategy**: Unit, integration, and E2E tests
- **Deployment considerations**: Migrations, downtime, rollback plan

## Phase 2: Implementation (Local Development)

### 2.1 Database Layer First
```bash
# Start local containers
docker compose up --build postgres redis

# Design and implement database entities
# Create/update TypeORM entities in platform-api/src/entities/
# Generate and test migrations
cd platform-api
npm run migration:generate
npm run migration:run
npm run seed
```

**Checklist:**
- [ ] Entity relationships are correct
- [ ] Migrations run successfully
- [ ] Seed data works with new schema
- [ ] No breaking changes to existing data

### 2.2 API Layer & Unit Tests
```bash
# Implement API routes and controllers
# Add unit tests for new functionality
cd platform-api
npm run test:unit
```

**Checklist:**
- [ ] API endpoints are RESTful
- [ ] Input validation is comprehensive
- [ ] Error handling is proper
- [ ] Unit tests cover all new code
- [ ] All unit tests pass

### 2.3 Integration Tests
```bash
# Test API endpoints with real database
cd platform-api
npm run test:integration
```

**Checklist:**
- [ ] API endpoints work with real database
- [ ] Authentication/authorization works
- [ ] Database operations are correct
- [ ] All integration tests pass

### 2.4 Frontend Implementation
```bash
# Start all local containers
docker compose up --build

# Implement frontend components
# Add/update React components in platform-ui/src/components/
```

**Checklist:**
- [ ] Components are responsive and accessible
- [ ] State management is clean
- [ ] API integration works correctly
- [ ] Error states are handled
- [ ] Loading states are implemented

### 2.5 E2E Testing
```bash
# Run E2E tests locally
cd platform-ui
npm run test:e2e:local
```

**Checklist:**
- [ ] At least one E2E test for the new feature
- [ ] Existing E2E tests still pass
- [ ] User flows work end-to-end
- [ ] No regressions in existing functionality

## Phase 3: CI/CD Validation

### 3.1 Push and Monitor
```bash
# Commit and push changes
git add .
git commit -m "feat: [description of new feature]"
git push

# Monitor CI workflow
export GH_PAGER=cat
gh run list --limit 1
gh run watch [RUN_ID]
```

### 3.2 Debug CI Issues
- **Check logs**: Use `gh run view [RUN_ID] --log` to see detailed logs
- **Fix issues**: Address any failures in unit, integration, or E2E tests
- **Re-run if needed**: Push fixes and monitor again
- **Ensure all tests pass**: Don't proceed until CI is green

**Common CI Issues:**
- Database migration conflicts
- Test environment setup problems
- Frontend build failures
- E2E test flakiness

## Phase 4: Production Deployment

### 4.1 Pre-Deployment Checklist
- [ ] All CI tests pass
- [ ] Database migrations are tested locally
- [ ] Feature is tested in local environment
- [ ] Rollback plan is ready
- [ ] Monitoring/alerting is in place

### 4.2 Deployment Risks & Considerations

**Database Migrations:**
- **Risk**: Breaking changes to production data
- **Mitigation**: Test migrations on production-like data
- **Plan**: Have rollback migration ready

**Downtime Considerations:**
- **Risk**: Service interruption during deployment
- **Mitigation**: Use blue-green deployment or rolling updates
- **Plan**: Schedule maintenance window if needed

**API Changes:**
- **Risk**: Breaking changes to existing clients
- **Mitigation**: Maintain backward compatibility or version APIs
- **Plan**: Communicate changes to API consumers

### 4.3 Deployment Steps

1. **Backup Production Database**
   ```bash
   # Create backup before migration
   pg_dump -h [PROD_HOST] -U [PROD_USER] -d [PROD_DB] > backup.sql
   ```

2. **Run Database Migrations**
   ```bash
   # Apply migrations to production
   cd platform-api
   npm run migration:run
   ```

3. **Deploy Application**
   ```bash
   # Deploy using your deployment method
   # (Docker, Kubernetes, etc.)
   ```

4. **Verify Deployment**
   - Check health endpoints
   - Run smoke tests
   - Monitor logs for errors
   - Verify new feature works

### 4.4 Post-Deployment
- **Monitor**: Watch logs and metrics for issues
- **Test**: Verify feature works in production
- **Document**: Update documentation if needed
- **Communicate**: Notify stakeholders of successful deployment

## Best Practices

### Code Quality
- Follow TypeScript best practices
- Use proper error handling
- Implement comprehensive logging
- Write clear, maintainable code

### Testing
- Aim for >80% test coverage
- Test happy path and error scenarios
- Use realistic test data
- Keep tests fast and reliable

### Security
- Validate all inputs
- Use proper authentication/authorization
- Follow OWASP guidelines
- Review for security vulnerabilities

### Performance
- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Monitor performance metrics

## Troubleshooting

### Common Issues
- **Migration conflicts**: Check for duplicate migrations
- **Test failures**: Ensure test environment matches production
- **Build failures**: Check dependencies and TypeScript errors
- **E2E flakiness**: Add proper waits and retries

### Debugging Commands
```bash
# Check container logs
docker logs platform-api --tail 50
docker logs platform-ui --tail 50

# Check database
docker exec -it postgres psql -U platform_user -d platform_db

# Check Redis
docker exec -it redis redis-cli

# Monitor CI
export GH_PAGER=cat && gh run watch [RUN_ID]
``` 