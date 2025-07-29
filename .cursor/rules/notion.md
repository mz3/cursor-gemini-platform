# Notion CLI and Project Backlog Rules

## Project Backlog Location
- **Primary Backlog**: [Software Backlog](https://www.notion.so/23fff2c597af80328ea0c6dd02467973?v=23fff2c597af8036aa05000c95b4831e&source=copy_link)
- **Database ID**: `23fff2c597af80328ea0c6dd02467973`
- **Board Type**: Kanban with columns: Backlog, In Progress, Review, Done

## Notion CLI Authentication
- **CLI Location**: `/cli` directory in project root
- **Environment File**: `cli/.env` (copy from `cli/env.example`)
- **Required Variables**:
  - `NOTION_TOKEN`: Integration token from Notion
  - `NOTION_DATABASE_ID`: `23fff2c597af80328ea0c6dd02467973`
  - `DEFAULT_STATUS`: `Backlog`
  - `DEFAULT_PRIORITY`: `Medium`

## CLI Usage Commands

### Development Mode
```bash
cd cli
npm run dev create                    # Interactive task creation
npm run dev create -- --title "Task" # Command-line task creation
npm run dev info                      # Show database information
```

### Production Mode
```bash
cd cli
npm run build
npm start create                      # Interactive task creation
npm start create -- --title "Task"   # Command-line task creation
npm start info                        # Show database information
```

### Task Creation Examples
```bash
# Interactive mode
npm run dev create

# Command-line mode
npm run dev create -- --title "Fix login bug" --status "In Progress" --priority "High"
npm run dev create -- --title "Add user authentication" --description "Implement JWT auth" --tags "backend,security"
```

## Database Schema Requirements
- **Title** (Title) - Required task name
- **Description** (Text) - Optional task description
- **Status** (Select) - Backlog, In Progress, Review, Done
- **Priority** (Select) - Low, Medium, High
- **Tags** (Multi-select) - Optional custom tags

## Task Management Workflow
1. **Create tasks** using CLI when starting new work
2. **Update status** manually in Notion as work progresses
3. **Use tags** for categorization (backend, frontend, bug, feature, etc.)
4. **Set priority** based on business impact and urgency

## Integration Setup
1. Create Notion integration at https://www.notion.so/my-integrations
2. Copy integration token to `cli/.env`
3. Share database with integration in Notion
4. Test with `npm run dev info`

## Error Handling
- Missing environment variables show clear error messages
- API errors are caught and displayed with context
- Invalid input is validated before API calls

## Future CLI Features
- List tasks by status/filter
- Update task status
- Delete tasks
- Search tasks
- Export tasks
- Bulk operations
