# Platform UI

## E2E Testing with Cypress

### Configuration

The E2E tests use Cypress environment files for configuration. This approach works better on Windows and avoids issues with environment variables.

### Setup

1. **Local Testing**: Copy the example environment file:
   ```bash
   cp cypress.env.json.example cypress.env.json
   ```

2. **Production Testing**: Copy the production environment file:
   ```bash
   cp cypress.env.prod.json.example cypress.env.prod.json
   ```

### Running Tests

- **Local tests**: `npm run test:e2e:local`
- **Production tests**: `npm run test:e2e:prod`
- **Default tests**: `npm run test:e2e`

### Environment Files

- `cypress.env.json` - Local development configuration
- `cypress.env.prod.json` - Production configuration

**Note**: These files are gitignored to prevent committing sensitive credentials.

### Custom Configuration

To use custom credentials or URLs, edit the appropriate `cypress.env.json` file:

```json
{
  "baseUrl": "http://localhost:3000",
  "apiUrl": "http://localhost:4000",
  "testEmail": "your@email.com",
  "testPassword": "yourpassword"
}
```
