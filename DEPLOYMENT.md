# Fly.io Deployment Guide

This guide will help you deploy the meta-application platform to Fly.io using the correct architecture with separate apps for API and UI services.

## Architecture Overview

The platform is deployed as **two separate Fly.io apps**:
- **cursor-gemini-platform-api**: Node.js API service (port 4000)
- **cursor-gemini-platform-ui**: React UI served by Nginx (port 3000)

This approach provides better scalability, isolation, and follows Fly.io best practices.

## Prerequisites

1. Install the Fly CLI:
   ```bash
   # macOS
   brew install flyctl

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

   # Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. Sign up and authenticate:
   ```bash
   fly auth signup
   # or if you already have an account:
   fly auth login
   ```

## Step 1: Create the Database

Create a PostgreSQL database:
```bash
fly postgres create --name cursor-gemini-platform-db --region sea
```

Note the database URL and credentials for the next step.

## Step 2: Create Redis Instance

Create a Redis instance:
```bash
fly redis create --name cursor-gemini-platform-redis --region sea
```

Note the Redis URL for the next step.

## Step 3: Configure Environment Variables

Update the configuration files with your actual database and Redis credentials:

### API Configuration (`fly.api.toml`)
```toml
[env]
  NODE_ENV = "production"
  # Database configuration
  DB_HOST = "your-actual-postgres-host.fly.dev"
  DB_PORT = "5432"
  DB_NAME = "postgres"
  DB_USER = "your-actual-username"
  DB_PASSWORD = "your-actual-password"

  # Redis configuration
  REDIS_HOST = "your-actual-redis-host.fly.dev"
  REDIS_PORT = "6379"
  REDIS_PASSWORD = "your-actual-redis-password"

  # JWT configuration
  JWT_SECRET = "your-secure-jwt-secret-key"
  JWT_EXPIRES_IN = "24h"
```

### UI Configuration (`fly.ui.toml`)
```toml
[env]
  NODE_ENV = "production"
  # Frontend configuration
  REACT_APP_API_URL = "https://cursor-gemini-platform-api.fly.dev"
```

## Step 4: Create the Apps

Create both Fly apps:
```bash
fly apps create cursor-gemini-platform-api
fly apps create cursor-gemini-platform-ui
```

## Step 5: Attach Database and Redis

Attach the PostgreSQL database to the API app:
```bash
fly postgres attach cursor-gemini-platform-db --app cursor-gemini-platform-api
```

Attach the Redis instance to the API app:
```bash
fly redis attach cursor-gemini-platform-redis --app cursor-gemini-platform-api
```

## Step 6: Set Secrets

Set sensitive environment variables as secrets for the API app:
```bash
fly secrets set JWT_SECRET="your-secure-jwt-secret-key" --app cursor-gemini-platform-api
fly secrets set DB_PASSWORD="your-actual-database-password" --app cursor-gemini-platform-api
fly secrets set REDIS_PASSWORD="your-actual-redis-password" --app cursor-gemini-platform-api
```

## Step 7: Deploy

Deploy both applications:
```bash
# Deploy API
fly deploy --config fly.api.toml

# Deploy UI
fly deploy --config fly.ui.toml
```

Or use the automated deployment script:
```bash
./deploy.sh
```

## Step 8: Verify Deployment

Check the deployment status:
```bash
# Check API status
fly status --app cursor-gemini-platform-api

# Check UI status
fly status --app cursor-gemini-platform-ui
```

View logs:
```bash
# API logs
fly logs --app cursor-gemini-platform-api

# UI logs
fly logs --app cursor-gemini-platform-ui
```

## Environment Variables Reference

### API App Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DB_HOST` | PostgreSQL host | `cursor-gemini-platform-db.internal` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `secure-password` |
| `REDIS_HOST` | Redis host | `fly-cursor-gemini-platform-redis.upstash.io` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `secure-password` |
| `JWT_SECRET` | JWT signing secret | `your-secure-jwt-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `API_PORT` | API server port | `4000` |

### UI App Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `REACT_APP_API_URL` | Frontend API URL | `https://cursor-gemini-platform-api.fly.dev` |

## Scaling

Scale the applications independently:
```bash
# Scale API to 2 instances
fly scale count 2 --app cursor-gemini-platform-api

# Scale UI to 2 instances
fly scale count 2 --app cursor-gemini-platform-ui

# Scale to specific regions
fly scale count 2 --region sea --app cursor-gemini-platform-api
```

