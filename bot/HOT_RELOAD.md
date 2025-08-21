# Bot Worker Hot Reloading

## Overview

The bot worker now supports hot reloading during development, automatically restarting when source code changes are detected. This significantly improves the development workflow by eliminating the need for manual container restarts.

## Features

- **Automatic Restarts**: Code changes trigger automatic process restart
- **File Watching**: Monitors TypeScript, JavaScript, and JSON files
- **Graceful Shutdown**: Proper cleanup of resources before restart
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Development Only**: No impact on production deployments

## How It Works

### Development Mode
When running in development mode (`NODE_ENV=development`), the bot worker uses:
- **nodemon**: For file watching and automatic restarts
- **ts-node**: For TypeScript compilation on-the-fly
- **Volume Mounts**: Source code is mounted from host to container

### File Watching
The system watches for changes in:
- `src/**/*.ts` - TypeScript source files
- `src/**/*.js` - JavaScript files
- `*.json` - Configuration files

### Ignored Files
The following files are ignored to prevent unnecessary restarts:
- Test files (`*.test.ts`, `*.spec.ts`)
- Test directories (`__tests__/**`)
- Build output (`dist/**`)
- Dependencies (`node_modules/**`)

## Usage

### Local Development
```bash
# Start the development environment
cd docker
docker-compose -f docker-compose.dev2.yml -p platform-dev2 up -d

# View bot worker logs
docker-compose -f docker-compose.dev2.yml -p platform-dev2 logs -f bot-worker-dev2
```

### Making Changes
1. Edit any TypeScript file in `bot/src/`
2. Save the file
3. The bot worker will automatically restart
4. Check logs to confirm restart: `docker logs bot-worker-dev2`

### Manual Restart
If needed, you can manually restart the bot worker:
```bash
docker restart bot-worker-dev2
```

## Configuration

### nodemon.json
The nodemon configuration is located in `bot/nodemon.json` and includes:
- File watching patterns
- Ignore patterns
- Restart delay (1 second)
- Verbose logging

### Docker Configuration
The development Dockerfile (`Dockerfile.dev2`) includes:
- Global nodemon installation
- Development-specific startup command
- Proper volume mounts for hot reloading

## Troubleshooting

### Windows Volume Mount Issues
If you experience issues with file watching on Windows:
1. Ensure Docker Desktop has file sharing enabled for your project directory
2. Check that the volume mounts are working correctly
3. Verify that file permissions are set correctly

### Restart Not Working
If automatic restarts aren't working:
1. Check that the file is being watched (not in ignore patterns)
2. Verify nodemon is running: `docker exec bot-worker-dev2 ps aux | grep nodemon`
3. Check logs for any errors: `docker logs bot-worker-dev2`

### Performance Issues
If you experience performance issues:
1. Increase the restart delay in `nodemon.json`
2. Add more specific ignore patterns
3. Consider using `.nodemonignore` for additional exclusions

## Production

Hot reloading is disabled in production environments. The production Dockerfile uses the standard build and start process without nodemon.

## Development Workflow

1. **Start Development Environment**: Use docker-compose.dev2.yml
2. **Make Code Changes**: Edit files in `bot/src/`
3. **Automatic Restart**: nodemon detects changes and restarts
4. **Verify Changes**: Check logs to confirm restart and functionality
5. **Test**: Ensure bot functionality works as expected

This hot reloading setup significantly improves development efficiency by eliminating manual restarts and providing immediate feedback on code changes.
