# Cursor Environment Configuration

This folder contains Cursor environment configurations for the Gemini Platform development setup.

## Available Configurations

### 1. Docker Compose Environment (`environment.json`)
The recommended approach that uses Docker Compose to orchestrate all services.

**Advantages:**
- Consistent environment across all developers
- Isolated dependencies
- Easy to start/stop all services
- Matches production deployment closely

**Services included:**
- PostgreSQL (port 5433)
- Redis (port 6379)
- API Server (port 4000)
- Web App (port 3000)
- Bot Worker

**Usage:**
1. Ensure you have Docker and Docker Compose installed
2. Set your `GEMINI_API_KEY` in `docker/.env`
3. The environment will automatically build and start all services

### 2. Native Environment (`environment-native.json`)
Alternative approach using native installations of PostgreSQL, Redis, and Node.js.

**Advantages:**
- Direct access to services
- Faster development iteration
- No Docker overhead
- Better for debugging

**Requirements:**
- PostgreSQL 14+
- Redis 7+
- Node.js 20+

## How to Use

1. **Choose your environment:**
   - For Docker-based: Use `environment.json`
   - For native tools: Rename `environment-native.json` to `environment.json`

2. **Set up environment variables:**
   - Create a `.env` file with your `GEMINI_API_KEY`
   - For Docker: Place it in the `docker/` directory
   - For Native: The setup will create `.env` files in each app directory

3. **Run the environment:**
   - Cursor will automatically execute the setup steps
   - All services will be started
   - Database migrations will run automatically

## Available Tasks

Both environments provide these tasks:

- `db:migrate` - Run database migrations
- `db:seed` - Seed the database with sample data
- `db:console` - Open PostgreSQL console
- `redis:cli` - Open Redis CLI
- `logs` - View logs (Docker only)
- `restart` - Restart services (Docker only)
- `status` - Check service status

## Docker-Specific Commands

When using the Docker environment:
- `docker exec -it api npm run migration:run` - Run migrations
- `docker exec -it platform-postgres psql -U platform_user -d platform_db` - Database console
- `docker-compose logs -f [service]` - View logs for a specific service

## Troubleshooting

### Docker Environment
- If services fail to start, check `docker-compose logs`
- Ensure Docker daemon is running
- Check port conflicts (5433, 6379, 4000, 3000)

### Native Environment
- Verify PostgreSQL and Redis are installed and running
- Check service status: `systemctl status postgresql redis-server`
- Ensure Node.js version is 20+
- Check port conflicts

## Notes

- The Docker environment uses port 5433 for PostgreSQL (instead of default 5432) to avoid conflicts
- Both environments will run database migrations automatically during setup
- Make sure to set your `GEMINI_API_KEY` before starting the environment