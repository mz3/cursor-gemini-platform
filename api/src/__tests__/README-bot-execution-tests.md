# Bot Execution API Integration Tests

This document describes the comprehensive integration tests for the bot execution system.

## Overview

The bot execution integration tests verify the complete workflow of:
1. Starting bot instances
2. Managing bot status
3. Sending messages and receiving responses
4. Retrieving conversation history
5. Stopping bot instances

## Test Structure

### Test Setup
- Creates test user, prompt, and bot entities
- Sets up database connections
- Cleans up test data after completion

### Test Categories

#### 1. Bot Lifecycle Management
- **Start Bot**: Tests bot instance creation and startup
- **Stop Bot**: Tests bot instance shutdown
- **Status Check**: Tests bot status retrieval

#### 2. Chat Functionality
- **Send Message**: Tests message sending and response generation
- **Conversation History**: Tests message history retrieval
- **Multiple Messages**: Tests conversation flow

#### 3. Error Handling
- **Missing Parameters**: Tests validation for required fields
- **Invalid IDs**: Tests handling of non-existent resources
- **Edge Cases**: Tests long messages, empty content, etc.

#### 4. Concurrent Operations
- **Multiple Users**: Tests multiple users with different bots
- **Isolation**: Ensures user/bot data isolation

## API Endpoints Tested

### POST /api/bot-execution/:botId/start
- ✅ Start bot instance successfully
- ✅ Return 400 when userId is missing
- ✅ Return 404 for non-existent bot

### POST /api/bot-execution/:botId/stop
- ✅ Stop bot instance successfully
- ✅ Return 400 when userId is missing

### GET /api/bot-execution/:botId/status
- ✅ Return bot instance status
- ✅ Return 400 when userId is missing
- ✅ Return null for non-existent instance

### POST /api/bot-execution/:botId/chat
- ✅ Send message and receive bot response
- ✅ Return 400 when userId is missing
- ✅ Return 400 when message is missing
- ✅ Return 400 when both are missing

### GET /api/bot-execution/:botId/chat
- ✅ Return conversation history
- ✅ Return 400 when userId is missing
- ✅ Accept limit parameter

## Complete Workflow Tests

### 1. Full Bot Lifecycle
```
Start Bot → Check Status → Send Message → Get History → Stop Bot
```

### 2. Multi-Message Conversation
```
Start Bot → Send Message 1 → Send Message 2 → Send Message 3 → Stop Bot
```

### 3. Concurrent Users
```
User 1: Start Bot A → Send Message → Stop Bot A
User 2: Start Bot B → Send Message → Stop Bot B
```

## Running the Tests

### Prerequisites
- API server running on port 4000
- Database connection established
- Test database with proper schema

### Run All Bot Execution Tests
```bash
cd api
npm test -- --testPathPattern=bot-execution.integration.ts
```

### Run Specific Test Categories
```bash
# Run only lifecycle tests
npm test -- --testNamePattern="Bot Lifecycle"

# Run only chat tests
npm test -- --testNamePattern="Chat Functionality"

# Run only error handling tests
npm test -- --testNamePattern="Error Handling"
```

### Run with Verbose Output
```bash
npm test -- --testPathPattern=bot-execution.integration.ts --verbose
```

## Test Data

### Test User
- Email: test@example.com
- Name: Test User

### Test Bot
- Name: test-bot
- Display Name: Test Bot
- Description: A test bot for integration testing

### Test Prompt
- Name: Test Prompt
- Content: "You are a helpful AI assistant. Respond to user messages in a friendly and helpful manner."

## Expected Test Results

### Successful Test Run
```
✅ POST /api/bot-execution/:botId/start - 3 tests passed
✅ POST /api/bot-execution/:botId/stop - 2 tests passed
✅ GET /api/bot-execution/:botId/status - 3 tests passed
✅ POST /api/bot-execution/:botId/chat - 4 tests passed
✅ GET /api/bot-execution/:botId/chat - 3 tests passed
✅ Complete Bot Workflow - 2 tests passed
✅ Error Handling - 4 tests passed
✅ Concurrent Operations - 1 test passed
```

### Total: 22 tests passed

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure database is running
   - Check database credentials
   - Verify schema migrations

2. **API Server Not Running**
   - Start API server: `npm run dev`
   - Check port 4000 is available

3. **Test Data Cleanup Failed**
   - Check database permissions
   - Verify foreign key constraints

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm test -- --testPathPattern=bot-execution.integration.ts
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Bot Execution Tests
  run: |
    cd api
    npm test -- --testPathPattern=bot-execution.integration.ts --ci
```

### Docker Test Environment
```bash
# Run tests in Docker container
docker exec -it api npm test -- --testPathPattern=bot-execution.integration.ts
```

## Performance Considerations

- Tests create and destroy database entities
- Each test runs in isolation
- Cleanup ensures no test data remains
- Concurrent tests verify system scalability

## Security Testing

- Input validation for all endpoints
- SQL injection prevention
- User authorization checks
- Data isolation between users

## Future Enhancements

1. **WebSocket Testing**: Add real-time messaging tests
2. **Load Testing**: Test with multiple concurrent users
3. **Performance Testing**: Measure response times
4. **Security Testing**: Add penetration test scenarios 