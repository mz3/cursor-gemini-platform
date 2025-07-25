# TypeORM Migration Path Pattern (ESM/TypeScript)

- Always use `import.meta.url` and `fileURLToPath` to determine the current file path at runtime.
- Check for `/dist/` or `/src/` in the path to select the correct migration and subscriber globs:
  - Use `src/migrations/*.ts` and `src/subscribers/*.ts` if running from source.
  - Use `dist/migrations/*.js` and `dist/subscribers/*.js` if running from compiled output.
- Do **not** rely on `NODE_ENV` alone, as CI/CD may run in production mode before code is compiled.
- This pattern prevents runtime import errors in all environments (dev, CI, production).
- Example:
  ```ts
  import { fileURLToPath } from 'url';
  const filename = fileURLToPath(import.meta.url);
  const isDist = filename.includes('/dist/') || filename.includes('\\dist\\');
  migrations: [isDist ? 'dist/migrations/*.js' : 'src/migrations/*.ts']
  ```
