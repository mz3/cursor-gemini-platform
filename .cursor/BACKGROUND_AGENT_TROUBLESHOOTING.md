# Background Agent Troubleshooting Guide

## Resource Allocation Error Solutions

### Problem: "Error allocating resources" when starting background agent

This error typically occurs when the background agent environment doesn't have enough resources to run the full Docker-based development stack.

### Solution 1: Use Native Development (Recommended)

The current `.cursor/environment.json` is configured for native development which uses significantly fewer resources:

- **PostgreSQL**: Runs directly on the host (port 5432)
- **Redis**: Runs directly on the host (port 6379)  
- **No Docker**: Eliminates container overhead
- **Faster startup**: No container build times

### Solution 2: Minimal Docker Setup

If you prefer Docker, use this minimal configuration:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS",
  "install": "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker $USER && sudo systemctl start docker && sudo systemctl enable docker && npm install",
  "start": "sudo service docker start",
  "terminals": [
    {
      "name": "Minimal Services",
      "command": "cd /workspace/docker && docker compose up postgres redis -d"
    },
    {
      "name": "API Development",
      "command": "cd /workspace/api && npm run dev"
    }
  ]
}
```

### Solution 3: Single Service Setup

For very limited resources, run only the API:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS", 
  "install": "curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs && npm install",
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

### Current Setup (Native)
- **File**: `.cursor/environment.json`
- **Services**: PostgreSQL + Redis + API + Webapp
- **Resource Usage**: Low
- **Startup Time**: Fast

### Alternative Configurations

1. **Docker Setup**: `.cursor/environment-docker.json`
2. **Native Setup**: `.cursor/environment-native.json` 
3. **Simple Setup**: `.cursor/environment-simple.json`

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

### 2. Verify Service Status
```bash
# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server

# Docker (if using)
sudo systemctl status docker
```

### 3. Test Database Connection
```bash
# Test PostgreSQL
psql -h localhost -p 5432 -U platform_user -d platform_db

# Test Redis
redis-cli ping
```

### 4. Check Port Availability
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(5432|6379|4000|3000)'
```

## Common Issues

### Issue: PostgreSQL Connection Refused
**Solution**: 
```bash
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER platform_user WITH PASSWORD 'platform_password';"
```

### Issue: Redis Connection Refused
**Solution**:
```bash
sudo systemctl start redis-server
redis-cli ping
```

### Issue: Node.js Not Found
**Solution**:
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Issue: Permission Denied
**Solution**:
```bash
# For PostgreSQL
sudo chown -R postgres:postgres /var/lib/postgresql
sudo chmod 700 /var/lib/postgresql/data

# For Redis
sudo chown -R redis:redis /var/lib/redis
```

## Performance Optimization

### For Limited Resources:
1. **Disable webapp**: Remove webapp terminal from environment.json
2. **Use SQLite**: Switch to SQLite instead of PostgreSQL
3. **Disable Redis**: Remove Redis dependency if not needed
4. **Minimal logging**: Set NODE_ENV=production

### For Better Performance:
1. **Increase swap**: Add swap space if memory is limited
2. **Optimize PostgreSQL**: Reduce shared_buffers and work_mem
3. **Use connection pooling**: Configure connection limits

## Monitoring

### Check Service Health:
```bash
# API health
curl http://localhost:4000/health

# Database health
psql -h localhost -U platform_user -d platform_db -c "SELECT 1;"

# Redis health
redis-cli ping
```

### Log Monitoring:
```bash
# PostgreSQL logs
sudo journalctl -u postgresql -f

# Redis logs  
sudo journalctl -u redis-server -f

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