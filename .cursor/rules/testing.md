# Testing Rules

## Testing Strategy Overview

### Test Pyramid
- **Unit Tests**: Fast, focused tests for individual functions/components (70%)
- **Integration Tests**: Test API endpoints and service interactions (20%)
- **E2E Tests**: Full user journey tests (10%)

### Coverage Goals
- **Overall Coverage**: >80% code coverage
- **Critical Paths**: 100% coverage for authentication, data operations
- **Business Logic**: High coverage for core business functions
- **API Endpoints**: All endpoints covered by integration tests

## Test Environment Setup

### Prerequisites
- **Docker Environment**: All tests run in Docker containers
- **Database**: PostgreSQL with test data
- **Redis**: Redis instance for testing
- **Network**: Services communicate via Docker network

### Environment Verification
```bash
# Verify containers are running
docker ps

# Check service health
docker compose ps

# Verify network connectivity
docker network inspect platform-net
```

## API Testing

### Unit Tests (api/)
**Framework**: Jest
**Location**: `api/src/__tests__/`
**Command**: `docker exec -it api npm run test:unit`

#### Test Structure
```typescript
// Example unit test
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await userService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
  });
});
```

#### Testing Guidelines
- **Mock Dependencies**: Mock external dependencies (database, Redis)
- **Isolation**: Each test should be independent
- **Fast Execution**: Unit tests should run quickly
- **Clear Naming**: Use descriptive test names
- **Edge Cases**: Test error conditions and edge cases

### Integration Tests (api/)
**Framework**: Jest + Supertest
**Location**: `api/src/__tests__/`
**Command**: `docker exec -it api npm run test:integration`

#### Test Structure
```typescript
// Example integration test
describe('Auth API', () => {
  describe('POST /auth/login', () => {
    it('should authenticate valid user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@platform.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });
});
```

#### Testing Guidelines
- **Database State**: Use test database with known state
- **Authentication**: Test with valid/invalid credentials
- **Error Handling**: Test error responses
- **Validation**: Test input validation
- **Status Codes**: Verify correct HTTP status codes

## Frontend Testing

### Unit Tests (webapp/)
**Framework**: Jest + React Testing Library
**Location**: `webapp/src/__tests__/`
**Command**: `docker exec -it webapp npm test`

#### Test Structure
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import { Login } from '../Login';

