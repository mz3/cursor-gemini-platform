# Background Agent Setup Guide

## Overview
This guide helps set up Cursor's background agent to work with our full-stack platform using native development (PostgreSQL and Redis installed directly on the system).

## Current Configuration

The `.cursor/environment.json` file is configured for native development:

```json
{
  "snapshot": "POPULATED_FROM_SETTINGS",
  "install": "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server && sudo systemctl start postgresql && sudo systemctl enable postgresql && sudo systemctl start redis-server && sudo systemctl enable redis-server && sudo -u postgres psql -c \"CREATE USER platform_user WITH PASSWORD 'platform_password';\" && sudo -u postgres psql -c \"CREATE DATABASE platform_db OWNER platform_user;\" && npm install",
  "start": "sudo systemctl start postgresql && sudo systemctl start redis-server",
  "terminals": [
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

## Setup Approach: Native Development

### **Pros:**
- Faster startup and development
- Direct access to services
- No Docker dependency
- Simpler debugging
- Matches the current environment configuration

### **Cons:**
- Different from production environment (which uses Docker)
- Requires system-level installation of PostgreSQL and Redis
- Potential permission issues with database setup

## How to Use

1. **Start Background Agent:**
   - Press `Ctrl+E` in Cursor
   - Select "Spawn New Agent"
   - Choose your repository
   - The agent will automatically:
     - Install Node.js 18.x
     - Install and configure PostgreSQL
     - Install and configure Redis
     - Create database user and database
     - Install npm dependencies
     - Start API and webapp development servers

2. **Access Services:**
   - API: http://localhost:4000
   - Webapp: http://localhost:3000
   - Database: localhost:5432 (PostgreSQL default port)
   - Redis: localhost:6379

3. **Development Workflow:**
   - Agent can run tests automatically
   - Hot reload works for both API and webapp
   - Database migrations run automatically
   - All services are accessible to the agent

## Database Configuration

The native setup uses PostgreSQL with these settings:
- **Host**: localhost
- **Port**: 5432 (PostgreSQL default)
- **Database**: platform_db
- **User**: platform_user
- **Password**: platform_password

## Environment Variables

The background agent will need these environment variables:
- `GEMINI_API_KEY` - For Gemini LLM integration
- `DB_HOST=localhost` - Database host
- `DB_PORT=5432` - Database port (PostgreSQL default)
- `REDIS_HOST=localhost` - Redis host
- `REDIS_PORT=6379` - Redis port

## Troubleshooting

### PostgreSQL Issues
If PostgreSQL fails to start or connect:
1. Check service status: `sudo systemctl status postgresql`
2. Check logs: `sudo journalctl -u postgresql`
3. Verify database exists: `sudo -u postgres psql -l`
4. Test connection: `psql -h localhost -U platform_user -d platform_db`

### Redis Issues
If Redis fails to start or connect:
1. Check service status: `sudo systemctl status redis-server`
2. Check logs: `sudo journalctl -u redis-server`
3. Test connection: `redis-cli ping`

### Port Conflicts
If services can't start due to port conflicts:
1. Check what's running: `sudo netstat -tulpn | grep -E ':(5432|6379|3000|4000)'`
2. Stop conflicting services
3. Update port configurations if needed

### Permission Issues
If you encounter permission issues:
1. Ensure the agent has sudo privileges
2. Check PostgreSQL authentication: `sudo nano /etc/postgresql/*/main/pg_hba.conf`
3. Restart PostgreSQL after configuration changes

## Testing the Setup

After the agent starts, verify everything works:

1. **Database Connection:**
   ```bash
   psql -h localhost -U platform_user -d platform_db -c "SELECT version();"
   ```

2. **Redis Connection:**
   ```bash
   redis-cli ping
   ```

3. **API Health Check:**
   ```bash
   curl http://localhost:4000/health
   ```

4. **Webapp Access:**
   ```bash
   curl http://localhost:3000
   ```

## Migration from Docker

If you were previously using Docker and want to switch to native development:

1. **Stop Docker services:**
   ```bash
   docker compose down
   ```

2. **Update environment variables:**
   - Change `DB_PORT` from 5433 to 5432
   - Update connection strings in your code

3. **Run migrations:**
   ```bash
   cd api && npm run migration:run
   ```

## Security Notes

- Background agents have internet access
- Auto-running terminals can execute any command
- Be careful with sensitive data in prompts
- Use environment variables for secrets
- PostgreSQL and Redis are configured for local development only

## Next Steps

1. Test the background agent setup
2. Verify all services start correctly
3. Run the Gemini integration tests
4. Monitor agent performance and adjust as needed
5. Consider production deployment differences (Docker vs native)