## Monitoring

View application metrics:
```bash
fly dashboard
```

Monitor logs in real-time:
```bash
# API logs
fly logs --follow --app cursor-gemini-platform-api

# UI logs
fly logs --follow --app cursor-gemini-platform-ui
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   fly postgres status cursor-gemini-platform-db

   # Connect to database
   fly postgres connect cursor-gemini-platform-db
   ```

2. **Redis Connection Issues**
   ```bash
   # Check Redis status
   fly redis status cursor-gemini-platform-redis

   # Connect to Redis
   fly redis connect cursor-gemini-platform-redis
   ```

3. **Application Won't Start**
   ```bash
   # Check API logs
   fly logs --app cursor-gemini-platform-api

   # Check UI logs
   fly logs --app cursor-gemini-platform-ui

   # Check app status
   fly status --app cursor-gemini-platform-api
   fly status --app cursor-gemini-platform-ui

   # Restart the apps
   fly apps restart cursor-gemini-platform-api
   fly apps restart cursor-gemini-platform-ui
   ```

4. **Build Failures**
   ```bash
   # Check build logs
   fly logs --build --app cursor-gemini-platform-api
   fly logs --build --app cursor-gemini-platform-ui

   # Rebuild and deploy
   fly deploy --force --config fly.api.toml
fly deploy --force --config fly.ui.toml
   ```

### Health Checks

The applications include health checks:

- **API Health Check**: `https://cursor-gemini-platform-api.fly.dev/health`
- **UI Health Check**: `https://cursor-gemini-platform-ui.fly.dev/health`

### SSL/TLS

Fly.io automatically provides SSL certificates for your domains. The configuration includes:
- `force_https = true` for both services
- Automatic certificate management

## Custom Domains

Add custom domains:
```bash
# For API
fly certs add api.your-domain.com --app cursor-gemini-platform-api

# For UI
fly certs add your-domain.com --app cursor-gemini-platform-ui
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
fly postgres backup cursor-gemini-platform-db

# List backups
fly postgres backups cursor-gemini-platform-db

# Restore backup
fly postgres restore cursor-gemini-platform-db <backup-file>
```

### Application Backup
```bash
# Export app configurations
fly config export --app cursor-gemini-platform-api
fly config export --app cursor-gemini-platform-ui

# Import app configurations
fly config import --app cursor-gemini-platform-api
fly config import --app cursor-gemini-platform-ui
```

## Cost Optimization

1. **Use appropriate instance sizes**
   ```bash
   fly scale vm shared-cpu-1x --memory 512 --app cursor-gemini-platform-api
   fly scale vm shared-cpu-1x --memory 256 --app cursor-gemini-platform-ui
   ```

2. **Scale down during low usage**
   ```bash
   fly scale count 1 --app cursor-gemini-platform-api
   fly scale count 1 --app cursor-gemini-platform-ui
   ```

3. **Monitor usage**
   ```bash
   fly dashboard
   ```

## Security Best Practices

1. **Use secrets for sensitive data**
   ```bash
   fly secrets set SECRET_KEY="your-secret" --app cursor-gemini-platform-api
   ```

2. **Regular security updates**
   ```bash
   fly deploy --config fly.api.toml
fly deploy --config fly.ui.toml
   ```

3. **Monitor access logs**
   ```bash
   fly logs --follow --app cursor-gemini-platform-api
   fly logs --follow --app cursor-gemini-platform-ui
   ```

## Support

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [Fly.io Status](https://status.fly.io/)

# Fly.io Deployment Notes

## Cache Busting for Frontend Deployments

Fly.io aggressively caches Docker build layers, which can cause stale builds if files or configs change but the cache isn't invalidated. If you notice that frontend changes are not being deployed:

- **Force a cache bust:**
  - Use `fly deploy --build-arg CACHEBUST=$(date +%s)` to force a cache miss.
  - Or, use `fly deploy --no-cache` to force a full rebuild.
  - Making a trivial change to the Dockerfile (like adding a comment) can also invalidate the cache.
- **Check that the correct Dockerfile and config are being used.**
- **If issues persist, destroy and recreate the app.**

## Nginx Config and User Permissions
- Always copy and modify nginx configs before switching to the non-root user in the Dockerfile.
- This avoids permission issues and ensures nginx starts correctly.
