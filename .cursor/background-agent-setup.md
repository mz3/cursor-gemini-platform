# Background Agent Setup Guide

## Quick Fix for Current Issues

If your background agent is failing to start, run these commands in order:

1. **Fix PostgreSQL issues:**
   ```bash
   bash .cursor/fix-postgresql.sh
   ```

2. **Run full troubleshooting:**
   ```bash
   bash .cursor/troubleshoot-agent.sh
   ```

3. **Restart the background agent** (Ctrl+E → Spawn New Agent)

## Common Issues and Solutions

### 1. PostgreSQL Initialization Error
**Error:** `initdb: error: directory "/var/lib/postgresql/17/main" exists but is not empty`

**Solution:**
- The PostgreSQL data directory exists but may be corrupted
- Run the fix script: `bash .cursor/fix-postgresql.sh`
- This will either start the existing instance or reinitialize if needed

### 2. PostgreSQL Startup Failure
**Error:** `pg_ctl: could not start server`

**Solution:**
- Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-17-main.log`
- Restart PostgreSQL: `sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main restart`
- If that fails, reinitialize: `bash .cursor/fix-postgresql.sh`

### 3. npm Package.json Not Found
**Error:** `Could not read package.json: Error: ENOENT: no such file or directory`

**Solution:**
- The agent is looking for `/workspace/package.json` but it doesn't exist
- This is expected - our project has separate package.json files in `api/`, `webapp/`, and `bot/`
- The updated environment.json handles this with proper error suppression

### 4. Redis Startup Issues
**Error:** Redis fails to start or connect

**Solution:**
- Start Redis manually: `sudo redis-server --daemonize yes`
- Check if Redis is running: `redis-cli ping`
- If Redis is not installed: `sudo apt-get install -y redis-server`

### 5. Permission Issues
**Error:** `invoke-rc.d: policy-rc.d denied execution of start`

**Solution:**
- This is normal in container environments
- Services are started manually rather than through systemd
- The updated environment.json handles this with proper error suppression

## Environment Configuration

The `.cursor/environment.json` file is configured to:

1. **Install dependencies** with error handling:
   - Node.js 24.x
   - PostgreSQL and Redis
   - npm packages for api, webapp, and bot

2. **Start services** with fallbacks:
   - PostgreSQL with proper error handling
   - Redis with daemon mode
   - Graceful handling of existing installations

3. **Launch development terminals**:
   - API development server
   - Webapp development server

## Manual Setup Steps

If the automatic setup fails, you can run these steps manually:

### 1. Install System Dependencies
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server
```

### 2. Fix PostgreSQL
```bash
bash .cursor/fix-postgresql.sh
```

### 3. Start Redis
```bash
sudo redis-server --daemonize yes
```

### 4. Install npm Dependencies
```bash
cd api && npm install
cd ../webapp && npm install
cd ../bot && npm install
```

### 5. Start Development Servers
```bash
# Terminal 1: API
cd api && npm run dev

# Terminal 2: Webapp
cd webapp && npm run dev
```

## Verification

After setup, verify everything is working:

1. **Database connection:**
   ```bash
   psql -h localhost -U platform_user -d platform_db -c "SELECT version();"
   ```

2. **Redis connection:**
   ```bash
   redis-cli ping
   ```

3. **API health check:**
   ```bash
   curl http://localhost:4000/health
   ```

4. **Webapp access:**
   ```bash
   curl http://localhost:3000
   ```

## Troubleshooting Commands

### Check Service Status
```bash
# PostgreSQL
pg_isready -h localhost -p 5432
sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main status

# Redis
redis-cli ping
ps aux | grep redis

# Ports
netstat -tuln | grep -E ':(5432|6379|3000|4000)'
```

### View Logs
```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-17-main.log

# Redis logs (if available)
tail -f /var/log/redis/redis-server.log
```

### Reset Everything
```bash
# Stop services
sudo -u postgres /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/17/main stop
sudo pkill redis-server

# Remove data directories
sudo rm -rf /var/lib/postgresql/17/main
sudo rm -rf /var/lib/redis

# Run fix script
bash .cursor/fix-postgresql.sh
```

## Environment Variables

The background agent uses these environment variables:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=platform_user`
- `DB_PASSWORD=platform_password`
- `DB_NAME=platform_db`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `GEMINI_API_KEY` (required for Gemini integration)

## Next Steps

1. Run the fix scripts
2. Restart the background agent
3. Verify all services are running
4. Test the development environment
5. Run the Gemini integration tests

If you continue to have issues, check the logs and run the troubleshooting script for detailed diagnostics.
