# AFC Stack

Modern full-stack monorepo template with Next.js, Drizzle, WebSockets, and more.

## 🚀 Quick Start with CLI

Create a custom stack with your preferred technologies:

```bash
bun create-repo.ts
```

The interactive CLI lets you choose:
- Language (TypeScript/JavaScript)
- Package manager (Bun/pnpm/npm)
- Database (Postgres/MySQL/SQLite)
- ORM (Drizzle/Prisma)
- Auth (NextAuth/Lucia/Clerk)
- Styling (Tailwind/shadcn)
- And much more...

See [CLI.md](./CLI.md) for detailed documentation.

## 📦 Pre-configured Template

Or use this complete template directly:

## Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, NextAuth v5
- **Database**: Drizzle ORM + PostgreSQL
- **Realtime**: Fastify WebSocket service
- **Storage**: MinIO (dev) / UploadThing (prod)
- **Analytics**: PostHog Cloud
- **Security**: Arcjet rate limiting
- **Deploy**: Coolify, CI/CD via GitHub Actions

## Project Structure

```
afc-stack/
├─ apps/
│  ├─ web/          # Next.js frontend
│  └─ ws/           # Fastify WebSocket service
├─ packages/
│  └─ db/           # Drizzle schema + client
├─ drizzle/         # SQL migrations
└─ .github/         # CI/CD workflows
```

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.1.31+
- Docker & Docker Compose

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd afc-stack
   bun install
   ```

2. **Start local services (Postgres + MinIO)**
   ```bash
   docker compose -f compose.dev.yml up -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Run migrations**
   ```bash
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   ```

5. **Start dev servers**
   ```bash
   bun run dev
   ```

   This starts:
   - Web: http://localhost:3000
   - WebSocket: ws://localhost:4001
   - MinIO Console: http://localhost:9001

### Create MinIO Bucket

1. Open http://localhost:9001
2. Login: `minio` / `minio12345`
3. Create bucket named `uploads`

## Production Deployment

### Coolify Setup

1. **Database**: Create PostgreSQL instance
2. **Web App**: 
   - Dockerfile: `apps/web/Dockerfile`
   - Port: 3000
   - Add environment variables from `.env.example`
3. **WebSocket Service**:
   - Dockerfile: `apps/ws/Dockerfile`
   - Port: 4001
   - Enable WebSocket proxy

### GitHub Secrets

Add these secrets to your GitHub repository:

- `COOLIFY_WEB_HOOK_URL`: Deploy webhook for web app
- `COOLIFY_WS_HOOK_URL`: Deploy webhook for WS service

### Deploy Flow

Push to `main` branch → GitHub Actions builds Docker images → pushes to GHCR → triggers Coolify deployment

## Scripts

- `bun run dev` - Start all services in dev mode
- `bun run build` - Build all apps
- `bun run lint` - Lint all code
- `bun run test` - Run all tests

## Database Migrations

```bash
# Generate migration
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate

# Open Drizzle Studio
bunx drizzle-kit studio
```

## OAuth Provider Setup

### GitHub OAuth

1. Go to Settings → Developer settings → OAuth Apps
2. Create new app with callback: `https://your-domain.com/api/auth/callback/github`
3. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env`

### Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

### Discord OAuth

1. Go to Discord Developer Portal → Applications
2. Add redirect: `https://your-domain.com/api/auth/callback/discord`
3. Add `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` to `.env`

## Environment Variables

See `.env.example` for all available options. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random 32+ character string
- `NEXTAUTH_URL`: Your app URL
- `NEXT_PUBLIC_WS_URL`: WebSocket URL (public)
- `WS_INTERNAL_URL`: WebSocket URL (internal)

## Tech Stack Details

### Authentication

NextAuth v5 with Drizzle adapter. Supports:
- Email magic links (via Resend)
- GitHub OAuth
- Google OAuth
- Discord OAuth

### File Uploads

Development uses MinIO (S3-compatible), production uses UploadThing. Switch via `STORAGE_PROVIDER` env var.

### Realtime

WebSocket service broadcasts events to all connected clients. Web app posts events to WS service via internal URL.

### Rate Limiting

Arcjet protects API routes. Configure per-route in route handlers.

### Analytics

PostHog Cloud tracks pageviews and custom events. Configured in `providers.tsx`.

## License

MIT
