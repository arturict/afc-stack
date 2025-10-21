# Quick Start Scripts

Collection of useful one-liners and scripts for common tasks.

## Setup

```bash
# Fresh install
bun install

# Setup git hooks
bun run prepare

# Start development environment
docker compose -f compose.dev.yml up -d
bun run db:migrate
bun run dev
```

## Development

```bash
# Start all services
bun run dev

# Start specific app
cd apps/web && bun run dev
cd apps/ws && bun run dev

# Format all code
bun run format

# Lint and fix
bun run lint:fix

# Type check
bun run typecheck

# Run all checks
bun run lint && bun run typecheck && bun run build
```

## Database

```bash
# Generate migration from schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Open Drizzle Studio
bun run db:studio

# Reset database (destructive!)
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up -d
bun run db:migrate
```

## Docker

```bash
# Start services
bun run docker:up

# Stop services
bun run docker:down

# View logs
bun run docker:logs

# Rebuild services
docker compose -f compose.dev.yml up -d --build

# Clean everything
docker compose -f compose.dev.yml down -v
rm -rf _data/
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/my-feature

# Commit with conventional format
git commit -m "feat(scope): description"

# Update with main
git fetch origin main
git rebase origin/main

# Push
git push origin feat/my-feature

# Create changeset
bunx changeset

# Bump versions
bun run version
```

## Testing (when implemented)

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch

# Coverage
bun run test:coverage

# E2E tests
bun run test:e2e
```

## Building

```bash
# Build all
bun run build

# Build CLI
bun run build:cli

# Clean build artifacts
bun run clean
```

## Creating New Projects

```bash
# Interactive CLI
bun run create

# With custom name
cd .. && mkdir my-new-project && cd my-new-project
# Then run CLI from afc-stack directory
```

## Troubleshooting

```bash
# Clear all caches
bun run clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
bun install

# Fix TypeScript issues
npx tsc -b --force

# Restart services
bun run docker:down
bun run docker:up
bun run dev

# Check Docker logs
docker compose -f compose.dev.yml logs postgres
docker compose -f compose.dev.yml logs minio
```

## CI/CD

```bash
# Simulate CI locally
bun run lint
bun run typecheck
bun run build
# bun run test (when implemented)

# Build Docker images
docker build -f apps/web/Dockerfile -t afc-web .
docker build -f apps/ws/Dockerfile -t afc-ws .
```

## Useful Aliases

Add these to your shell config:

```bash
# Development
alias afc-dev="bun run dev"
alias afc-build="bun run build"
alias afc-lint="bun run lint:fix"

# Database
alias afc-db-gen="bun run db:generate"
alias afc-db-mig="bun run db:migrate"
alias afc-db-studio="bun run db:studio"

# Docker
alias afc-up="bun run docker:up"
alias afc-down="bun run docker:down"
alias afc-logs="bun run docker:logs"

# Git
alias afc-cs="bunx changeset"
alias afc-version="bun run version"
```

## Environment Setup

```bash
# Copy example env
cp .env.example .env

# Generate NextAuth secret
openssl rand -base64 32

# Setup OAuth apps (example for GitHub)
# 1. Go to GitHub Settings → Developer settings → OAuth Apps
# 2. Create new app with callback: http://localhost:3000/api/auth/callback/github
# 3. Add client ID and secret to .env
```

## Production Deployment

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Or use changeset
bun run version
git push --follow-tags

# Deploy to Coolify (automatic via webhook)
# Or manual trigger:
curl -X POST $COOLIFY_WEB_HOOK_URL
curl -X POST $COOLIFY_WS_HOOK_URL
```

## Monitoring

```bash
# Check app health
curl http://localhost:3000/api/health
curl http://localhost:4001/health

# Watch logs
docker compose -f compose.dev.yml logs -f web
docker compose -f compose.dev.yml logs -f ws
```

## Performance Profiling

```bash
# Next.js build analysis
cd apps/web
ANALYZE=true bun run build

# Bundle size
cd apps/web
bunx @next/bundle-analyzer
```
