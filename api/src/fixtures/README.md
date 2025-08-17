# Secret Fixtures

This directory contains fixture files for seeding the database with initial data. Some fixtures contain sensitive information and are gitignored for security.

## Sensitive Fixtures (Gitignored)

The following fixture files contain encrypted API keys and are excluded from version control:

- `gemini-key.json` - Google Gemini API key
- `github-key.json` - GitHub API key

## Setting Up Secret Fixtures

### 1. Set Environment Variables

Set your API keys as environment variables:

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
export GITHUB_API_KEY="your-github-api-key-here"
```

### 2. Populate Fixtures

Run the populate script to encrypt and save your API keys:

```bash
cd api
npm run populate-secrets
```

This script will:
- Read your environment variables
- Encrypt the values using the same encryption as the Secret entity
- Save the encrypted values to the fixture files

### 3. Seed Database

After populating the fixtures, seed your database:

```bash
# Using Docker
docker exec -it api npm run seed

# Or locally
npm run seed
```

## Security Notes

- The fixture files are gitignored to prevent accidental commits of sensitive data
- API keys are encrypted using AES-256-CBC with a salt
- The encryption key is set via the `ENCRYPTION_KEY` environment variable
- If no encryption key is set, a default key is used (change in production)

## Adding New Secret Fixtures

To add new secret fixtures:

1. Create a new fixture file (e.g., `new-service-key.json`)
2. Add it to `.gitignore`
3. Update the `populate-secrets.js` script to handle the new fixture
4. Add the corresponding environment variable

## Fixture Structure

Secret fixtures follow this structure:

```json
[
  {
    "name": "Service Name API Key",
    "description": "Description of the API key",
    "key": "ENVIRONMENT_VARIABLE_NAME",
    "encryptedValue": "encrypted-api-key-value",
    "type": "api_key",
    "provider": "service-name",
    "isActive": true,
    "userId": "00000000-0000-0000-0000-000000000001"
  }
]
```

## Troubleshooting

- **Missing environment variable**: The populate script will show which variables are missing
- **Encryption errors**: Ensure the `ENCRYPTION_KEY` environment variable is set consistently
- **Database seeding fails**: Check that the fixture files exist and have valid JSON structure
