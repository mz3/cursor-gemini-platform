# TypeORM Migration Path Pattern (ESM/TypeScript)

## Migration Commands (Docker Environment)

### Always use docker exec for migration commands:
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

### Migration Workflow
1. **Create Entity**: Define TypeORM entity in `api/src/entities/`
2. **Update Database Config**: Add entity to `api/src/config/database.ts`
3. **Generate Migration**: Use docker exec command above
4. **Review Migration**: Check generated migration file
5. **Run Migration**: Execute with docker exec
6. **Test**: Verify entity works correctly

## TypeORM Configuration Pattern

- Always use `import.meta.url` and `fileURLToPath` to determine the current file path at runtime.
- Check for `/dist/` or `/src/` in the path to select the correct migration and subscriber globs:
  - Use `src/migrations/*.ts` and `src/subscribers/*.ts` if running from source.
  - Use `dist/migrations/*.js` and `dist/subscribers/*.js` if running from compiled output.
- Do **not** rely on `NODE_ENV` alone, as CI/CD may run in production mode before code is compiled.
- This pattern prevents runtime import errors in all environments (dev, CI, production).

### Example Configuration:
```ts
import { fileURLToPath } from 'url';
const filename = fileURLToPath(import.meta.url);
const isDist = filename.includes('/dist/') || filename.includes('\\dist\\');
migrations: [isDist ? 'dist/migrations/*.js' : 'src/migrations/*.ts']
```

## Database Connection

### Development Environment
- Database runs in Docker container on port 5433
- Use `docker exec -it postgres psql -U platform_user -d platform_db` to access database
- API connects via Docker network to `postgres:5432`

### Migration Best Practices
- Always test migrations in development first
- Use descriptive migration names with timestamps
- Include both up and down migrations
- Test rollback scenarios
- Document complex migrations
