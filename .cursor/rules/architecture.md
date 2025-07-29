# Architecture Rules

## System Overview

### Meta-Application Platform Architecture
The platform is a highly dynamic Platform-as-a-Service (PaaS) where users visually design and model their own applications. The platform's UI is driven by the same modeling system, creating a "meta" experience.

### Core Components
- **API Service**: Backend API with data modeling and application generation
- **Webapp Service**: React frontend for user interface
- **Bot Service**: Background worker for application building and deployment
- **Database**: PostgreSQL for persistent data storage
- **Cache/Queue**: Redis for session storage and job queuing

## Service Architecture

### API Service (api/)
**Technology Stack**: Node.js v24, TypeScript, Express.js, TypeORM
**Port**: 4000
**Responsibilities**:
- RESTful API endpoints
- JWT authentication and authorization
- Database operations and migrations
- Data modeling and validation
- Application generation orchestration

**Key Features**:
- User management and authentication
- Data model creation and management
- Prompt system with versioning
- Workflow engine
- API documentation and validation

### Webapp Service (webapp/)
**Technology Stack**: React, TypeScript, Tailwind CSS, Vite
**Port**: 3000
**Responsibilities**:
- User interface for platform management
- Visual data modeling interface
- Application management dashboard
- Real-time collaboration features

**Key Features**:
- Drag-and-drop model builder
- Visual workflow designer
- Prompt management interface
- Application monitoring dashboard
- Responsive design with mobile support

### Bot Service (bot/)
**Technology Stack**: Node.js v24, TypeScript, Redis
**Responsibilities**:
- Background job processing
- Docker image building
- Application deployment
- File system operations

**Key Features**:
- Redis job queue processing
- Docker image generation
- Application build automation
- File template processing

### Database (postgres/)
**Technology**: PostgreSQL 14
**Port**: 5433
**Responsibilities**:
- Persistent data storage
- User data and settings
- Application models and configurations
- Workflow definitions and history

### Cache/Queue (redis/)
**Technology**: Redis 7
**Port**: 6379
**Responsibilities**:
- Session storage
- Job queue management
- Caching layer
- Real-time data synchronization

## Data Architecture

### Core Entities

#### User Management
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToOne(() => UserSettings, settings => settings.user)
  settings: Relation<UserSettings>;

  @OneToMany(() => Model, model => model.user)
  models: Relation<Model>[];

  @OneToMany(() => Application, app => app.user)
  applications: Relation<Application>[];
}
```

#### Data Modeling
```typescript
@Entity()
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('jsonb')
  fields: ModelField[];

  @ManyToOne(() => User, user => user.models)
  user: Relation<User>;

  @OneToMany(() => Relationship, rel => rel.sourceModel)
  sourceRelationships: Relation<Relationship>[];

  @OneToMany(() => Relationship, rel => rel.targetModel)
  targetRelationships: Relation<Relationship>[];
}
```

#### Application Management
```typescript
@Entity()
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('jsonb')
  configuration: ApplicationConfig;

  @ManyToOne(() => User, user => user.applications)
  user: Relation<User>;

  @OneToMany(() => Component, comp => comp.application)
  components: Relation<Component>[];
}
```

#### Prompt System
```typescript
@Entity()
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  content: string;

  @Column('jsonb')
  variables: PromptVariable[];

  @OneToMany(() => PromptVersion, version => version.prompt)
  versions: Relation<PromptVersion>[];

  @ManyToOne(() => User, user => user.prompts)
  user: Relation<User>;
}
```

## API Architecture

### RESTful Endpoints
```
/api/auth
  POST /login
  POST /register
  POST /logout
  GET  /profile

/api/models
  GET    /models
  POST   /models
  GET    /models/:id
  PUT    /models/:id
  DELETE /models/:id

/api/applications
  GET    /applications
  POST   /applications
  GET    /applications/:id
  PUT    /applications/:id
  DELETE /applications/:id
  POST   /applications/:id/generate

/api/prompts
  GET    /prompts
  POST   /prompts
  GET    /prompts/:id
  PUT    /prompts/:id
  DELETE /prompts/:id
  POST   /prompts/:id/versions

/api/workflows
  GET    /workflows
  POST   /workflows
  GET    /workflows/:id
  PUT    /workflows/:id
  DELETE /workflows/:id
  POST   /workflows/:id/execute
