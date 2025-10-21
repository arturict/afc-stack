# Code Quality Standards

## Overview

This document defines code quality standards and tools for the AFC Stack.

## Tools & Configuration

### ESLint
- ✅ **Configured**: Next.js Core Web Vitals
- ✅ **Auto-fix on save**: Via VSCode settings
- ✅ **Pre-commit**: Via lint-staged

### Prettier
- ✅ **Configured**: Consistent formatting
- ✅ **Settings**:
  - Semi: true
  - Single Quote: false
  - Tab Width: 4
  - Print Width: 120
  - Trailing Comma: none

### TypeScript
- ✅ **Strict Mode**: Enabled
- ✅ **Project References**: Monorepo setup
- ✅ **Type Checking**: `bun run typecheck`

### Commitlint
- ✅ **Conventional Commits**: Enforced
- ✅ **Pre-commit hook**: Validates format

## Code Quality Metrics

### Current Status

#### Build ✅
```bash
bun run build  # All packages build successfully
```

#### Type Safety ✅
```bash
bun run typecheck  # Zero TypeScript errors (after fixes)
```

#### Linting ✅
```bash
bun run lint  # Zero ESLint warnings/errors
```

#### Formatting ✅
```bash
bun run format:check  # All files formatted
```

## Standards

### TypeScript

#### Type Safety
```typescript
// ✅ Good - Explicit types
function createUser(name: string, age: number): User {
    return { name, age };
}

// ❌ Bad - Implicit any
function createUser(name, age) {
    return { name, age };
}
```

#### Null Safety
```typescript
// ✅ Good - Handle null/undefined
const user = getUser();
if (user) {
    console.log(user.name);
}

// ❌ Bad - Unsafe access
const user = getUser();
console.log(user.name); // Could crash
```

#### Return Types
```typescript
// ✅ Good - Explicit return type
async function fetchData(): Promise<Data[]> {
    return await fetch('/api/data');
}

// ❌ Bad - Inferred return type (for public APIs)
async function fetchData() {
    return await fetch('/api/data');
}
```

### React/Next.js

#### Server Components (Default)
```tsx
// ✅ Good - Server Component
export default async function Page() {
    const data = await fetchData();
    return <div>{data.title}</div>;
}

// ❌ Bad - Unnecessary client component
"use client";
export default function Page({ data }) {
    return <div>{data.title}</div>;
}
```

#### Client Components (When Needed)
```tsx
// ✅ Good - Use client only for interactivity
"use client";
import { useState } from "react";

export default function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

#### Error Handling
```tsx
// ✅ Good - Error boundaries
export default function Page() {
    return (
        <ErrorBoundary fallback={<Error />}>
            <SuspenseComponent />
        </ErrorBoundary>
    );
}
```

### API Routes

#### Input Validation
```typescript
// ✅ Good - Zod validation
const schema = z.object({
    email: z.string().email(),
    age: z.number().min(18)
});

export async function POST(req: Request) {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    // Use parsed.data
}
```

#### Error Responses
```typescript
// ✅ Good - Consistent error format
return NextResponse.json(
    { error: "not_found", message: "User not found" },
    { status: 404 }
);

// ❌ Bad - Inconsistent errors
return new Response("Error!", { status: 500 });
```

#### Rate Limiting
```typescript
// ✅ Good - Always rate limit public endpoints
const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [fixedWindow({ mode: "LIVE", window: "10s", max: 10 })]
});

export async function POST(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    // Handle request
}
```

### Database (Drizzle)

#### Schema Definition
```typescript
// ✅ Good - Explicit constraints
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
});
```

#### Queries
```typescript
// ✅ Good - Explicit selection
const users = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.active, true))
    .limit(10);

// ❌ Bad - SELECT *
const users = await db.select().from(users);
```

#### Transactions
```typescript
// ✅ Good - Use transactions for multi-step operations
await db.transaction(async (tx) => {
    await tx.insert(users).values(userData);
    await tx.insert(profiles).values(profileData);
});
```

## Testing Standards (Future)

### Unit Tests
- Coverage target: 80%
- Test utilities and helpers
- Mock external dependencies

### Integration Tests
- Test API routes end-to-end
- Use test database
- Clean up after tests

### E2E Tests
- Test critical user flows
- Use Playwright
- Run in CI/CD

## Performance Standards

### Bundle Size
- Monitor with `@next/bundle-analyzer`
- Lazy load large dependencies
- Code split routes

### Lighthouse Scores
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### Database
- Index frequently queried columns
- Use connection pooling (max 5)
- Monitor slow queries

## Security Standards

### Input Validation
- ✅ Always validate with Zod
- ✅ Sanitize user input
- ✅ Use parameterized queries (Drizzle does this)

### Authentication
- ✅ Use NextAuth v5
- ✅ HTTPS only in production
- ✅ Secure session cookies

### Rate Limiting
- ✅ All public endpoints
- ✅ Appropriate limits per endpoint
- ✅ Monitor with Arcjet dashboard

### Environment Variables
- ✅ Never commit secrets
- ✅ Validate with Zod
- ✅ Use typed access

## Documentation Standards

### Code Comments
```typescript
// ✅ Good - Explain WHY, not WHAT
// Use exponential backoff to handle rate limits gracefully
await retryWithBackoff(fetchData);

// ❌ Bad - Obvious comments
// Fetch data from API
await fetchData();
```

### JSDoc (Public APIs)
```typescript
/**
 * Uploads a file to S3-compatible storage
 * @param file - The file to upload
 * @returns Upload result with key and optional URL
 * @throws {Error} If storage provider is not configured
 */
export async function uploadFile(file: File): Promise<UploadResult> {
    // Implementation
}
```

### README Updates
- Update when adding features
- Keep examples up-to-date
- Document breaking changes

## Automated Checks

### Pre-commit (via Husky)
1. ✅ Format code (Prettier)
2. ✅ Lint code (ESLint)
3. ✅ Type check (TypeScript)

### Pre-push (Future)
1. Run tests
2. Check bundle size
3. Verify build

### CI/CD
1. ✅ Lint
2. ✅ Type check
3. ✅ Build
4. Tests (when implemented)
5. Deploy

## Code Review Checklist

### For Authors
- [ ] Self-review code
- [ ] Add/update tests
- [ ] Update documentation
- [ ] Check TypeScript errors
- [ ] Run linter
- [ ] Test locally
- [ ] Add changeset if needed

### For Reviewers
- [ ] Code follows style guide
- [ ] Types are correct
- [ ] Error handling is proper
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Tests are adequate
- [ ] Documentation updated

## Tools to Add (Future)

### Static Analysis
- [ ] **SonarQube** - Code quality and security
- [ ] **CodeClimate** - Maintainability scoring
- [ ] **Snyk** - Dependency vulnerability scanning

### Runtime Monitoring
- [ ] **Sentry** - Error tracking
- [ ] **LogRocket** - Session replay
- [ ] **Datadog** - APM and logging

### Performance
- [ ] **Lighthouse CI** - Performance budgets
- [ ] **Bundle Analyzer** - Bundle size tracking
- [ ] **Web Vitals** - Core metrics

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Best Practices](https://nextjs.org/docs/pages/building-your-application/routing/introduction)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
