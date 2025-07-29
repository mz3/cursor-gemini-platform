# Quick Setup Guide

## 1. Set up Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name like "CLI Task Manager"
4. Copy the **Internal Integration Token**

## 2. Share Your Database

1. Open your [Software Backlog database](https://www.notion.so/23fff2c597af80328ea0c6dd02467973)
2. Click the "..." menu in the top right
3. Select "Add connections"
4. Find and select your integration
5. Click "Confirm"

## 3. Configure the CLI

```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your credentials
```

Edit `.env`:
```env
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=23fff2c597af80328ea0c6dd02467973
DEFAULT_STATUS=Backlog
DEFAULT_PRIORITY=Medium
```

## 4. Test the CLI

```bash
# Test the structure
npm run test

# Try creating a task interactively
npm run dev create

# Or create a task with command line options
npm run dev create -- --title "Test task" --status "Backlog"
```

## 5. Database Schema Requirements

Make sure your Notion database has these properties:

- **Title** (Title type) - Required
- **Description** (Text type) - Optional
- **Status** (Select type) - Options: Backlog, In Progress, Review, Done
- **Priority** (Select type) - Options: Low, Medium, High
- **Tags** (Multi-select type) - Optional

## Troubleshooting

- **"NOTION_TOKEN environment variable is required"** - Make sure you copied the integration token correctly
- **"Failed to create task"** - Check that you shared the database with your integration
- **"Database not found"** - Verify the database ID is correct

## Next Steps

Once this is working, you can extend the CLI with:
- List tasks
- Update task status
- Delete tasks
- Search tasks
- Export tasks
