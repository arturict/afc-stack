# backtrace-v2 - Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start Docker Services

Start the local development services (postgres):

```bash
# Start services in background
bun run docker:up

# Or start with logs visible
docker compose up

# Stop services
bun run docker:down

# View logs
bun run docker:logs
```

#### Alternative: Docker Run Commands

If you prefer not to use Docker Compose, you can run services individually:

**PostgreSQL:**
```bash
docker run -d \
  --name backtrace-v2-postgres \
  -e POSTGRES_DB=app \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=app \
  -p 5432:5432 \
  -v backtrace-v2_postgres_data:/var/lib/postgresql/data \
  postgres:16
```

### 3. Setup Database

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

### 4. Start Development Server

```bash
bun run dev
```

## Access Points

- **Web App**: http://localhost:3000
- **Database**: localhost:5432

## Useful Commands

```bash
# View this setup guide anytime
bun run setup

# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run linter

# Docker Services
bun run docker:up    # Start services
bun run docker:down  # Stop services
bun run docker:logs  # View logs

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

### Docker services not starting?

```bash
# Check if ports are already in use
lsof -i :5432

# Stop and remove containers
docker compose down -v
# Start fresh
docker compose up
```

### Database connection issues?

Make sure:
- Docker services are running (`docker compose ps`)
- Environment variables in `.env` match docker-compose.yml
- Database is ready (check with `bun run docker:logs`)

### Need help?

Run `bun run setup` to see this guide again.
