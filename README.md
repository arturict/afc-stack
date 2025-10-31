# AFC Stack

**Production-ready full-stack monorepo template with interactive CLI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

Create your perfect full-stack application with an interactive CLI powered by Clack Prompts.

## ⚡ Quick Start

```bash
git clone https://github.com/arturict/afc-stack.git
cd afc-stack
bun install
bun run create
```

The modern CLI lets you choose exactly what you need:

- **Language**: TypeScript or JavaScript
- **Package Manager**: Bun, pnpm, or npm
- **Database**: PostgreSQL, MySQL, SQLite, or none
- **ORM**: Drizzle (recommended), Prisma, or none
- **Auth**: NextAuth v5 (recommended), Lucia, Clerk, or none
- **Styling**: Tailwind CSS, shadcn/ui, or none
- **Realtime**: WebSocket (optional, can add later), SSE, or none
- **Storage**: MinIO/S3, UploadThing, or none
- **Analytics**: PostHog, Plausible, Umami, or none
- **Rate Limiting**: Arcjet, Upstash, Unkey, or none
- **Deployment**: Coolify (recommended), Vercel, Railway
- **CI/CD**: GitHub Actions workflows
- **Docker**: Production-ready Dockerfiles

## 🎯 Features

### Pre-configured Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, NextAuth v5
- **Database**: Drizzle ORM + PostgreSQL
- **Realtime**: Optional WebSocket service (Fastify)
- **Storage**: MinIO (dev) / UploadThing (prod)
- **Analytics**: PostHog Cloud
- **Security**: Arcjet rate limiting
- **Deploy**: Coolify, CI/CD via GitHub Actions

## Project Structure

```
afc-stack/
├─ apps/
│  ├─ web/          # Next.js frontend + API routes
│  └─ ws/           # WebSocket service (optional)
├─ packages/
│  └─ db/           # Drizzle schema + client
├─ drizzle/         # SQL migrations
└─ .github/         # CI/CD workflows
```

**Note**: WebSocket service is optional. You can start without it and add it later when needed.

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.3.0+
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
    - WebSocket: ws://localhost:4001 (if enabled)
    - MinIO Console: http://localhost:9001

## Adding WebSocket Later

If you didn't select WebSocket during setup but need it now:

```bash
bun run add:websocket
```

This will:

- Add the WebSocket service to `apps/ws`
- Update your frontend with realtime functionality
- Configure environment variables
- Update API routes to broadcast events

See `cli-templates/extras/websocket/README.md` for detailed documentation.

### Create MinIO Bucket

1. Open http://localhost:9001
2. Login: `minio` / `minio12345`
3. Create bucket named `uploads`

## Production Deployment

### Coolify Setup

**Deployment URL**: [cloud.artur.engineer](https://cloud.artur.engineer)

1. **Database**: Create PostgreSQL instance
2. **Web App**:
    - Dockerfile: `apps/web/Dockerfile`
    - Port: 3000
    - Add environment variables from `.env.example`
3. **WebSocket Service** (optional):
    - Dockerfile: `apps/ws/Dockerfile`
    - Port: 4001
    - Enable WebSocket proxy
    - Only needed if using realtime features

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
- `bun test` - Run all tests with Bun's native test runner
- `bun test --watch` - Run tests in watch mode

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
