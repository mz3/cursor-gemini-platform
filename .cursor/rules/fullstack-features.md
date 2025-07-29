# Full-Stack Feature Implementation Pattern

## Overview
This rule defines the complete pattern for implementing new features that span both backend (API) and frontend (React) components.

## Backend Implementation (API)

### 1. Entity Creation
- **Location**: `api/src/entities/[EntityName].ts`
- **Pattern**: Use TypeORM decorators with proper relationships
- **Relationships**: Use `Relation<T>` generic for TypeORM relationships
- **Example**:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, Relation } from 'typeorm';
import { User } from './User.js';

@Entity('[table_name]')
export class [EntityName] {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: Relation<User>;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2. Database Configuration Update
- **File**: `api/src/config/database.ts`
- **Action**: Add entity import and include in entities array
- **Example**:
```typescript
import { [EntityName] } from '../entities/[EntityName].js';

// In entities array:
entities: [User, Model, Application, [EntityName], ...]
```

### 3. Migration Creation
- **Command**: `docker exec -it api npm run migration:generate -- src/migrations/Add[EntityName]Table`
- **Location**: `api/src/migrations/[timestamp]-Add[EntityName]Table.ts`
- **Review**: Check generated migration for accuracy
- **Run**: `docker exec -it api npm run migration:run`

### 4. API Routes Creation
- **Location**: `api/src/routes/[entityName]Routes.ts`
- **Pattern**: Full CRUD operations with proper error handling
- **Endpoints**:
  - `GET /api/[entityName]` - List all
  - `GET /api/[entityName]/:id` - Get specific
  - `POST /api/[entityName]` - Create new
  - `PUT /api/[entityName]/:id` - Update
  - `DELETE /api/[entityName]/:id` - Delete

### 5. Route Registration
- **File**: `api/src/index.ts`
- **Action**: Import and register routes
- **Example**:
```typescript
import { [entityName]Routes } from './routes/[entityName]Routes.js';

// In routes section:
app.use('/api/[entityName]', [entityName]Routes);
```

## Frontend Implementation (React)

### 1. List Component
- **Location**: `webapp/src/components/[EntityName]s.tsx`
- **Pattern**: Display all entities with actions (view, edit, delete)
- **Features**: Search, pagination, sorting
- **Actions**: Navigate to create, edit, view pages

### 2. Form Component
- **Location**: `webapp/src/components/[EntityName]Form.tsx`
- **Pattern**: Reusable form for create/edit operations
- **Features**: Validation, error handling, loading states
- **Props**: `initialData`, `onSubmit`, `loading`, `error`, `readOnly`

### 3. Individual Components
- **Create[EntityName].tsx** - Create new entities
- **Edit[EntityName].tsx** - Edit existing entities
- **View[EntityName].tsx** - View entity details

### 4. App.tsx Updates
- **Routes**: Add new routes for all components
- **Navigation**: Add to sidebar menu with appropriate icon
- **Pattern**:
```typescript
import [EntityName]s from './components/[EntityName]s';
import Create[EntityName] from './components/Create[EntityName]';
import Edit[EntityName] from './components/Edit[EntityName]';
import View[EntityName] from './components/View[EntityName]';

// In routes:
<Route path="/[entityName]" element={<[EntityName]s />} />
<Route path="/[entityName]/create" element={<Create[EntityName] />} />
<Route path="/[entityName]/:id/edit" element={<Edit[EntityName] />} />
<Route path="/[entityName]/:id" element={<View[EntityName] />} />

// In navigation:
{ icon: [Icon], label: '[EntityName]s', path: '/[entityName]' }
```

## Testing Pattern

### 1. API Testing
```bash
# Test endpoints with curl
curl http://localhost:4000/api/[entityName]
curl -X POST http://localhost:4000/api/[entityName] -H "Content-Type: application/json" -d '{"name":"test"}'
curl -X PUT http://localhost:4000/api/[entityName]/[id] -H "Content-Type: application/json" -d '{"name":"updated"}'
curl -X DELETE http://localhost:4000/api/[entityName]/[id]
```

### 2. Database Verification
```bash
# Check database directly
docker exec -it postgres psql -U platform_user -d platform_db -c "SELECT * FROM [table_name];"
```

### 3. Frontend Testing
- Access webapp at http://localhost:3000
- Navigate to new feature
- Test all CRUD operations
- Verify data persistence

## Development Workflow

### 1. Start Development Environment
```bash
cd docker && docker-compose up --build
```

### 2. Implement Backend
1. Create entity
2. Update database config
3. Generate and run migration
4. Create API routes
5. Register routes
6. Test API endpoints

### 3. Implement Frontend
1. Create list component
2. Create form component
3. Create individual components
4. Update App.tsx
5. Test frontend functionality

### 4. End-to-End Testing
1. Test API endpoints
2. Test frontend components
3. Test complete user workflows
4. Verify data persistence

## File Organization

### Backend Files
- `api/src/entities/[EntityName].ts` - TypeORM entity
- `api/src/migrations/[timestamp]-Add[EntityName]Table.ts` - Database migration
- `api/src/routes/[entityName]Routes.ts` - API routes
- `api/src/config/database.ts` - Database configuration

### Frontend Files
- `webapp/src/components/[EntityName]s.tsx` - List component
- `webapp/src/components/[EntityName]Form.tsx` - Form component
- `webapp/src/components/Create[EntityName].tsx` - Create component
- `webapp/src/components/Edit[EntityName].tsx` - Edit component
- `webapp/src/components/View[EntityName].tsx` - View component
- `webapp/src/App.tsx` - Route and navigation updates

## Common Patterns

### Entity Relationships
```typescript
// Many-to-One
@ManyToOne(() => User, { onDelete: 'CASCADE' })
user!: Relation<User>;

// Many-to-Many
@ManyToMany(() => Prompt, { cascade: true })
@JoinTable({
  name: 'entity_prompts',
  joinColumn: { name: 'entityId', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'promptId', referencedColumnName: 'id' }
})
prompts!: Relation<Prompt>[];
```

### API Response Format
```typescript
// Success response
{
  id: string;
  name: string;
  // ... other fields
  createdAt: string;
  updatedAt: string;
}

// Error response
{
  error: {
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
  }
}
```

### Frontend Component Pattern
```typescript
interface [EntityName] {
  id: string;
  name: string;
  // ... other fields
  createdAt: string;
  updatedAt: string;
}

const [EntityName]s: React.FC = () => {
  const [entities, setEntities] = useState<[EntityName][]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Component logic
};
```

## Environment Configuration

### Development Environment
- **API**: http://localhost:4000
- **Webapp**: http://localhost:3000
- **Database**: localhost:5433
- **Redis**: localhost:6379

### Docker Services
- **api**: Node.js/TypeScript backend
- **webapp**: React frontend
- **postgres**: PostgreSQL database
- **redis**: Redis cache

## Best Practices

### Backend
- Use TypeScript strict mode
- Implement proper error handling
- Add input validation
- Use consistent response formats
- Follow RESTful conventions

### Frontend
- Use functional components with hooks
- Implement proper loading states
- Add error handling
- Use consistent styling with Tailwind
- Follow accessibility guidelines

### Database
- Use descriptive table and column names
- Add proper indexes
- Implement foreign key constraints
- Use appropriate data types
- Document complex relationships

## Troubleshooting

### Common Issues
1. **Migration Errors**: Check entity configuration and relationships
2. **API Connection**: Verify Docker network and service names
3. **Frontend Build Errors**: Check TypeScript types and imports
4. **Database Connection**: Verify PostgreSQL container health
5. **Hot Reload Issues**: Check volume mounts and file permissions

### Debug Commands
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs [service]

# Access container
docker exec -it [service] sh

# Check database
docker exec -it postgres psql -U platform_user -d platform_db
```
