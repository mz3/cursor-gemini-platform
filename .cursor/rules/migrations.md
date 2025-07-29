# TypeORM Migration Path Pattern (ESM/TypeScript)

## Development Mode: Native Development

### Migration Commands (Native Environment)
```bash
# Generate migration (from api/ folder)
npm run migration:generate -- src/migrations/NewMigration

# Run migrations (from api/ folder)
npm run migration:run

# Revert migration (from api/ folder)
npm run migration:revert

# Check migration status (from api/ folder)
npm run migration:show
```

### Database Connection (Native Mode)
```bash
# Connect to database directly
psql -h localhost -p 5433 -U platform_user -d platform_db

# Or via Docker if needed
docker exec -it platform-postgres psql -U platform_user -d platform_db

# View database tables
psql -h localhost -p 5433 -U platform_user -d platform_db -c "\dt"

# Check specific table
psql -h localhost -p 5433 -U platform_user -d platform_db -c "SELECT * FROM [table_name];"
```

## Migration Workflow (Native Mode)

### 1. Generate Migration
```bash
cd api/
npm run migration:generate -- src/migrations/AddNewTable
```

### 2. Review Generated Migration
- Check the generated migration file in `api/src/migrations/`
- Verify the SQL statements are correct
- Ensure proper foreign key constraints

### 3. Run Migration
```bash
cd api/
npm run migration:run
```

### 4. Verify Migration
```bash
# Check migration status
npm run migration:show

# Verify table structure
psql -h localhost -p 5433 -U platform_user -d platform_db -c "\d [table_name]"
```

## Docker Development Mode (Disabled - For Reference)

### Migration Commands (Docker Environment)
```bash
# Generate migration
docker exec -it api npm run migration:generate -- src/migrations/NewMigration

# Run migrations
docker exec -it api npm run migration:run

# Revert migration
docker exec -it api npm run migration:revert

# Check migration status
docker exec -it api npm run migration:show
```

### Database Connection (Docker Mode)
```bash
# Connect to database
docker exec -it platform-postgres psql -U platform_user -d platform_db

# View database tables
docker exec -it platform-postgres psql -U platform_user -d platform_db -c "\dt"

# Check specific table
docker exec -it platform-postgres psql -U platform_user -d platform_db -c "SELECT * FROM [table_name];"
```

## TypeORM Configuration

### Database Configuration
```typescript
// api/src/config/database.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Bot } from '../entities/Bot.js';
import { Feature } from '../entities/Feature.js';
// ... other entities

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USER || 'platform_user',
  password: process.env.DB_PASSWORD || 'platform_password',
  database: process.env.DB_NAME || 'platform_db',
  synchronize: false, // Always false in production
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Bot,
    Feature,
    // ... other entities
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});
```

### Entity Relationship Pattern
```typescript
// Example: Many-to-Many relationship
@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToMany(() => Prompt, { cascade: true })
  @JoinTable({
    name: 'bot_prompts',
    joinColumn: {
      name: 'botId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'promptId',
      referencedColumnName: 'id'
    }
  })
  prompts!: Relation<Prompt>[];
}
```

## Migration Best Practices

### 1. Naming Conventions
- Use descriptive names: `AddUserTable`, `UpdateBotSchema`, `AddFeatureRelationships`
- Include timestamp prefix: `1753434011982-AddBotTable.ts`
- Use PascalCase for migration class names

### 2. Migration Structure
```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBotTable1753434011982 implements MigrationInterface {
    name = 'AddBotTable1753434011982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tables
        await queryRunner.query(`
            CREATE TABLE "bots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bots_id" PRIMARY KEY ("id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "bots"
            ADD CONSTRAINT "FK_bots_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE "bots"`);
    }
}
```

### 3. Common Migration Patterns

#### Adding a New Table
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "new_table" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_new_table_id" PRIMARY KEY ("id")
        )
    `);
}
```

#### Adding a Column
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "existing_table"
        ADD COLUMN "new_column" character varying
    `);
}
```

#### Adding Foreign Key
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "child_table"
        ADD CONSTRAINT "FK_child_parent"
        FOREIGN KEY ("parentId") REFERENCES "parent_table"("id") ON DELETE CASCADE
    `);
}
```

#### Creating Junction Table
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "table1_table2" (
            "table1Id" uuid NOT NULL,
            "table2Id" uuid NOT NULL,
            CONSTRAINT "PK_table1_table2" PRIMARY KEY ("table1Id", "table2Id")
        )
    `);

    await queryRunner.query(`
        ALTER TABLE "table1_table2"
        ADD CONSTRAINT "FK_table1_table2_table1Id"
        FOREIGN KEY ("table1Id") REFERENCES "table1"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
        ALTER TABLE "table1_table2"
        ADD CONSTRAINT "FK_table1_table2_table2Id"
        FOREIGN KEY ("table2Id") REFERENCES "table2"("id") ON DELETE CASCADE
    `);
}
```

## Troubleshooting

### Migration Issues

#### Migration Already Applied
```bash
# Check migration status
npm run migration:show

# If migration is already applied, you may need to revert
npm run migration:revert
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -p 5433 -U platform_user -d platform_db

# Check if PostgreSQL is running
docker-compose ps postgres
```

#### Entity Not Found
- Ensure entity is imported in `database.ts`
- Check entity file path and exports
- Verify TypeORM configuration

#### UUID Extension Missing
```sql
-- Run this in PostgreSQL if uuid_generate_v4() fails
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Performance Tips
- Use proper indexes in migrations
- Batch large data operations
- Test migrations on development data
- Always test rollback functionality
