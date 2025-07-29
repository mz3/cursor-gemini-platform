# Security Rules

## Authentication & Authorization

### JWT Implementation
- **Secret Management**: Use strong, unique JWT secrets for each environment
- **Token Expiration**: Set reasonable expiration times (15-60 minutes for access tokens)
- **Refresh Tokens**: Implement refresh token rotation for better security
- **Token Validation**: Always validate JWT tokens on protected routes
- **Secret Storage**: Use Fly.io secrets for production JWT secrets

### Password Security
- **Hashing**: Use bcrypt with salt rounds ≥ 12 for password hashing
- **Validation**: Enforce strong password policies (min 8 chars, complexity)
- **Rate Limiting**: Implement rate limiting on login endpoints
- **Brute Force Protection**: Lock accounts after failed attempts

### Session Management
- **Secure Cookies**: Use httpOnly, secure, sameSite flags
- **Session Timeout**: Implement automatic session expiration
- **Logout**: Properly invalidate sessions on logout

## Data Protection

### Input Validation
- **Sanitization**: Sanitize all user inputs to prevent XSS
- **Validation**: Use class-validator for comprehensive input validation
- **Type Safety**: Leverage TypeScript for compile-time validation
- **SQL Injection**: Use TypeORM query builder to prevent SQL injection

### Data Encryption
- **At Rest**: Encrypt sensitive data in database
- **In Transit**: Use HTTPS/TLS for all communications
- **API Keys**: Store API keys securely using environment variables
- **Secrets**: Never commit secrets to version control

### Privacy Compliance
- **GDPR**: Implement data deletion and export capabilities
- **PII Protection**: Minimize collection of personally identifiable information
- **Data Retention**: Implement data retention policies
- **User Consent**: Get explicit consent for data collection

## API Security

### CORS Configuration
- **Origin Validation**: Restrict CORS to trusted domains only
- **Credentials**: Handle credentials properly in CORS
- **Methods**: Limit HTTP methods to required ones only

### Rate Limiting
- **API Limits**: Implement rate limiting on all API endpoints
- **User Limits**: Per-user rate limiting for sensitive operations
- **IP Limits**: IP-based rate limiting for public endpoints

### Request Validation
- **Content-Type**: Validate Content-Type headers
- **Size Limits**: Implement request size limits
- **File Uploads**: Validate file types and sizes for uploads

## Infrastructure Security

### Container Security
- **Base Images**: Use official, minimal base images
- **Multi-stage Builds**: Use multi-stage builds to reduce attack surface
- **Non-root User**: Run containers as non-root user when possible
- **Image Scanning**: Regularly scan Docker images for vulnerabilities

### Network Security
- **Service Isolation**: Use Docker networks to isolate services
- **Port Exposure**: Only expose necessary ports
- **Internal Communication**: Use service names for internal communication
- **Health Checks**: Implement proper health checks

### Environment Security
- **Environment Variables**: Use environment variables for configuration
- **Secret Management**: Use Fly.io secrets for sensitive data
- **Configuration**: Separate dev/staging/prod configurations
- **Logging**: Implement secure logging without sensitive data

## Security Best Practices

### Code Security
- **Dependencies**: Regularly update dependencies and scan for vulnerabilities
- **Code Review**: Security-focused code reviews for all changes
- **Static Analysis**: Use ESLint security plugins
- **Error Handling**: Don't expose sensitive information in error messages

### Monitoring & Alerting
- **Security Logs**: Log security events and authentication attempts
- **Anomaly Detection**: Monitor for unusual access patterns
- **Alerting**: Set up alerts for security events
- **Incident Response**: Have a plan for security incidents

### Testing Security
- **Security Tests**: Include security tests in CI/CD pipeline
- **Penetration Testing**: Regular security assessments
- **Vulnerability Scanning**: Automated vulnerability scanning
- **Dependency Scanning**: Scan for known vulnerabilities in dependencies

## Security Checklist

### Before Deployment
- [ ] All secrets are stored in Fly.io secrets
- [ ] JWT secrets are strong and unique
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is comprehensive
- [ ] Error messages don't expose sensitive data
- [ ] Dependencies are up to date
- [ ] Security headers are configured

### During Development
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Implement proper authentication
- [ ] Use secure session management
- [ ] Log security events
- [ ] Follow principle of least privilege
- [ ] Regular security reviews

### Emergency Security Procedures

#### Compromised Credentials
1. Immediately rotate JWT secrets
2. Force all users to re-authenticate
3. Audit access logs for suspicious activity
4. Update affected user passwords
5. Monitor for further suspicious activity

#### Data Breach Response
1. Isolate affected systems
2. Assess scope of breach
3. Notify affected users
4. Implement additional security measures
5. Document incident and lessons learned

#### Vulnerability Disclosure
1. Acknowledge vulnerability report
2. Assess severity and impact
3. Develop and test fix
4. Deploy fix to all environments
5. Notify users if necessary

## Security Tools & Commands

### Dependency Scanning
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Security Testing
```bash
# Run security tests
npm run test:security

# Check for secrets in code
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules
```

### Environment Security
```bash
# Set Fly.io secrets
fly secrets set JWT_SECRET="your-secure-secret"

# Check current secrets
fly secrets list --app <app-name>

# Rotate secrets
fly secrets set JWT_SECRET="new-secure-secret"
```

## Security Documentation

### Security Headers
```typescript
// Example security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting Example
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

app.use('/auth/login', authLimiter);
```

### Input Validation Example
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```