```

### Authentication Flow
1. **Login**: User provides email/password
2. **Validation**: Server validates credentials
3. **Token Generation**: JWT token created with user info
4. **Response**: Token returned to client
5. **Authorization**: Token validated on protected routes

### Error Handling
```typescript
// Standard error response format
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── models/
│   │   ├── ModelForm.tsx
│   │   ├── ModelList.tsx
│   │   └── ModelBuilder.tsx
│   ├── applications/
│   │   ├── ApplicationForm.tsx
│   │   ├── ApplicationList.tsx
│   │   └── ApplicationViewer.tsx
│   └── prompts/
│       ├── PromptForm.tsx
│       ├── PromptList.tsx
│       └── PromptEditor.tsx
├── contexts/
│   └── AuthContext.tsx
├── utils/
│   ├── api.ts
│   └── cn.ts
└── App.tsx
```

### State Management
- **React Context**: Global state (authentication, user data)
- **Local State**: Component-specific state
- **Server State**: API data management
- **Form State**: Form validation and submission

### Routing
```typescript
// React Router configuration
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/models" element={<Models />} />
  <Route path="/models/new" element={<CreateModel />} />
  <Route path="/models/:id" element={<ViewModel />} />
  <Route path="/models/:id/edit" element={<EditModel />} />
  <Route path="/applications" element={<Applications />} />
  <Route path="/prompts" element={<Prompts />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

## Background Processing

### Job Queue Architecture
```typescript
// Redis job queue structure
interface Job {
  id: string;
  type: 'build-application' | 'deploy-application' | 'generate-code';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Job Types
1. **Application Building**: Generate Docker images
2. **Code Generation**: Create application code from models
3. **Deployment**: Deploy applications to hosting
4. **File Processing**: Handle file uploads and processing

### Worker Process
```typescript
// Bot service job processing
class WorkerService {
  async processJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'build-application':
        await this.buildApplication(job.data);
        break;
      case 'deploy-application':
        await this.deployApplication(job.data);
        break;
      case 'generate-code':
        await this.generateCode(job.data);
        break;
    }
  }
}
```

## Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds ≥ 12
- **Token Expiration**: Configurable expiration times
- **Refresh Tokens**: Token rotation for security

### Authorization
- **Role-Based Access**: User roles and permissions
- **Resource Ownership**: Users can only access their resources
- **API Rate Limiting**: Prevent abuse and attacks
- **Input Validation**: Comprehensive input sanitization

### Data Protection
- **HTTPS/TLS**: Encrypted communication
- **Database Encryption**: Sensitive data encryption
- **Secret Management**: Fly.io secrets for production
- **Audit Logging**: Track security events

## Deployment Architecture

### Development Environment
- **Docker Compose**: Local development with hot reload
- **Volume Mounts**: Source code mounted for live changes
- **Service Discovery**: Docker network for service communication
- **Environment Variables**: Development configuration

### Production Environment
- **Fly.io**: Containerized deployment platform
- **Separate Apps**: API and UI deployed as separate applications
- **Database**: Managed PostgreSQL database
- **Redis**: Managed Redis instance
- **CDN**: Static asset delivery

### CI/CD Pipeline
1. **Code Push**: Triggers GitHub Actions
2. **Testing**: Unit, integration, and E2E tests
3. **Build**: Docker image building
4. **Deploy**: Automatic deployment to Fly.io
5. **Monitoring**: Health checks and logging

## Performance Architecture

### Caching Strategy
- **Redis Cache**: Session and data caching
- **CDN**: Static asset delivery
- **Database Indexing**: Optimized query performance
- **Application Caching**: In-memory caching for frequently accessed data

### Scalability
- **Horizontal Scaling**: Multiple API instances
- **Load Balancing**: Distribute traffic across instances
- **Database Scaling**: Read replicas and connection pooling
- **Background Processing**: Asynchronous job processing

### Monitoring
- **Health Checks**: Service health monitoring
- **Metrics Collection**: Performance metrics
- **Logging**: Structured logging for debugging
- **Alerting**: Automated alerting for issues

## Integration Points

### External Services
- **Docker Registry**: Application image storage
- **GitHub**: Source code management
- **Fly.io**: Application hosting
- **Email Service**: User notifications
- **File Storage**: Application assets

### API Integrations
- **RESTful APIs**: Standard HTTP APIs
- **WebSocket**: Real-time communication
- **Webhooks**: External system notifications
- **OAuth**: Third-party authentication

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated PostgreSQL backups
- **Configuration Backups**: Environment configuration
- **Code Backups**: Version control with GitHub
- **Documentation**: Architecture and process documentation

### Recovery Procedures
1. **Database Recovery**: Restore from backups
2. **Application Recovery**: Redeploy from source
3. **Configuration Recovery**: Restore environment settings
4. **Data Validation**: Verify data integrity

## Future Architecture Considerations

### Microservices Evolution
- **Service Decomposition**: Break down into smaller services
- **API Gateway**: Centralized API management
- **Service Mesh**: Inter-service communication
- **Event Sourcing**: Event-driven architecture

### Technology Upgrades
- **Framework Updates**: Keep dependencies current
- **Security Updates**: Regular security patches
- **Performance Optimization**: Continuous performance improvements
- **Feature Additions**: New platform capabilities
