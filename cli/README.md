# Notion CLI

A TypeScript CLI tool for managing tasks in your Notion Kanban board.

## Features

- ✅ Create tasks with interactive prompts or command-line options
- 🏷️ Set task status (Backlog, In Progress, Review, Done)
- ⚡ Set priority levels (Low, Medium, High)
- 🏷️ Add tags to tasks
- 📄 Add descriptions to tasks
- 📋 View database information

## Setup

### 1. Install Dependencies

```bash
cd cli
npm install
```

### 2. Set up Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the integration token
4. Share your database with the integration

### 3. Configure Environment

Copy the example environment file and update it with your settings:

```bash
cp env.example .env
```

Edit `.env` with your Notion credentials:

```env
NOTION_TOKEN=your_notion_integration_token_here
NOTION_DATABASE_ID=23fff2c597af80328ea0c6dd02467973
DEFAULT_STATUS=Backlog
DEFAULT_PRIORITY=Medium
```

### 4. Build the CLI

```bash
npm run build
```

## Usage

### Interactive Task Creation

```bash
npm run dev create
```

This will prompt you for:
- Task title (required)
- Description (optional)
- Status (Backlog, In Progress, Review, Done)
- Priority (Low, Medium, High)
- Tags (comma-separated, optional)

### Command-line Task Creation

```bash
# Basic task
npm run dev create -- --title "Fix login bug"

# Full task with all options
npm run dev create -- \
  --title "Implement user authentication" \
  --description "Add JWT-based authentication with refresh tokens" \
  --status "In Progress" \
  --priority "High" \
  --tags "backend,security,api"
```

### View Database Information

```bash
npm run dev info
```

## Database Schema

The CLI expects your Notion database to have these properties:

- **Title** (Title) - Task name
- **Description** (Text) - Task description (optional)
- **Status** (Select) - Backlog, In Progress, Review, Done
- **Priority** (Select) - Low, Medium, High
- **Tags** (Multi-select) - Custom tags (optional)

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Run Built Version

```bash
npm start create
```

## Error Handling

The CLI includes comprehensive error handling for:
- Missing environment variables
- Invalid Notion API responses
- Network connectivity issues
- Invalid input validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT
