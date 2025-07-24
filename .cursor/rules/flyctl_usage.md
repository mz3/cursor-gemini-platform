# flyctl usage

- deploy with: fly deploy --config fly.api.toml or fly.ui.toml
- set secrets with: fly secrets set ...
- check logs: fly logs --app <app>
- scale with: fly scale count <n> --app <app>
- always use separate apps for api and ui
- always check logs and fly status after deploy
- use fly secrets for sensitive data

## troubleshooting
- if deploy fails, check fly logs and fly status
- verify secrets and env vars are set
