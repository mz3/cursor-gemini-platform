# Meta-Application Platform

A highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications powered by AI bots with agentic capabilities.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webapp UI     │    │   API Service   │    │  Builder Service │
│                 │    │                 │    │   (./bot)        │
│ • Create Apps   │───▶│ • User Bots     │    │ • Generate Code │
│ • Manage Bots   │    │ • Agentic Tools │    │ • Build Docker  │
│ • Chat with Bots│    │ • Gemini AI     │    │ • File Ops      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Key Features

### 🤖 **Agentic User Bots**
- **AI-Powered Chat**: Conversational bots using Google's Gemini AI
- **Tool Integration**: Bots can execute HTTP requests, file operations, database queries, and custom scripts
- **Multi-Modal**: Support for text, code, and structured data
- **Real-time Chat**: Live conversation with persistent history

### 🛠️ **Application Builder**
- **Visual Design**: Drag-and-drop application creation
- **Code Generation**: Automatic React application generation
- **Docker Deployment**: Containerized application deployment
- **Template System**: Reusable application templates

### 🔧 **Tool System**
Users can equip their bots with powerful tools:

| Tool Type | Description | Example Use |
|-----------|-------------|-------------|
| **HTTP Request** | Make API calls | Weather data, stock prices |
| **File Operation** | Read/write files | Log analysis, data processing |
| **Database Query** | Query databases | User data, analytics |
| **Shell Command** | Execute commands | System info, file operations |
| **Custom Script** | JavaScript code | Calculations, data transformation |
| **Workflow Action** | Execute workflows | Complex business logic |

## 🏛️ Project Structure

```
cursor-gemini-platform/
├── api/                    # Backend API service (User Bots + Tools)
├── webapp/                 # React frontend
├── bot/                    # Application Builder Service
├── cli/                    # Notion CLI tools
├── docker/                 # Docker configuration
├── deploy/                 # Deployment files
└── telegram/               # Telegram bot integration
```

## 🛠️ Tech Stack

### Backend (API)
- **Runtime**: Node.js v24 + TypeScript
- **Framework**: Express.js
- **ORM**: TypeORM with PostgreSQL
- **AI**: Google Gemini API
- **Authentication**: JWT + bcryptjs
- **Port**: 4000

### Frontend (Webapp)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Lucide React
- **Port**: 3000

### Builder Service (./bot)
- **Runtime**: Node.js v24 + TypeScript
- **Queue**: Redis for job processing
- **Templating**: EJS for code generation
- **File System**: fs-extra for operations

### Infrastructure
- **Database**: PostgreSQL 14 (port 5433)
- **Cache/Queue**: Redis 7 (port 6379)
- **Containerization**: Docker + Docker Compose
- **Deployment**: Fly.io

## 🚀 Quick Start

### Local Development
```bash
# Start all services
cd docker
docker-compose up --build

# API development
cd api
npm run dev
npm run migration:run

# Frontend development
cd webapp
npm run dev

# Builder service
cd bot
npm run dev
```

### Database Operations
```bash
cd api

# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- src/migrations/[MigrationName]
```

## 🤖 Bot Examples

### Weather Bot
```typescript
// Tool: HTTP Request
{
  name: "weather_api",
  type: "http_request",
  config: {
    url: "https://api.openweathermap.org/data/2.5/weather?q={{city}}&appid={{api_key}}",
    method: "GET"
  }
}
```

### File Analyzer Bot
```typescript
// Tool: File Operation
{
  name: "file_reader",
  type: "file_operation",
  config: {
    operation: "read",
    path: "/app/data/{{filename}}"
  }
}
```

### Calculator Bot
```typescript
// Tool: Custom Script
{
  name: "calculator",
  type: "custom_script",
  config: {
    script: "return eval(params.expression);"
  }
}
```

## 🔒 Security Features

- **Sandboxed Execution**: All tool operations run in isolated environments
- **Rate Limiting**: Prevents abuse of AI and tool APIs
- **Input Validation**: Comprehensive validation on all inputs
- **Authentication**: JWT-based user authentication
- **Authorization**: User ownership verification for all resources

## 📊 Monitoring & Logging

- **Health Checks**: Automated monitoring of all services
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Metrics**: Response time and token usage tracking
- **Audit Logs**: All tool executions are logged for security

## 🚀 Deployment

### Fly.io Deployment
```bash
# Deploy API
cd deploy
fly deploy --app your-api-app

# Deploy UI
fly deploy --app your-ui-app
```

### Environment Variables
```bash
# Required for API
GEMINI_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret

# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=platform_db
DB_USER=platform_user
DB_PASSWORD=platform_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ using TypeScript, React, and AI**
