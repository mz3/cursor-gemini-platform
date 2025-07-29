# Docker Rules

## Project Structure

### Docker Files Organization
- **Location**: All Docker files go in `./docker/` directory
- **Dockerfile.api**: API service Dockerfile
- **Dockerfile.ui**: Webapp service Dockerfile
- **Dockerfile.bot**: Bot service Dockerfile
- **docker-compose.yml**: Development environment configuration
- **nginx.conf**: Nginx configuration for production

### Service Architecture
- **api**: Node.js/TypeScript backend (port 4000)
- **webapp**: React frontend (port 3000)
- **bot**: Background worker service
- **postgres**: PostgreSQL database (port 5433)
- **redis**: Redis cache/message queue (port 6379)

## Development Environment

### Docker Compose Usage
```bash
# Start all services
cd docker && docker compose up --build

# Start specific service
docker compose up api

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild specific service
docker compose up --build api
```

### Volume Mounts for Hot Reload
- **Source Code**: Mounted for live code changes
- **Node Modules**: Excluded to avoid conflicts
- **Configuration**: Environment-specific configs
- **Data**: Persistent volumes for databases

### Development Workflow
1. **Start Services**: `docker compose up --build`
2. **Code Changes**: Automatically reflected via volume mounts
3. **Hot Reload**: Services restart automatically on file changes
4. **Debugging**: Use `docker logs` and `docker exec` for debugging
5. **Testing**: Run tests inside containers

## Container Management

### Container Operations
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Access container shell
docker exec -it <container-name> sh

# View container logs
docker logs <container-name> --tail 50

# Restart container
docker restart <container-name>

# Stop container
docker stop <container-name>

# Remove container
docker rm <container-name>
```

### Container Health Checks
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **API**: Health endpoint monitoring
- **Webapp**: Build success verification

### Network Configuration
- **Bridge Network**: All services on `platform-net`
- **Service Discovery**: Use service names for communication
- **Port Mapping**: Only expose necessary ports
- **Internal Communication**: Services communicate via Docker network

## Production Deployment

### Multi-Stage Builds
- **Development**: Source code mounted for hot reload
- **Production**: Optimized images with minimal layers
- **Security**: Non-root user execution
- **Size**: Minimize image size with multi-stage builds

### Production Dockerfiles
```dockerfile
# Example multi-stage build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Environment Configuration
- **Development**: Environment variables in docker-compose.yml
- **Production**: Environment variables via Fly.io secrets
- **Staging**: Separate environment configurations
- **Security**: Never commit secrets to version control

## Troubleshooting

### Common Issues

#### Hot Reload Not Working
1. **Check Volume Mounts**: Verify source code is mounted correctly
2. **File Permissions**: Ensure proper file permissions
3. **Container Restart**: Restart affected container
4. **Node Modules**: Ensure node_modules is excluded
5. **Logs**: Check container logs for errors

#### Container Won't Start
1. **Port Conflicts**: Check for port conflicts
2. **Dependencies**: Verify dependent services are running
3. **Environment Variables**: Check required environment variables
4. **Health Checks**: Ensure health checks pass
5. **Resource Limits**: Check for resource constraints

#### Network Issues
1. **Service Names**: Use Docker service names, not localhost
2. **Network**: Verify services are on same Docker network
3. **DNS**: Use service names for internal communication
4. **Ports**: Check port mappings in docker-compose.yml
5. **Firewall**: Check for firewall restrictions

#### Database Connection Issues
1. **Container Health**: Verify PostgreSQL container is healthy
2. **Environment Variables**: Check database connection settings
3. **Network**: Ensure services can communicate
4. **Migrations**: Run pending migrations
5. **Credentials**: Verify database credentials

### Debugging Commands
```bash
# Check container status
docker ps -a

# View container logs
docker logs <container-name> --tail 100

# Access container shell
docker exec -it <container-name> sh

# Check container resources
docker stats

# Inspect container configuration
docker inspect <container-name>

# Check network connectivity
docker network ls
docker network inspect platform-net
```

## Best Practices

### Image Optimization
- **Base Images**: Use official, minimal base images
- **Layer Caching**: Optimize layer order for caching
- **Multi-stage Builds**: Use multi-stage builds for production
- **Security**: Run containers as non-root user
- **Size**: Minimize image size with .dockerignore

### Development Workflow
- **Volume Mounts**: Use volume mounts for development
- **Hot Reload**: Leverage hot reload for fast development
- **Testing**: Run tests inside containers
- **Consistency**: Ensure consistent environment across team
- **Documentation**: Document Docker setup and usage

### Production Considerations
- **Security**: Implement security best practices
- **Monitoring**: Set up container monitoring
- **Logging**: Implement proper logging
- **Backup**: Regular backup of persistent data
- **Updates**: Regular security updates

## Docker Commands Reference

### Development Commands
```bash
# Start development environment
cd docker && docker compose up --build

# View service logs
docker compose logs -f api

# Execute command in container
docker compose exec api npm run test:unit

# Rebuild specific service
docker compose up --build webapp

# Stop all services
docker compose down

# Remove volumes
docker compose down -v
```

### Production Commands
```bash
# Build production image
docker build -f docker/Dockerfile.api -t api:latest .

# Run production container
docker run -p 4000:4000 api:latest

# Push to registry
docker tag api:latest registry.example.com/api:latest
docker push registry.example.com/api:latest
```

### Maintenance Commands
```bash
# Clean up unused resources
docker system prune

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -aq)

# Clean up volumes
docker volume prune

# Clean up networks
docker network prune
```

## Environment Variables

### Development Environment
```yaml
# docker-compose.yml environment variables
environment:
  NODE_ENV: development
  DB_HOST: postgres
  DB_PORT: 5432
  DB_USER: platform_user
  DB_PASSWORD: platform_password
  DB_NAME: platform_db
  REDIS_HOST: redis
  REDIS_PORT: 6379
  API_PORT: 4000
  JWT_SECRET: dev-jwt-secret
```

### Production Environment
```bash
# Set Fly.io secrets
fly secrets set DB_HOST=your-db-host
fly secrets set DB_PASSWORD=your-db-password
fly secrets set JWT_SECRET=your-jwt-secret
```

## Performance Optimization

### Development Performance
- **Volume Mounts**: Fast file system access
- **Layer Caching**: Optimize Docker layer caching
- **Resource Limits**: Set appropriate resource limits
- **Parallel Builds**: Build services in parallel

### Production Performance
- **Image Size**: Minimize production image size
- **Startup Time**: Optimize container startup time
- **Resource Usage**: Monitor and optimize resource usage
- **Caching**: Implement appropriate caching strategies
