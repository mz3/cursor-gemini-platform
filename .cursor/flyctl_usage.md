# flyctl usage

- deploy with: fly deploy --config fly.api.toml or fly.ui.toml
- set secrets with: fly secrets set ...
- check logs: fly logs --app <app>
- scale with: fly scale count <n> --app <app>
- always use separate apps for api and ui
