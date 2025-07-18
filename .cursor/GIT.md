# Git Commit Message Conventions

## Commit Message Format

All commit messages should follow the **Conventional Commits** specification with semantic versioning tags.

### Format
```
<type>[optional scope]: <description>
```

### Examples
- `fix: admin page not working`
- `feat: add user authentication`
- `docs: update README with setup instructions`
- `style: format code with prettier`
- `refactor: simplify login component`
- `test: add unit tests for user service`
- `chore: update dependencies`

## Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation

## Rules

1. **Keep it short**: Commit messages should be concise and fit on one line
2. **Use present tense**: "add feature" not "added feature"
3. **Use imperative mood**: "move cursor" not "moves cursor"
4. **No period at the end**: End with a clean description
5. **Lowercase**: Use lowercase for the type and description
6. **Be specific**: Describe what the commit does, not what you did

## Bad Examples
- `Fixed bug` (should be `fix: resolve authentication issue`)
- `Added new feature` (should be `feat: add user dashboard`)
- `Updated docs` (should be `docs: update API documentation`)
- `WIP` (too vague)
- `stuff` (not descriptive)

## Good Examples
- `fix: resolve user login authentication issue`
- `feat: add user dashboard with analytics`
- `docs: update API endpoint documentation`
- `refactor: simplify database connection logic`
- `test: add integration tests for user routes`
- `chore: update TypeScript to v5.0` 