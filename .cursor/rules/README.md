# Cursor Rules Documentation

## Overview

This directory contains comprehensive rules and guidelines for the Meta-Application Platform development workflow. These rules are designed to ensure consistent, high-quality development practices across the entire team.

## Quick Start

### 🚀 **Getting Started**
1. **Read the Index**: Start with `index.md` for a complete overview
2. **Choose Your Task**: Identify which type of work you're doing
3. **Follow the Rules**: Apply the relevant rule set for your task
4. **Update Rules**: Contribute improvements when you discover better practices

### 📋 **Rule Categories**

| Category | File | Purpose | Triggers |
|----------|------|---------|----------|
| **Index** | `index.md` | Complete overview and quick reference | Always start here |
| **Development** | `development.md` | Feature development workflow | New features, code changes |
| **Architecture** | `architecture.md` | System design and structure | System design, architecture decisions |
| **Testing** | `testing.md` | Testing strategies and practices | Test writing, debugging |
| **Docker** | `docker.md` | Container management and deployment | Docker issues, deployment |
| **Security** | `security.md` | Security best practices | Security concerns, authentication |
| **Deployment** | `deployment.md` | Production deployment | Production releases |
| **CI/CD** | `cicd.md` | Continuous integration | Build failures, automation |
| **GitHub** | `gh.md` | GitHub CLI and workflows | CI monitoring, GitHub operations |
| **Fly.io** | `flyctl.md` | Fly.io deployment | Production deployment |
| **Git** | `git.md` | Version control | Commits, branching |
| **Pull Requests** | `pull_requests.md` | PR process | Code reviews, merging |
| **Bug Fixes** | `bugfixes.md` | Bug resolution | Bug reports, debugging |
| **Database** | `migrations.md` | Database management | Schema changes, migrations |
| **Personality** | `personality.md` | Interaction style | Communication |

## Rule Application Guide

### 🆕 **New Feature Development**
1. **Start with**: `index.md` → `development.md`
2. **Follow**: Database-first approach
3. **Test**: Use `testing.md` guidelines
4. **Deploy**: Follow `deployment.md` process
5. **Document**: Update relevant rules

### 🐛 **Bug Fixing**
1. **Start with**: `index.md` → `bugfixes.md`
2. **Test**: Create failing test first
3. **Debug**: Use `testing.md` debugging guide
4. **Deploy**: Follow `deployment.md` process
5. **Document**: Update rules if needed

### 🚀 **Deployment**
1. **Start with**: `index.md` → `deployment.md`
2. **Use**: `flyctl.md` for Fly.io commands
3. **Monitor**: Use `gh.md` for CI monitoring
4. **Verify**: Check logs and health endpoints
5. **Document**: Update deployment notes

### 🧪 **Testing Issues**
1. **Start with**: `index.md` → `testing.md`
2. **Verify**: Environment setup
3. **Debug**: Use troubleshooting guide
4. **Fix**: Apply relevant solutions
5. **Document**: Update test documentation

## Rule Maintenance

### 📝 **Updating Rules**
- **When**: After completing features, discovering better practices
- **How**: Edit the relevant rule file
- **What**: Add new processes, fix incorrect information
- **Validation**: Test all rule recommendations

### 🔄 **Continuous Improvement**
- **Regular Reviews**: Monthly rule reviews
- **Team Feedback**: Collect team input on rules
- **Process Evolution**: Update rules as processes improve
- **Documentation**: Keep rules current and accurate

## Rule Structure

### 📁 **File Organization**
```
.cursor/rules/
├── README.md           # This file - overview and guide
├── index.md            # Complete index and quick reference
├── development.md      # Feature development workflow
├── architecture.md     # System architecture documentation
├── testing.md          # Testing strategies and practices
├── docker.md           # Docker and container management
├── security.md         # Security best practices
├── deployment.md       # Production deployment process
├── cicd.md            # CI/CD pipeline management
├── gh.md              # GitHub CLI and workflows
├── flyctl.md          # Fly.io deployment commands
├── git.md             # Version control practices
├── pull_requests.md   # Pull request process
├── bugfixes.md        # Bug resolution workflow
├── migrations.md      # Database migration patterns
└── personality.md     # Interaction and communication style
```

### 🏷️ **Rule Format**
Each rule file follows a consistent format:
- **Overview**: Purpose and scope
- **Guidelines**: Specific rules and practices
- **Commands**: Relevant commands and examples
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended approaches

## Environment Setup

### 🐳 **Development Environment**
```bash
# Start all services
cd docker && docker compose up --build

# Verify services
docker ps

# Check logs
docker logs <service> --tail 50
```

