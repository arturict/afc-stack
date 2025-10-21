# Contributing Guide

## Development Workflow

1. **Create a branch** for your feature/fix:

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make your changes** following the code style
3. **Test locally**:

    ```bash
    bun run lint
    bun run test
    bun run build
    ```

4. **Commit** with descriptive messages:

    ```bash
    git commit -m "feat: add new feature"
    ```

5. **Push** and create a pull request:
    ```bash
    git push origin feature/your-feature-name
    ```

## Commit Convention

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Code Style

- Use Prettier for formatting (automatic on save)
- Follow ESLint rules
- 4 spaces for indentation
- Use TypeScript strictly
- Add types, avoid `any`

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test UI changes in both light/dark mode
- Test responsive design

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] PR description filled

## Project Structure

### Adding a New Package

```bash
mkdir -p packages/new-package/src
cd packages/new-package
bun init -y
```

Update `tsconfig.base.json`:

```json
{
    "paths": {
        "@ac/new-package": ["packages/new-package/src"]
    }
}
```

### Adding API Routes

Create in `apps/web/src/app/api/your-route/route.ts`:

```ts
import { NextResponse } from "next/server";
import arcjet from "@arcjet/next";

export async function GET(req: Request) {
    // Your logic
    return NextResponse.json({ data: "..." });
}
```

### Database Changes

1. Update schema in `packages/db/src/schema.ts`
2. Generate migration: `bunx drizzle-kit generate`
3. Test migration locally: `bunx drizzle-kit migrate`
4. Commit both schema and migration files

## Questions?

Open an issue or discussion for help.
