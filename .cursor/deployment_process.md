# deployment process

- deploy api and ui as separate fly.io apps
- set all required secrets and env vars before deploy
- run migrations before/after deploy as needed
- verify health endpoints after deploy
- use ./deploy.sh for automated deploy
