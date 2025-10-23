# blog - Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Database

Copy environment file and update if needed:
```bash
cp .env.example .env
```

Generate and run database migrations:
```bash
# Generate migration files
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate

# Optional: Open Drizzle Studio to view database
bunx drizzle-kit studio
```

### 3. Start Development Server

```bash
bun run dev
```

## Access Points

- **Web App**: http://localhost:3000

## Useful Commands

```bash
# View this setup guide anytime
bun run setup

# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run linter

# Database (Drizzle)
bunx drizzle-kit generate  # Generate migrations
bunx drizzle-kit migrate   # Apply migrations
bunx drizzle-kit studio    # Open Drizzle Studio
```

## Project Structure

This is a monorepo using Turborepo:

- `apps/web` - Next.js frontend application
- `packages/db` - Shared database schema and client
- `packages/*` - Other shared packages

## Next Steps

1. Start building your app in `apps/web/src`
2. Define database schema in `packages/db/src/schema.ts`
3. Add API routes in `apps/web/src/app/api`
4. Customize configuration as needed

## Troubleshooting

### Need help?

Run `bun run setup` to see this guide again.