### 🧪 **Testing Environment**
```bash
# Run all tests
docker exec -it api npm run test:unit && docker exec -it api npm run test:integration && docker exec -it webapp npm test

# Run specific tests
docker exec -it api npm run test:unit
docker exec -it webapp npm run test:e2e
```

### 🚀 **Production Environment**
```bash
# Deploy API
cd deploy && fly deploy --config fly.api.toml

# Deploy UI
cd deploy && fly deploy --config fly.ui.toml

# Check status
fly status --app <app-name>
```

## Common Scenarios

### 🔧 **Development Workflow**
1. **Plan**: Define requirements and acceptance criteria
2. **Database**: Design and implement database schema
3. **API**: Create backend endpoints and logic
4. **Frontend**: Build user interface components
5. **Test**: Write comprehensive tests
6. **Deploy**: Deploy to production
7. **Document**: Update rules and documentation

### 🐛 **Bug Resolution**
1. **Reproduce**: Create minimal reproduction case
2. **Test**: Write failing test for the bug
3. **Fix**: Implement the solution
4. **Verify**: Ensure all tests pass
5. **Deploy**: Deploy the fix
6. **Document**: Update relevant documentation

### 🚀 **Production Deployment**
1. **Prepare**: Ensure all tests pass
2. **Deploy**: Deploy to staging first
3. **Verify**: Check health endpoints
4. **Monitor**: Watch logs and metrics
5. **Rollback**: Be ready to rollback if needed
6. **Document**: Update deployment notes

## Troubleshooting

### 🔍 **Common Issues**

#### Development Issues
- **Hot Reload Not Working**: Check volume mounts, restart containers
- **Database Connection**: Verify PostgreSQL health, check environment variables
- **Test Failures**: Ensure all containers running, check test data
- **Network Issues**: Use service names, verify Docker network

#### Deployment Issues
- **Build Failures**: Check logs, verify dependencies
- **Runtime Errors**: Check environment variables, verify secrets
- **Performance Issues**: Monitor resources, check database connections
- **Security Issues**: Verify authentication, check CORS settings

### 🛠️ **Debugging Commands**
```bash
# Check container status
docker ps -a

# View logs
docker logs <container> --tail 100

# Access container
docker exec -it <container> sh

# Check network
docker network inspect platform-net

# Check database
docker exec -it postgres psql -U platform_user -d platform_db
```

## Best Practices

### 📚 **Documentation**
- **Keep Current**: Update rules when processes change
- **Be Specific**: Provide clear, actionable guidance
- **Include Examples**: Add code examples and commands
- **Cross-Reference**: Link related rules together

### 🔄 **Process Improvement**
- **Regular Reviews**: Monthly rule reviews
- **Team Input**: Collect feedback from team members
- **Validation**: Test all rule recommendations
- **Evolution**: Adapt rules as technology evolves

### 🎯 **Quality Assurance**
- **Consistency**: Follow established patterns
- **Completeness**: Cover all common scenarios
- **Accuracy**: Ensure all information is correct
- **Usability**: Make rules easy to follow

## Contributing

### 📝 **Adding New Rules**
1. **Identify Need**: Determine what's missing
2. **Research**: Gather best practices and examples
3. **Write**: Create comprehensive rule file
4. **Test**: Validate all recommendations
5. **Review**: Get team feedback
6. **Update Index**: Add to index.md

### 🔄 **Updating Existing Rules**
1. **Identify Issue**: Find what needs improvement
2. **Research**: Find better approaches
3. **Update**: Modify the rule file
4. **Test**: Validate the changes
5. **Document**: Update related documentation

### 🏷️ **Rule Standards**
- **Clear Structure**: Use consistent formatting
- **Actionable**: Provide specific, actionable guidance
- **Comprehensive**: Cover all relevant scenarios
- **Maintainable**: Easy to update and extend

## Emergency Procedures

### 🚨 **Critical Issues**
1. **Immediate Response**: Follow emergency procedures
2. **Communication**: Notify team immediately
3. **Documentation**: Document the incident
4. **Prevention**: Update rules to prevent recurrence

### 🔄 **Rollback Procedures**
1. **Identify Issue**: Determine what went wrong
2. **Rollback**: Deploy previous version
3. **Investigate**: Find root cause
4. **Fix**: Implement proper solution
5. **Deploy**: Deploy fixed version
6. **Document**: Update procedures

## Support

### 📞 **Getting Help**
- **Check Rules**: Start with relevant rule file
- **Search Index**: Use index.md for quick reference
- **Team Support**: Ask team members for guidance
- **Documentation**: Check project documentation

### 🔗 **Related Resources**
- **Project README**: Main project documentation
- **API Documentation**: Backend API documentation
- **Component Library**: Frontend component documentation
- **Deployment Guide**: Production deployment guide

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintainer**: Development Team