describe('Login Component', () => {
  it('should render login form', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockLogin = jest.fn();
    render(<Login onLogin={mockLogin} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

#### Testing Guidelines
- **Component Isolation**: Test components in isolation
- **User Interactions**: Test user interactions and events
- **Accessibility**: Test accessibility features
- **Props Testing**: Test component props and callbacks
- **Error States**: Test error handling and loading states

### E2E Tests (webapp/)
**Framework**: Cypress
**Location**: `webapp/cypress/e2e/`
**Command**: `docker exec -it webapp npm run test:e2e`

#### Test Structure
```typescript
// Example E2E test
describe('User Authentication', () => {
  it('should allow user to login and access dashboard', () => {
    cy.visit('/login');

    cy.get('[data-testid=email-input]').type('admin@platform.com');
    cy.get('[data-testid=password-input]').type('admin123');
    cy.get('[data-testid=login-button]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=user-menu]').should('be.visible');
  });
});
```

#### Testing Guidelines
- **Real User Scenarios**: Test complete user journeys
- **Cross-Browser**: Test in multiple browsers
- **Mobile Responsive**: Test mobile interactions
- **Performance**: Monitor test performance
- **Visual Testing**: Test visual elements and layouts

## Database Testing

### Migration Testing
```bash
# Test migration generation
docker exec -it api npm run migration:generate -- src/migrations/TestMigration

# Test migration execution
docker exec -it api npm run migration:run

# Test migration revert
docker exec -it api npm run migration:revert
```

### Seed Data Testing
```bash
# Test database seeding
docker exec -it api npm run seed

# Verify seed data
docker exec -it postgres psql -U platform_user -d platform_db -c "SELECT * FROM users;"
```

## Test Data Management

### Test Database Setup
```typescript
// Example test database setup
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();

  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase();
});
```

### Test Data Guidelines
- **Isolation**: Each test should have isolated data
- **Consistency**: Use consistent test data across tests
- **Realistic**: Use realistic but minimal test data
- **Cleanup**: Clean up test data after tests
- **Factories**: Use factory functions for test data creation

## Performance Testing

### Load Testing
```bash
# API load testing
docker exec -it api npm run test:load

# Database performance testing
docker exec -it api npm run test:db-performance
```

### Performance Guidelines
- **Response Times**: Monitor API response times
- **Database Queries**: Optimize database queries
- **Memory Usage**: Monitor memory consumption
- **Concurrent Users**: Test with multiple concurrent users

## Security Testing

### Authentication Testing
```typescript
// Test authentication security
describe('Authentication Security', () => {
  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
  });
});
```

### Security Guidelines
- **Input Validation**: Test malicious input handling
- **Authentication**: Test authentication bypass attempts
- **Authorization**: Test unauthorized access attempts
- **Data Protection**: Test data exposure prevention

## Test Commands Reference

### Running Tests
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

### Test Development
```bash
# Watch mode for development
docker exec -it api npm run test:unit -- --watch
docker exec -it webapp npm test -- --watch

# Run specific test file
docker exec -it api npm run test:unit -- auth.test.ts

# Run tests with coverage
docker exec -it api npm run test:unit -- --coverage
```

### Debugging Tests
```bash
# Debug API tests
docker exec -it api npm run test:unit -- --verbose

# Debug webapp tests
docker exec -it webapp npm test -- --verbose

# View test logs
docker logs api --tail 100
docker logs webapp --tail 100
```

## Test Documentation

### Test Documentation Guidelines
- **README Updates**: Update README with test instructions
- **Test Descriptions**: Write clear test descriptions
- **Setup Instructions**: Document test setup requirements
- **Troubleshooting**: Document common test issues

### Test Maintenance
- **Regular Updates**: Keep tests up to date with code changes
- **Refactoring**: Refactor tests when code changes
- **Coverage Monitoring**: Monitor test coverage trends
- **Performance Monitoring**: Monitor test execution time

## Troubleshooting

### Common Test Issues

#### Test Environment Issues
1. **Container Not Running**: Ensure all containers are running
2. **Database Connection**: Check database connection settings
3. **Network Issues**: Verify Docker network connectivity
4. **Port Conflicts**: Check for port conflicts

#### Test Failures
1. **Flaky Tests**: Identify and fix flaky tests
2. **Timing Issues**: Add appropriate waits and timeouts
3. **Data State**: Ensure consistent test data state
4. **Async Issues**: Handle async operations properly

#### Performance Issues
1. **Slow Tests**: Optimize test execution time
2. **Memory Leaks**: Monitor memory usage in tests
3. **Resource Cleanup**: Ensure proper resource cleanup
4. **Parallel Execution**: Use parallel test execution when possible

### Debugging Commands
```bash
# Check test environment
docker compose ps

# View test logs
docker logs api --tail 50
docker logs webapp --tail 50

# Access test container
docker exec -it api sh
docker exec -it webapp sh

# Check test database
docker exec -it postgres psql -U platform_user -d platform_db
```

## Best Practices

### Test Organization
- **File Structure**: Organize tests by feature/component
- **Naming Convention**: Use descriptive test names
- **Test Isolation**: Ensure tests don't depend on each other
- **Setup/Teardown**: Use proper setup and teardown

### Test Quality
- **Readability**: Write readable and maintainable tests
- **Reliability**: Ensure tests are reliable and consistent
- **Completeness**: Test all important scenarios
- **Performance**: Keep tests fast and efficient

### Continuous Integration
- **Automated Testing**: Run tests automatically on code changes
- **Coverage Reports**: Generate and monitor coverage reports
- **Test Results**: Track and analyze test results
- **Failure Alerts**: Set up alerts for test failures
