# Hybrid Deployment on Fly.io

This document describes the hybrid deployment approach for the Cursor Gemini Platform on Fly.io, using managed services for databases and custom apps for the application components.

## Architecture Overview

### Managed Services (Free Tier)
- **PostgreSQL**: Fly's managed PostgreSQL database
- **Redis**: Fly's managed Redis (Upstash integration)

### Custom Apps (3 VMs - Free Tier Limit)
- **API**: Node.js backend service (port 4000)
- **UI**: React frontend with Nginx (port 3000)
- **Bot**: Node.js worker service (port 3001)

## Configuration Files

### Updated Fly.io Configurations

#### `deploy/fly.api.toml`
- **App**: `cursor-gemini-api`
- **Port**: 4000 (internal)
- **Memory**: 256MB (free tier)
- **Database**: Managed PostgreSQL
- **Cache**: Managed Redis

#### `deploy/fly.ui.toml`
- **App**: `cursor-gemini-webapp`
- **Port**: 3000 (internal)
- **Memory**: 256MB (free tier)
- **Proxy**: Nginx serving React build

#### `deploy/fly.bot.toml`
- **App**: `cursor-gemini-bot`
- **Port**: 3001 (internal)
- **Memory**: 256MB (free tier)
- **Database**: Managed PostgreSQL
- **Cache**: Managed Redis

## Environment Variables

### Required Environment Variables
```bash
export GEMINI_KEY="your-gemini-api-key"
export JWT_SECRET="your-jwt-secret-key"  # Optional, defaults to placeholder
```

### Database Configuration
- **Host**: `cursor-gemini-db.internal` (managed PostgreSQL)
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: Set via Fly secrets

### Redis Configuration
- **Host**: `cursor-gemini-redis.upstash.io` (managed Redis)
- **Port**: 6379
- **Password**: Set via Fly secrets

## Deployment Process

### 1. Prerequisites
```bash
# Set required environment variables
export GEMINI_KEY="your-gemini-api-key"
export JWT_SECRET="your-secure-jwt-secret"

# Ensure you're logged into Fly.io
fly auth login
```

### 2. Run Hybrid Deployment
```bash
# Execute the deployment script
./deploy/deploy-hybrid.sh
```

The script will:
1. ✅ Validate environment variables
2. 🗄️ Create managed PostgreSQL database
3. 🔴 Create managed Redis database
4. 🔐 Configure secrets for all apps
5. 🚀 Deploy API app
6. 🎨 Deploy UI app
7. 🤖 Deploy Bot app
8. 📊 Run database migrations
9. 📈 Show deployment status

### 3. Manual Deployment (Alternative)
```bash
# Create managed services
fly postgres create cursor-gemini-db --region sea --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
fly redis create cursor-gemini-redis --region sea --plan free

# Create apps
fly apps create cursor-gemini-api --org personal
fly apps create cursor-gemini-webapp --org personal
fly apps create cursor-gemini-bot --org personal

# Set secrets
fly secrets set DB_PASSWORD="..." REDIS_PASSWORD="..." GEMINI_KEY="..." JWT_SECRET="..." -a cursor-gemini-api
fly secrets set DB_PASSWORD="..." REDIS_PASSWORD="..." GEMINI_KEY="..." -a cursor-gemini-bot

# Deploy apps
fly deploy --config deploy/fly.api.toml
fly deploy --config deploy/fly.ui.toml
fly deploy --config deploy/fly.bot.toml
```

## Port Configuration

### Development vs Production

| Service | Development | Production | Notes |
|---------|-------------|------------|-------|
| API | 4001:4000 | 80:4000 | External port 80, internal 4000 |
| UI | 3000:3000 | 80:3000 | External port 80, internal 3000 |
| Bot | N/A | 80:3001 | External port 80, internal 3001 |
| PostgreSQL | 5433:5432 | Managed | Fly managed service |
| Redis | 6379:6379 | Managed | Fly managed service |

### Key Differences
- **Development**: Uses Docker Compose with port mapping
- **Production**: Uses Fly.io's internal networking
- **Database**: Development uses local containers, production uses managed services

## Free Tier Limitations

### Current Usage
- **VMs**: 3/3 (API, UI, Bot)
- **Memory**: 256MB per VM (768MB total)
- **Storage**: 1GB PostgreSQL volume
- **Redis**: Free tier (Upstash)

### Scaling Considerations
- Cannot scale beyond 1 VM per app on free tier
- Consider upgrading to paid tier for production scaling
- Monitor resource usage with `fly status` and `fly logs`

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
fly postgres list
fly postgres connect -a cursor-gemini-db

# Verify secrets
fly secrets list -a cursor-gemini-api
```

#### Redis Connection Issues
```bash
# Check Redis status
fly redis list
fly redis connect -a cursor-gemini-redis

# Verify secrets
fly secrets list -a cursor-gemini-api
```

#### App Deployment Issues
```bash
# Check app status
fly status -a cursor-gemini-api
fly logs -a cursor-gemini-api

# Restart app
fly apps restart cursor-gemini-api
```

### Logs and Monitoring
```bash
# View logs for all apps
fly logs -a cursor-gemini-api
fly logs -a cursor-gemini-webapp
fly logs -a cursor-gemini-bot

# Monitor app status
fly status -a cursor-gemini-api
fly status -a cursor-gemini-webapp
fly status -a cursor-gemini-bot
```

## URLs and Endpoints

### Production URLs
- **API**: https://cursor-gemini-api.fly.dev
- **UI**: https://cursor-gemini-webapp.fly.dev
- **Bot**: https://cursor-gemini-bot.fly.dev

### Health Checks
- **API Health**: https://cursor-gemini-api.fly.dev/health
- **UI Health**: https://cursor-gemini-webapp.fly.dev/health
- **Bot Health**: https://cursor-gemini-bot.fly.dev/health

## Cost Optimization

### Free Tier Usage
- **3 VMs**: 256MB each (768MB total)
- **PostgreSQL**: 1GB storage
- **Redis**: Free tier limits
- **Bandwidth**: 160GB outbound

### Upgrade Considerations
- **Paid Tier**: $1.94/month per VM for 1GB RAM
- **Scaling**: Horizontal scaling with multiple VMs
- **Storage**: Additional PostgreSQL storage as needed

## Security Notes

### Secrets Management
- All sensitive data stored in Fly secrets
- No hardcoded credentials in configuration files
- Environment-specific secrets per app

### Network Security
- Internal communication via Fly's private network
- HTTPS enforced on all external endpoints
- Database access restricted to app network

## Migration from Previous Deployment

### Changes Made
1. **Removed**: Custom PostgreSQL and Redis containers
2. **Added**: Managed PostgreSQL and Redis services
3. **Updated**: Environment variables for managed services
4. **Optimized**: Memory allocation for free tier
5. **Simplified**: Deployment process with automation

### Benefits
- ✅ Reduced complexity
- ✅ Better reliability (managed services)
- ✅ Free tier compliance
- ✅ Automated deployment
- ✅ Better security (managed credentials)
