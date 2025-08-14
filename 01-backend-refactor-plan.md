# Backend Refactor Plan: Model → Schema

## Overview
This document outlines the backend refactor plan to rename "Model" to "Schema" across all backend services (api, bot, cli, telegram). This refactor will be executed in parallel with the frontend refactor.

## Scope
- **Services**: api, bot, cli, telegram
- **Files**: All TypeScript files, database migrations, configuration files
- **Database**: Table names, column names, foreign key constraints
- **API Routes**: Endpoint paths, request/response structures
- **Entity Relationships**: All references to Model entity

## Execution Steps

### Phase 1: Database Schema Changes

#### 1.1 Create New Migration
- **File**: `api/src/migrations/[timestamp]-RenameModelToSchema.ts`
- **Action**: Create migration to:
  - Rename table `models` → `schemas`
  - Rename column `modelId` → `schemaId` in `entities` table
  - Update foreign key constraints
  - Update indexes

#### 1.2 Update Entity Files
- **Files**:
  - `api/src/entities/Model.ts` → `api/src/entities/Schema.ts`
  - `bot/src/entities/Model.ts` → `bot/src/entities/Schema.ts`
- **Actions**:
  - Rename class `Model` → `Schema`
  - Update `@Entity('models')` → `@Entity('schemas')`
  - Update all property names and types

#### 1.3 Update Related Entities
- **Files**:
  - `api/src/entities/Entity.ts`
  - `bot/src/entities/Entity.ts`
  - `api/src/entities/User.ts`
  - `bot/src/entities/User.ts`
- **Actions**:
  - Update imports: `import { Model }` → `import { Schema }`
  - Update property names: `modelId` → `schemaId`
  - Update relationship decorators: `@ManyToOne(() => Model` → `@ManyToOne(() => Schema`
  - Update property types: `model!: Model` → `schema!: Schema`
  - Update array properties: `models!: Relation<Model>[]` → `schemas!: Relation<Schema>[]`

### Phase 2: API Routes and Services

#### 2.1 Rename Route Files
- **Files**:
  - `api/src/routes/modelRoutes.ts` → `api/src/routes/schemaRoutes.ts`
- **Actions**:
  - Rename file
  - Update all imports and references
  - Update route paths: `/api/models` → `/api/schemas`
  - Update variable names: `modelRepository` → `schemaRepository`

#### 2.2 Update Main API Index
- **File**: `api/src/index.ts`
- **Actions**:
  - Update import: `import { modelRoutes }` → `import { schemaRoutes }`
  - Update route registration: `app.use('/api/models', modelRoutes)` → `app.use('/api/schemas', schemaRoutes)`

#### 2.3 Update Database Configuration
- **Files**:
  - `api/src/config/database.ts`
  - `bot/src/config/database.ts`
- **Actions**:
  - Update imports: `import { Model }` → `import { Schema }`
  - Update entities array: `Model,` → `Schema,`

### Phase 3: Bot Service Updates

#### 3.1 Update MCP Tool Service
- **File**: `bot/src/services/mcpToolService.ts`
- **Actions**:
  - Update imports: `import { Model }` → `import { Schema }`
  - Update repository: `modelRepository` → `schemaRepository`
  - Update operation names: `create_model` → `create_schema`, `list_models` → `list_schemas`, etc.
  - Update method names: `createModel` → `createSchema`
  - Update all variable names and comments

#### 3.2 Update Intent Detection Service
- **File**: `bot/src/services/intentDetectionService.ts`
- **Actions**:
  - Update operation names in `getToolOperations()`: `create_model` → `create_schema`, etc.
  - Update parameter examples: `For create_model:` → `For create_schema:`
  - Update all comments and documentation

#### 3.3 Update Bot Entity
- **File**: `bot/src/entities/Bot.ts`
- **Actions**:
  - Update property name: `model!: string` → `schema!: string`
  - Update comments and documentation

### Phase 4: Test Files

#### 4.1 Update Unit Tests
- **Files**:
  - `bot/src/__tests__/intentDetectionService.unit.ts`
- **Actions**:
  - Update test descriptions: `'create a model'` → `'create a schema'`
  - Update operation names: `'create_model'` → `'create_schema'`
  - Update expected values and assertions

### Phase 5: CLI and Telegram Services

#### 5.1 Update CLI (if applicable)
- **Files**: Any CLI files that reference models
- **Actions**:
  - Update all references from "model" to "schema"
  - Update command names and help text

#### 5.2 Update Telegram Bot (if applicable)
- **Files**: Any telegram bot files that reference models
- **Actions**:
  - Update all references from "model" to "schema"
  - Update bot responses and commands

### Phase 6: Fixtures and Seed Data

#### 6.1 Update Fixtures
- **Files**:
  - `api/src/fixtures/models.json` → `api/src/fixtures/schemas.json`
- **Actions**:
  - Rename file
  - Update all references in seed data
  - Update any import statements

#### 6.2 Update Seed Scripts
- **Files**: Any database seeding scripts
- **Actions**:
  - Update table names and column references
  - Update entity creation logic

## Important Notes

### Database Migration Strategy
- The migration should be reversible (include both `up()` and `down()` methods)
- Test the migration on a copy of production data first
- Consider data integrity during the migration

### Breaking Changes
- This is a breaking change that will require frontend updates
- API endpoints will change from `/api/models` to `/api/schemas`
- All client code will need to be updated

### Testing Requirements
- Run all existing tests to ensure they pass
- Update test data and fixtures
- Test database migrations both up and down
- Test API endpoints with new schema names

### Dependencies
- This refactor must be coordinated with the frontend refactor
- Both refactors should be completed before rebuilding containers
- Database migration should be run before starting the updated services

## Validation Checklist

After completing the refactor, verify:

- [ ] All TypeScript files compile without errors
- [ ] All tests pass
- [ ] Database migration runs successfully
- [ ] API endpoints respond correctly with new schema names
- [ ] Bot services work with new schema operations
- [ ] No references to "Model" or "model" remain in backend code
- [ ] Database constraints and relationships are properly updated

## Next Steps

1. Execute this backend refactor plan
2. Coordinate with frontend refactor completion
3. Run integration tests
4. Rebuild containers and deploy

**IMPORTANT**: Do not rebuild or touch containers during this refactor. Only make code changes. Container rebuilding and integration testing will be handled by the third agent after both frontend and backend refactors are complete.
