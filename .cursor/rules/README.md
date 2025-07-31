# Cursor Rules for Meta-Application Platform

This directory contains comprehensive Cursor rules that provide AI assistance with context-aware guidance for the Meta-Application Platform project.

## Rule Structure

### Core Rules (Always Applied)

#### `000-core-project.mdc`
**Always Applied** - Contains the fundamental project context, tech stack, and development patterns.

**What it covers:**
- Project overview and architecture
- Technology stack (Node.js, React, TypeORM, PostgreSQL, Redis)
- Development environment setup
- File organization patterns
- Core development patterns
- Authentication and security
- Deployment strategies

**When to use:** This rule is automatically applied to all files and provides the foundation context for the entire project.

### Auto-Attached Rules

#### `100-backend-patterns.mdc`
**Auto-attached to:** `api/**/*.ts`

**What it covers:**
- TypeORM entity patterns and relationships
- Express route structure and CRUD operations
- Service layer patterns and business logic
- DTO validation patterns
- Database migration patterns
- Error handling strategies
- Authentication middleware
- Testing patterns for backend code

**When to use:** Automatically applied when working on backend TypeScript files.

#### `200-frontend-patterns.mdc`
**Auto-attached to:** `webapp/**/*.tsx`, `webapp/**/*.ts`

**What it covers:**
- React component patterns and structure
- Form handling with React Hook Form
- API integration with Axios and React Query
- State management with React Context
- Tailwind CSS styling patterns
- Component testing strategies
- Routing patterns with React Router
- Error handling and loading states

**When to use:** Automatically applied when working on frontend React/TypeScript files.

#### `300-bot-patterns.mdc`
**Auto-attached to:** `bot/**/*.ts`

**What it covers:**
- Background worker service patterns
- Redis job queue management
- AI service integration (Gemini API)
- Docker image building and deployment
- File system operations and templating
- Error handling and retry logic
- Configuration management
- Testing strategies for worker services

**When to use:** Automatically applied when working on bot service TypeScript files.

#### `400-docker-patterns.mdc`
**Auto-attached to:** `docker/**/*`, `**/Dockerfile`, `**/docker-compose*.yml`

**What it covers:**
- Multi-service container architecture
- Docker Compose configuration patterns
- Dockerfile optimization strategies
- Nginx configuration for production
- Development vs production patterns
- Security best practices
- Performance optimization
- Monitoring and health checks

**When to use:** Automatically applied when working on Docker-related files.

#### `500-deployment-patterns.mdc`
**Auto-attached to:** `deploy/**/*`, `fly.*.toml`

**What it covers:**
- Fly.io deployment architecture
- Multi-app deployment strategies
- Environment and secrets management
- Scaling and performance optimization
- CI/CD integration patterns
- Troubleshooting and monitoring
- Security and backup strategies
- Cost optimization techniques

**When to use:** Automatically applied when working on deployment-related files.

#### `600-testing-patterns.mdc`
**Auto-attached to:** `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx`, `cypress/**/*`

**What it covers:**
- Unit testing patterns for backend services
- Integration testing for API endpoints
- Component testing for React components
- E2E testing with Cypress
- Test data factories and utilities
- Performance testing strategies
- Memory leak detection
- Test organization and best practices

**When to use:** Automatically applied when working on test files.

## How to Use These Rules

### 1. Automatic Context
The rules are automatically applied based on file patterns, so you don't need to manually reference them. When you're working on:
- Backend code → `100-backend-patterns.mdc` is automatically applied
- Frontend code → `200-frontend-patterns.mdc` is automatically applied
- Bot service code → `300-bot-patterns.mdc` is automatically applied
- Docker files → `400-docker-patterns.mdc` is automatically applied
- Deployment files → `500-deployment-patterns.mdc` is automatically applied
- Test files → `600-testing-patterns.mdc` is automatically applied

### 2. Asking for Help
When asking Cursor for help, the AI will automatically have context from the relevant rules. For example:

**For backend development:**
```
"Create a new entity for managing user preferences"
```
The AI will use patterns from `000-core-project.mdc` and `100-backend-patterns.mdc`.

**For frontend development:**
```
"Create a React component for displaying user preferences"
```
The AI will use patterns from `000-core-project.mdc` and `200-frontend-patterns.mdc`.

**For testing:**
```
"Write tests for the user preferences API"
```
The AI will use patterns from `000-core-project.mdc` and `600-testing-patterns.mdc`.

