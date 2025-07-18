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

## GitHub Issue Formatting

When creating or editing GitHub Issues, follow these best practices for clarity and consistency:

- **Use Markdown**: Format issue bodies using markdown for headings, lists, and emphasis.
- **Use Proper Newlines**: Write the issue body in a markdown file or editor to ensure newlines and sections render correctly. Avoid using literal `\n` in the text; use real line breaks.
- **When Using GitHub CLI**: Always use the `--body-file` option (e.g., `gh issue create --body-file issue.md`) when creating or editing issues to ensure markdown and newlines are preserved. Do not pass multi-line bodies directly on the command line, as this can result in `\n` characters appearing in the issue.
- **Structure Your Issue**: Use clear sections such as:
  - `**Describe the bug**`
  - `**Steps to Reproduce**`
  - `**Expected Behavior**`
  - `**Environment**`
  - `**Additional Context**`
- **Example Template**:

```
**Describe the bug**
A clear and concise description of what the bug is.

**Steps to Reproduce**
1. Step one
2. Step two
3. ...

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Environment**
- Platform: [e.g. UI, API]
- Browser: [e.g. Chrome, Firefox]
- OS: [e.g. Ubuntu, macOS]

**Additional Context**
Add any other context about the problem here.
```

- **Use Labels**: Add appropriate labels (e.g., `bug`, `enhancement`) to help triage and organize issues.
- **Preview Before Submitting**: Always preview the issue to ensure formatting is correct and readable.

This ensures issues are actionable, easy to read, and consistent across the project. 