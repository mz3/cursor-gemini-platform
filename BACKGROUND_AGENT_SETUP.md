# Background Agent Setup Guide

## Overview
This guide helps set up Cursor's background agent to work with our full-stack platform that requires:
- PostgreSQL database
- Redis cache
- Node.js API server
- React webapp
- Docker (optional)

## Setup Options

### Option 1: Docker-based Development (Recommended)
Uses Docker Compose to run all services in containers.

**Pros:**
- Consistent with current development setup
- Isolated services
- Easy to manage dependencies
- Matches production environment

**Cons:**
- Slightly slower startup
- Requires Docker installation

### Option 2: Native Development
Installs PostgreSQL and Redis directly on the Ubuntu machine.

**Pros:**
- Faster startup
- No Docker dependency
- Direct access to services

**Cons:**
- Different from production environment
- More complex setup
- Potential permission issues

## Current Configuration

The `.cursor/environment.json` file is configured for Docker-based development:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS",
  "install": "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo usermod -aG docker $USER && sudo systemctl start docker && sudo systemctl enable docker && npm install",
  "start": "sudo service docker start",
  "terminals": [
    {
      "name": "Database & Redis",
      "command": "cd /workspace && docker compose up postgres redis -d"
    },
    {
      "name": "API Development",
      "command": "cd /workspace/api && npm run dev"
    },
    {
      "name": "Webapp Development", 
      "command": "cd /workspace/webapp && npm run dev"
    }
  ]
}
```

## How to Use

1. **Start Background Agent:**
   - Press `Ctrl+E` in Cursor
   - Select "Spawn New Agent"
   - Choose your repository
   - The agent will automatically:
     - Install Docker
     - Start PostgreSQL and Redis containers
     - Start API and webapp development servers

2. **Access Services:**
   - API: http://localhost:4000
   - Webapp: http://localhost:3000
   - Database: localhost:5433
   - Redis: localhost:6379

3. **Development Workflow:**
   - Agent can run tests automatically
   - Hot reload works for both API and webapp
   - Database migrations run automatically
   - All services are accessible to the agent

## Troubleshooting

### Docker Issues
If Docker fails to install or start:
1. Check if the agent has sudo privileges
2. Try the native development option
3. Verify Docker Compose is available

### Database Connection Issues
1. Ensure PostgreSQL container is running: `docker ps`
2. Check database logs: `docker logs platform-postgres`
3. Verify connection settings in `api/src/config/database.ts`

### Port Conflicts
If services can't start due to port conflicts:
1. Check what's running: `netstat -tulpn`
2. Stop conflicting services
3. Update port mappings in `docker-compose.yml`

## Alternative Setup

If Docker doesn't work, use the native setup by copying `.cursor/environment-native.json` to `.cursor/environment.json`:

```bash
cp .cursor/environment-native.json .cursor/environment.json
```

## Environment Variables

The background agent will need these environment variables:
- `GEMINI_API_KEY` - For Gemini LLM integration
- `DB_HOST=localhost` - Database host
- `DB_PORT=5433` - Database port (Docker) or 5432 (native)
- `REDIS_URL=redis://localhost:6379` - Redis connection

## Testing the Setup

After the agent starts, verify everything works:

1. **Database:** Check if migrations run successfully
2. **API:** Test endpoints with curl
3. **Webapp:** Verify it loads in browser
4. **Redis:** Test connection from API

## Security Notes

- Background agents have internet access
- Auto-running terminals can execute any command
- Be careful with sensitive data in prompts
- Use environment variables for secrets

## Next Steps

1. Test the background agent setup
2. Verify all services start correctly
3. Run the Gemini integration tests
4. Monitor agent performance and adjust as needed 