### 3. Manual Rule References
You can also manually reference specific rules using the `@rule-name` syntax:

```
@backend-patterns help me create a new service following our patterns
@frontend-patterns create a form component for user registration
@testing-patterns write integration tests for the user API
```

## Rule Development Guidelines

### Adding New Rules
1. **Follow the naming convention:** `[number]-[name].mdc`
2. **Use proper frontmatter:** Include description, globs, and alwaysApply settings
3. **Keep rules focused:** Each rule should cover a specific domain or concern
4. **Include examples:** Provide concrete code examples and patterns
5. **Update this README:** Document new rules and their usage

### Rule Content Guidelines
1. **Be specific:** Include actual code examples and patterns
2. **Be comprehensive:** Cover common scenarios and edge cases
3. **Be practical:** Focus on patterns that are actually used in the project
4. **Be maintainable:** Keep rules updated as the project evolves

### Rule Organization
- **000-099:** Always applied rules (core project context)
- **100-199:** Auto-attached rules for specific file types
- **200-299:** Manual workflow rules (triggered with @rule-name)
- **300-399:** Template rules (referenced by other rules)

## Best Practices

### 1. Context-Aware Development
The rules provide context for the AI to understand your project structure and patterns. Use this to your advantage by:
- Asking for specific implementations that follow your patterns
- Requesting code that integrates with your existing architecture
- Seeking solutions that use your established technologies and libraries

### 2. Pattern Consistency
The rules ensure consistency across the codebase by:
- Enforcing standard patterns for entities, services, and components
- Maintaining consistent error handling and validation
- Promoting reusable code structures
- Ensuring proper testing coverage

### 3. Learning and Documentation
The rules serve as living documentation that:
- Documents the project's architecture and patterns
- Provides examples for common development tasks
- Guides new developers on project conventions
- Evolves with the project as patterns change

## Troubleshooting

### Rules Not Working?
1. **Check file extensions:** Rules use `.mdc` extension
2. **Verify frontmatter:** Ensure proper YAML configuration
3. **Check glob patterns:** Make sure file paths match the patterns
4. **Restart Cursor:** Rules may need a restart to take effect

### AI Ignoring Rules?
1. **Check rule length:** Very long rules may overwhelm the AI
2. **Verify specificity:** Make sure rules are specific to your project
3. **Update examples:** Ensure examples match your current codebase
4. **Check conflicts:** Multiple rules might conflict with each other

### Performance Issues?
1. **Optimize rule size:** Keep rules focused and concise
2. **Use specific globs:** Target only relevant file types
3. **Cache rules:** Cursor caches rules for better performance
4. **Monitor usage:** Check which rules are being applied most

## Contributing

### Updating Rules
1. **Edit the rule file:** Modify the `.mdc` file directly
2. **Test the changes:** Verify the rule works as expected
3. **Update documentation:** Keep this README current
4. **Commit changes:** Version control your rule updates

### Adding New Patterns
1. **Identify the need:** Look for repeated patterns in your code
2. **Create examples:** Build concrete examples of the pattern
3. **Add to appropriate rule:** Place in the most relevant rule file
4. **Test with AI:** Verify the AI follows the new pattern

### Rule Maintenance
1. **Regular reviews:** Periodically review and update rules
2. **Remove outdated patterns:** Delete patterns no longer used
3. **Add new technologies:** Include new libraries and tools
4. **Refactor as needed:** Reorganize rules for better clarity

## Advanced Usage

### Custom Rule Development
You can create custom rules for specific workflows:

```markdown
---
description: "Custom workflow for feature development"
alwaysApply: false
---

# Feature Development Workflow

## Steps
1. Create entity in `api/src/entities/`
2. Generate migration
3. Create service in `api/src/services/`
4. Create routes in `api/src/routes/`
5. Create React components in `webapp/src/components/`
6. Add tests for all layers
7. Update documentation

## Templates
Use the provided templates for consistent implementation.
```

### Rule Composition
Rules can reference each other and build upon common patterns:

```markdown
---
description: "Advanced entity patterns"
globs: ["api/**/*.ts"]
alwaysApply: false
---

# Advanced Entity Patterns

## Complex Relationships
See @backend-patterns for basic entity patterns, then add:

- Many-to-many with custom join tables
- Polymorphic relationships
- Soft deletes with timestamps
- Audit trails and versioning
```

This comprehensive rule system provides AI assistance that understands your project's architecture, patterns, and conventions, enabling faster and more consistent development across the entire Meta-Application Platform.
