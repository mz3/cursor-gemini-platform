# Application Builder Service

This service handles the generation and building of user applications. It's a background worker that processes build jobs from Redis queues.

## Purpose

The Application Builder Service is responsible for:
- Processing application build requests
- Generating React applications from user specifications
- Building Docker images for applications
- Managing the build pipeline

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webapp UI     │    │   API Service   │    │  Builder Service │
│                 │    │                 │    │   (this folder)  │
│ • Create Apps   │───▶│ • Queue Build   │───▶│ • Generate Code │
│ • Manage Apps   │    │ • Track Status  │    │ • Build Docker  │
│ • Deploy Apps   │    │ • Handle Auth   │    │ • File Ops      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Differences from User Bots

| Aspect | Application Builder | User Bots |
|--------|-------------------|-----------|
| **Purpose** | Build applications | AI chat assistants |
| **Who uses** | Platform system | End users |
| **Execution** | Background worker | API calls |
| **Technology** | Code generation | AI/ML (Gemini) |
| **Scale** | One per deployment | Multiple per user |

## Development

```bash
# Start the builder service
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

## Build Process

1. **Job Reception**: Receives build jobs from Redis queue
2. **Code Generation**: Uses EJS templates to generate React code
3. **File Operations**: Creates application structure and files
4. **Docker Build**: Builds Docker image for the application
5. **Status Update**: Updates application status in database

## Security

- All file operations are sandboxed to safe directories
- Docker builds run in isolated containers
- Input validation on all user specifications
- Rate limiting on build requests
