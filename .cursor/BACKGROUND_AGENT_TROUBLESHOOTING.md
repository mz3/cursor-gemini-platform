# Background Agent Troubleshooting Guide

## Resource Allocation Error Solutions

### Problem: "Error allocating resources" when starting background agent

This error typically occurs when the background agent environment doesn't have enough resources to run the full development stack or when trying to install system services.

### Solution 1: Use Simple Development (Recommended)

The current `.cursor/environment.json` is configured for simple development which uses minimal resources:

- **No System Services**: No PostgreSQL/Redis installation required
- **Docker Services**: Uses existing docker-compose for database/redis
- **Fast Startup**: No system service installation
- **Minimal Resource Usage**: Only runs Node.js applications

### Solution 2: Docker-Based Development

If you prefer Docker services, use the Docker configuration:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS",
  "install": "npm install",
  "start": "cd /workspace/docker && docker compose up postgres redis -d",
  "terminals": [
    {
      "name": "API Development",
      "command": "cd /workspace/api && DB_HOST=localhost DB_PORT=5433 REDIS_HOST=localhost REDIS_PORT=6379 npm run dev"
    },
    {
      "name": "Webapp Development", 
      "command": "cd /workspace/webapp && npm run dev"
    }
  ]
}
```

### Solution 3: API-Only Development

For very limited resources, run only the API:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS", 
  "install": "npm install",
  "start": "",
  "terminals": [
    {
      "name": "API Development",
      "command": "cd /workspace/api && npm run dev"
    }
  ]
}
```

## Environment Configuration Options

### Current Setup (Simple)
- **File**: `.cursor/environment.json`
- **Services**: Uses Docker for database/redis
- **Resource Usage**: Very Low
- **Startup Time**: Fast

### Alternative Configurations

1. **Docker Setup**: `.cursor/environment-docker.json`
2. **Simple Setup**: `.cursor/environment-simple.json`

## Troubleshooting Steps

### 1. Check Resource Usage
```bash
# Check available memory
free -h

# Check disk space
df -h

# Check running processes
ps aux | head -20
```

### 2. Verify Docker Services
```bash
# Check if Docker is running
docker --version

# Start database services
cd docker && docker compose up postgres redis -d

# Check service status
docker compose ps
```

### 3. Test Database Connection
```bash
# Test PostgreSQL (if using Docker)
docker exec -it docker-postgres-1 psql -U platform_user -d platform_db

# Test Redis (if using Docker)
docker exec -it docker-redis-1 redis-cli ping
```

### 4. Check Port Availability
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(5433|6379|4000|3000)'
```

## Common Issues

### Issue: Docker Not Available
**Solution**: Use the simple environment configuration that doesn't require Docker.

### Issue: Database Connection Refused
**Solution**: 
```bash
# Start Docker services
cd docker && docker compose up postgres redis -d

# Wait for services to be ready
sleep 10
```

### Issue: Node.js Not Found
**Solution**:
```bash
# Check Node.js version
node --version

# Install if needed (should be handled by environment)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Issue: Permission Denied
**Solution**:
```bash
# For Docker
sudo usermod -aG docker $USER
newgrp docker
```

## Performance Optimization

### For Limited Resources:
1. **Disable webapp**: Remove webapp terminal from environment.json
2. **Use SQLite**: Switch to SQLite instead of PostgreSQL
3. **Disable Redis**: Remove Redis dependency if not needed
4. **Minimal logging**: Set NODE_ENV=production

### For Better Performance:
1. **Increase swap**: Add swap space if memory is limited
2. **Optimize Docker**: Reduce memory limits for containers
3. **Use connection pooling**: Configure connection limits

## Monitoring

### Check Service Health:
```bash
# API health
curl http://localhost:4000/health

# Database health (Docker)
docker exec docker-postgres-1 psql -U platform_user -d platform_db -c "SELECT 1;"

# Redis health (Docker)
docker exec docker-redis-1 redis-cli ping
```

### Log Monitoring:
```bash
# Docker logs
docker compose logs -f

# API logs
tail -f /workspace/api/logs/app.log
```

## Fallback Options

If all else fails:

1. **Use SQLite**: Switch to SQLite database (no server required)
2. **Mock Services**: Use in-memory mocks for development
3. **External Services**: Use cloud-hosted PostgreSQL/Redis
4. **Minimal Mode**: Run only essential services

## Contact

If issues persist, check:
- Cursor background agent documentation
- System resource limits
- Network connectivity
- Service dependencies 