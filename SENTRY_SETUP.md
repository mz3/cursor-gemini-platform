# Sentry Setup Guide

This guide will help you set up Sentry for error tracking and performance monitoring in your cursor-gemini-platform.

## What is Sentry?

Sentry is a real-time error tracking and performance monitoring platform that helps you:
- **Track errors** in real-time across your entire stack
- **Monitor performance** of your applications
- **Get alerts** when issues occur
- **Debug issues** with detailed stack traces and context

## Free Tier Limits

Sentry's free tier includes:
- **5,000 errors per month**
- **10,000 performance units per month**
- **1 team member**
- **7-day data retention**

This should be sufficient for development and small production deployments.

## Step 1: Create Sentry Account

1. Visit [https://sentry.io/signup/](https://sentry.io/signup/)
2. Create a free account
3. Choose your organization name
4. Select your team size

## Step 2: Create Projects

After signing up, create two projects:

### 1. API Project
1. Go to your Sentry dashboard
2. Click "Create Project"
3. Select "Node.js" as the platform
4. Name it "cursor-gemini-api"
5. Copy the DSN (Data Source Name)

### 2. Webapp Project
1. Click "Create Project" again
2. Select "React" as the platform
3. Name it "cursor-gemini-webapp"
4. Copy the DSN

## Step 3: Configure Environment Variables

### Local Development

Create `.env` files in both `api/` and `webapp/` directories:

**api/.env:**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=platform_user
DB_PASSWORD=platform_password
DB_NAME=platform_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# API Configuration
API_PORT=4000
NODE_ENV=development

# Gemini AI Configuration
GEMINI_KEY=your_gemini_api_key_here

# Sentry Configuration
SENTRY_DSN=https://your-api-sentry-dsn@sentry.io/project-id
```

**webapp/.env:**
```bash
# API Configuration
VITE_API_URL=http://localhost:4000

# Sentry Configuration
VITE_SENTRY_DSN=https://your-webapp-sentry-dsn@sentry.io/project-id
```

### Docker Development

For Docker development, set the environment variables:

```bash
# Set your Sentry DSNs
export SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Start the platform
cd docker
docker-compose up --build
```

### Production (Fly.io)

Set the Sentry DSN as a secret in Fly.io:

```bash
# For API
fly secrets set SENTRY_DSN="https://your-api-sentry-dsn@sentry.io/project-id" --app cursor-gemini-api

# For Webapp
fly secrets set VITE_SENTRY_DSN="https://your-webapp-sentry-dsn@sentry.io/project-id" --app cursor-gemini-webapp
```

## Step 4: How Sentry Works in Your Code

### API Integration

The API uses Sentry for:
- **Error tracking**: Automatic capture of unhandled exceptions
- **Performance monitoring**: HTTP request timing, database queries
- **User context**: Associate errors with specific users
- **Custom events**: Track important business events

**Key files:**
- `api/src/config/sentry.ts` - Sentry configuration
- `api/src/index.ts` - Sentry initialization
- `api/src/middleware/errorHandler.ts` - Error handling integration

**Usage examples:**
```typescript
import { captureException, setUser, captureMessage } from '../config/sentry.js';

// Capture an error
try {
  // Some risky operation
} catch (error) {
  captureException(error, { context: 'user-action' });
}

// Set user context
setUser({ id: user.id, email: user.email });

// Capture custom events
captureMessage('User created new schema', 'info');
```

### Webapp Integration

The webapp uses Sentry for:
- **Error boundaries**: Catch React component errors
- **Performance monitoring**: Page load times, component render times
- **User sessions**: Track user journeys
- **Custom events**: Track user interactions

**Key files:**
- `webapp/src/config/sentry.ts` - Sentry configuration
- `webapp/src/App.tsx` - Sentry initialization and error boundary

**Usage examples:**
```typescript
import { captureException, setUser, captureMessage } from '../config/sentry.js';

// Capture an error
try {
  // Some risky operation
} catch (error) {
  captureException(error, { context: 'user-action' });
}

// Set user context
setUser({ id: user.id, email: user.email });

// Capture custom events
captureMessage('User clicked create button', 'info');
```

## Step 5: Testing Sentry

### Test Error Tracking

1. **API Test**: Add this to any API route temporarily:
```typescript
app.get('/test-sentry', (req, res) => {
  throw new Error('Test Sentry Error');
});
```

2. **Webapp Test**: Add this to any component temporarily:
```typescript
const testError = () => {
  throw new Error('Test Sentry Error');
};
```

3. Visit the endpoints and check your Sentry dashboard for the errors.

### Test Performance Monitoring

1. **API**: Sentry automatically tracks HTTP request performance
2. **Webapp**: Sentry automatically tracks page load and component render times

## Step 6: Sentry Dashboard Features

### Issues
- View all errors and their frequency
- See stack traces and context
- Assign issues to team members
- Mark issues as resolved

### Performance
- Monitor API response times
- Track database query performance
- Analyze user experience metrics

### Alerts
- Set up alerts for error thresholds
- Get notified via email, Slack, or webhooks
- Configure different alert rules for different environments

### Releases
- Track which version of your app caused issues
- Deploy tracking and release health
- Performance regression detection

## Step 7: Best Practices

### Error Filtering
- Don't send validation errors to Sentry (already configured)
- Filter out expected errors
- Use different sampling rates for development vs production

### User Context
- Always set user context when available
- Include relevant user information
- Don't include sensitive data

### Performance
- Use appropriate sampling rates
- Monitor performance impact
- Configure environment-specific settings

### Security
- Never log sensitive data (passwords, tokens, etc.)
- Use environment variables for DSNs
- Review Sentry's security documentation

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors**
   - Check DSN configuration
   - Verify environment variables
   - Check network connectivity

2. **Too many events**
   - Adjust sampling rates
   - Filter out noise
   - Upgrade to paid plan if needed

3. **Performance impact**
   - Reduce sampling rates
   - Use async error reporting
   - Monitor Sentry's own performance

### Getting Help

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Community](https://forum.sentry.io/)
- [Sentry Support](https://sentry.io/support/)

## Next Steps

1. **Set up alerts** for critical errors
2. **Configure release tracking** for deployments
3. **Add custom context** to important operations
4. **Monitor performance** and optimize based on data
5. **Set up team workflows** for issue management

Sentry will help you catch and fix issues before they affect your users, making your platform more reliable and maintainable.
