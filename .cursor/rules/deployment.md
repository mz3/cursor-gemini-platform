# deployment process

- deployment files go in the ./deploy folder
- deploy api and ui as separate fly.io apps
- set all required secrets and env vars before deploy
- run migrations before/after deploy as needed
- verify health endpoints after deploy
- use ./deploy/deploy.sh for automated deploy
- use flyctl (see flyctl rules)
- use multi-stage Docker builds for production
- implement health checks for all services
- set up logging and monitoring
- use environment-specific configs and .env files
- never commit sensitive data

## troubleshooting
- if deploy fails, check container logs and health status
- verify secrets and env vars are set
- check for port conflicts and networking issues
