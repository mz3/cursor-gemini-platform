# Bot Processing Worker

The Bot Processing Worker is a dedicated service for handling asynchronous bot message processing and tool execution in the Meta Platform.

## 🎯 Purpose

This worker processes bot messages from Redis queues, executes tools, and generates responses using LLM services. It's designed to handle the heavy computational work of bot interactions without blocking the main API thread.

## 🏗️ Architecture

```
API Server → Redis Queue → Bot Worker → LLM + Tools → Response
```

### Key Features

- **Async Processing**: Bot messages are queued and processed asynchronously
- **Tool Execution**: Supports all tool types (HTTP, Database, Shell, MCP, etc.)
- **LLM Integration**: Uses Google Gemini for response generation
- **Error Handling**: Robust error handling with retry mechanisms
- **Real-time Updates**: Publishes results back to Redis for real-time updates

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- Google Gemini API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=platform_user
DB_PASSWORD=platform_password
DB_NAME=platform_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Gemini API
GEMINI_KEY=your_gemini_api_key_here

# Environment
NODE_ENV=development
```

### Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 How It Works

### 1. Message Queue Processing

The worker listens to the `bot_messages` Redis queue for incoming bot messages:

```typescript
// Example message structure
{
  botId: "uuid",
  userId: "uuid", 
  message: "list my models",
  instanceId?: "uuid"
}
```

### 2. Tool Detection & Execution

The worker detects tool calls in user messages and executes them:

```typescript
// Tool detection patterns
- "list my models" → list_models operation
- "show applications" → list_applications operation
- "search for users" → search_platform operation
```

### 3. LLM Response Generation

Uses Google Gemini to generate contextual responses:

```typescript
const response = await geminiService.generateResponse(
  promptContext,
  conversationHistory,
  userMessage
);
```

### 4. Result Publishing

Publishes results back to Redis for real-time updates:

```typescript
await publishEvent('bot_responses', {
  instanceId,
  botId,
  userId,
  userMessage,
  botResponse
});
```

## 🛠️ Tool Types Supported

### MCP Tools (Platform API SDK)
- `list_models` - List user's data models
- `list_applications` - List user's applications
- `list_bots` - List user's bots
- `list_prompts` - List user's prompts
- `get_user_info` - Get user information
- `search_platform` - Search across platform data

### HTTP Tools
- API requests to external services
- REST API calls
- Webhook notifications

### Database Tools
- SQL queries
- Data operations
- Schema management

### Shell Tools
- System commands
- File operations
- Process management

### Custom Scripts
- JavaScript execution
- Data processing
- Business logic

## 📊 Monitoring

### Logs
The worker provides detailed logging:

```
🤖 Processing message for bot abc-123: "list my models"
🔧 Tool detected: platform-api-sdk (mcp_tool)
📝 Extracted params: {"operation":"list_models","userId":"user-456"}
✅ Bot message processed successfully
```

### Health Checks
Monitor worker health through Redis:

```bash
# Check worker status
redis-cli GET bot_worker:status

# Check queue length
redis-cli LLEN bot_messages
```

## 🔄 Integration with API

The main API server queues bot messages instead of processing them directly:

```typescript
// API routes queue messages
await publishEvent('bot_messages', {
  botId,
  userId,
  message,
  instanceId
});
```

## 🚨 Error Handling

### Retry Logic
- Failed tool executions are retried
- LLM errors are handled gracefully
- Database connection issues are recovered

### Error Events
Errors are published to Redis for monitoring:

```typescript
await publishEvent('bot_errors', {
  botId,
  userId,
  instanceId,
  error: error.message
});
```

## 🔒 Security

### Tool Execution Safety
- Shell commands are whitelisted
- File operations are restricted to safe directories
- Database queries are validated
- Custom scripts run in sandboxed environment

### Authentication
- User context is maintained throughout processing
- Tool access is controlled by user permissions
- API keys are securely managed

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📈 Performance

### Optimization Features
- Connection pooling for database
- Redis connection reuse
- Efficient tool detection patterns
- Token usage optimization

### Scaling
- Multiple worker instances can run simultaneously
- Redis queue ensures load distribution
- Stateless design for horizontal scaling

## 🔮 Future Enhancements

- **WebSocket Support**: Real-time communication
- **Advanced Tool Types**: More sophisticated tool capabilities
- **Plugin System**: Extensible tool architecture
- **Analytics**: Detailed usage metrics
- **A/B Testing**: Bot response optimization

---

**Meta Platform Bot Worker** - Making AI interactions asynchronous and scalable! 🤖✨
