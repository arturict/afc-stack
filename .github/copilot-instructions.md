# GitHub Copilot Instructions for AFC Stack

## Project Overview

AFC Stack is a production-ready full-stack monorepo template with an interactive CLI for customizable project generation. It combines Next.js 15, TypeScript, Drizzle ORM, WebSockets, and modern tooling.

## Core Architecture

### Monorepo Structure
- **Root**: Turborepo workspace with shared configs
- **apps/web**: Next.js 15 App Router frontend (TypeScript)
- **apps/ws**: Fastify WebSocket service (Bun runtime)
- **packages/db**: Shared Drizzle ORM schema and client
- **cli-templates/**: Template files for project generation

### Technology Stack
- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Fastify WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth v5 (beta)
- **Storage**: MinIO (dev), S3/UploadThing (prod)
- **Analytics**: PostHog Cloud
- **Rate Limiting**: Arcjet
- **Package Manager**: Bun (primary), supports pnpm/npm
- **Build Tool**: Turborepo, tsup for CLI

## Code Style & Conventions

### TypeScript
- Use strict mode always
- Prefer interfaces over types for objects
- Use type inference when obvious
- Explicitly type function returns for public APIs
- Use `const` for all variables unless mutation needed

### React/Next.js
- Server Components by default
- Use `"use client"` only when necessary (hooks, events)
- File-based routing in `app/` directory
- API routes in `app/api/`
- Colocation of related files encouraged

### Naming Conventions
- **Files**: kebab-case for regular files, PascalCase for React components
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Database tables**: snake_case (e.g., `user_sessions`)

### Code Organization
```typescript
// Order of imports:
// 1. External dependencies
// 2. Internal packages (@ac/*)
// 3. Relative imports
// 4. Types

import { useState } from "react";
import { db, users } from "@ac/db";
import { formatDate } from "@/lib/utils";
import type { User } from "@/types";
```

## Development Guidelines

### Database (Drizzle ORM)
- Define schemas in `packages/db/src/schema.ts`
- Use relations for foreign keys
- Always create migrations with `drizzle-kit generate`
- Test migrations locally before deploying
- Use prepared statements for repeated queries

Example:
```typescript
// Good
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### API Routes
- Use Zod for validation
- Implement proper error handling
- Apply rate limiting with Arcjet
- Use Next.js request/response helpers
- Return consistent error shapes

Example:
```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import arcjet from "@arcjet/next";

const schema = z.object({ /* ... */ });

export async function POST(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    
    // ... handle request
}
```

### WebSocket Service
- Keep logic in `apps/ws/src/server.ts`
- Use Fastify plugins for modularity
- Broadcast events to all connected clients
- Handle connection/disconnection gracefully
- Log errors with Fastify logger

### Environment Variables
- Validate in `apps/web/src/env.ts` using Zod
- Always provide `.env.example`
- Never commit actual `.env` files
- Use `NEXT_PUBLIC_` prefix for client-side vars
- Use typed env access: `env.DATABASE_URL`

### Error Handling
- Use try-catch for async operations
- Log errors with context
- Return user-friendly messages
- Use appropriate HTTP status codes
- Handle edge cases explicitly

## CLI Development

### Interactive Prompts
- Use `@clack/prompts` for all user input
- Provide sensible defaults (marked with "recommended")
- Validate input immediately
- Show progress with spinners
- Handle cancellation gracefully

### Template System
- Base templates in `cli-templates/base/`
- Optional features in `cli-templates/extras/`
- Use conditional copying based on user choices
- Generate configs programmatically
- Preserve file permissions

### Build & Distribution
- Build with tsup: `bun run build:cli`
- Output to `dist/` (gitignored)
- Bundle all dependencies
- Use shebang for CLI entry
- Test in temp directory before release

## Testing Strategy

### Unit Tests
- Test utilities and helpers
- Mock external dependencies
- Use descriptive test names
- Aim for 80%+ coverage on critical paths

### Integration Tests
- Test API routes end-to-end
- Use test database
- Clean up after tests
- Test error scenarios

### E2E Tests (future)
- Use Playwright for browser tests
- Test critical user flows
- Run in CI pipeline

## Performance Optimization

### Frontend
- Use React Server Components by default
- Implement loading states
- Optimize images with Next.js Image
- Code-split large components
- Use `suspense` for data fetching

### Backend
- Use connection pooling (max 5 for Postgres)
- Implement caching where appropriate
- Optimize database queries
- Use indexes for frequent queries
- Monitor with PostHog

### Build
- Leverage Turborepo cache
- Optimize bundle size
- Use dynamic imports for large dependencies
- Configure proper `tsconfig` paths

## Deployment

### Docker
- Multi-stage builds for smaller images
- Use Alpine base images
- Run migrations before app start
- Health checks on all services
- Set proper environment variables

### CI/CD
- GitHub Actions for automation
- Run lint, typecheck, and tests
- Build Docker images on main branch
- Deploy via Coolify webhooks
- Auto-update dependencies with Dependabot

## Security Best Practices

- Validate all user input with Zod
- Use rate limiting on all public endpoints
- Sanitize database queries (Drizzle handles this)
- Use HTTPS in production
- Implement CSRF protection (NextAuth handles this)
- Regular dependency updates
- Never log sensitive data
- Use environment variables for secrets

## Common Patterns

### Server Action (Next.js 15)
```typescript
"use server";
import { db } from "@ac/db";

export async function createTodo(title: string) {
    const [todo] = await db.insert(todos)
        .values({ title })
        .returning();
    return todo;
}
```

### WebSocket Broadcast
```typescript
// In apps/ws
const clients = new Set<WebSocket>();

// Broadcast helper
function broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ type: event, payload: data });
    for (const client of clients) {
        client.send(message);
    }
}
```

### Type-Safe Environment
```typescript
import { z } from "zod";

export const env = z.object({
    DATABASE_URL: z.string().url(),
    // ... other vars
}).parse(process.env);
```

## Troubleshooting

### Common Issues

**Turborepo cache issues**: Run `bun run clean` and reinstall
**Database connection fails**: Check Docker compose is running
**TypeScript errors in monorepo**: Verify `tsconfig.json` references
**WebSocket not connecting**: Check CORS and firewall settings
**Build fails in CI**: Ensure all dependencies are in package.json

## Version Management

### Changesets
- Create changeset: `bunx changeset`
- Version bump: `bun run version`
- Choose semver level (major/minor/patch)
- Write meaningful changelog entries
- Commit changeset files

## When Making Changes

1. **Check existing patterns** - Follow established conventions
2. **Write tests** - Especially for critical functionality  
3. **Update docs** - Keep README and docs in sync
4. **Run linters** - `bun run lint` before committing
5. **Test locally** - Verify changes work end-to-end
6. **Create changeset** - Document user-facing changes

## Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Clack Prompts](https://github.com/natemoo-re/clack)
- [Changesets](https://github.com/changesets/changesets)

## AI Pair Programming Tips

When working with AI assistants on this project:

1. **Be specific** about which app/package you're working in
2. **Mention the tech** being used (e.g., "in the Drizzle schema")
3. **Ask for explanations** of patterns you don't understand
4. **Request alternatives** if a solution doesn't fit the architecture
5. **Validate suggestions** against these guidelines before implementing
6. **Consider implications** on other parts of the monorepo

Remember: This is a template project. Changes should be generalizable and follow best practices for others to use.
