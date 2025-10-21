# Stack Generator CLI

Interactive CLI tool to create custom full-stack projects with your preferred technologies.

## Features

Choose from multiple options for each layer:

### Language

- TypeScript (recommended)
- JavaScript

### Package Manager

- Bun (recommended)
- pnpm
- npm

### Project Structure

- Monorepo (Turborepo)
- Single app

### Database

- PostgreSQL (recommended)
- MySQL
- SQLite
- None

### ORM/Query Builder

- Drizzle (recommended)
- Prisma
- None

### Authentication

- NextAuth v5 (recommended)
- Lucia
- Clerk
- None

### UI/Styling

- Tailwind CSS (recommended)
- shadcn/ui
- None

### Realtime

- WebSocket (Fastify)
- Server-Sent Events
- None

### File Storage

- MinIO (dev) + S3 (prod)
- UploadThing
- AWS S3
- None

### Analytics

- PostHog (recommended)
- Plausible
- Umami
- None

### Rate Limiting

- Arcjet (recommended)
- Upstash
- Unkey
- None

### Deployment

- Coolify (recommended)
- Vercel
- Railway
- None

### Additional

- CI/CD (GitHub Actions)
- Docker support
- Development environment (docker-compose)

## Usage

```bash
bun create-repo.ts
```

The CLI will guide you through selecting your preferences:

1. **Project name**: Enter your project name
2. **Language**: Choose TypeScript or JavaScript
3. **Package manager**: Select your preferred package manager
4. **Monorepo**: Decide on project structure
5. **Database**: Pick your database
6. **ORM**: Choose your ORM if using a database
7. **Authentication**: Select auth provider
8. **Styling**: Choose UI framework
9. **Realtime**: Pick realtime solution
10. **Storage**: Select file storage
11. **Analytics**: Choose analytics provider
12. **Rate limiting**: Pick rate limiter
13. **Deployment**: Select deployment target
14. **CI/CD**: Include GitHub Actions workflows
15. **Docker**: Generate Dockerfiles

After answering all questions, the tool will:

- Show a configuration summary
- Ask for confirmation
- Generate the complete project structure
- Install dependencies (optional)
- Initialize git repository
- Create all necessary config files

## Example

```bash
$ bun create-repo.ts

🚀 Welcome to the Stack Generator!

Let's create your perfect full-stack setup.

Project name: my-awesome-app

Choose language (default: typescript)
  1. typescript
  2. javascript

Your choice: 1

Package manager (default: bun)
  1. bun
  2. pnpm
  3. npm

Your choice: 1

Use monorepo structure? [Y/n]: y

Database (default: postgres)
  1. postgres
  2. mysql
  3. sqlite
  4. none

Your choice: 1

...

📋 Configuration Summary:
  name: my-awesome-app
  language: typescript
  packageManager: bun
  monorepo: true
  database: postgres
  orm: drizzle
  auth: nextauth
  ...

Proceed with this configuration? [Y/n]: y

📦 Creating project: my-awesome-app
✓ Created project directory
✓ Created monorepo structure
✓ Generated package.json
✓ Generated config files
✓ Generated database setup
✓ Generated auth setup
✓ Generated CI/CD workflows
✓ Generated Dockerfile
✓ Generated README

✅ Project created successfully!

Next steps:
  cd my-awesome-app
  bun install
  docker compose up -d
  bunx drizzle-kit generate
  bunx drizzle-kit migrate
  bun run dev
```

## Generated Project

The tool generates a complete, production-ready project with:

- ✅ Next.js 15 (App Router)
- ✅ Full TypeScript/JavaScript support
- ✅ Configured ORM with example schema
- ✅ Authentication setup
- ✅ Database with Docker Compose
- ✅ Styled components/pages
- ✅ CI/CD workflows
- ✅ Dockerfiles for deployment
- ✅ ESLint + Prettier
- ✅ Environment variable validation
- ✅ README with setup instructions
- ✅ .gitignore and config files

## Customization

After generation, you can:

1. Review generated code
2. Modify configurations
3. Add/remove dependencies
4. Customize workflows
5. Add more features

## Recommendations

For a production-ready SaaS/dashboard:

- **Language**: TypeScript
- **Package Manager**: Bun
- **Structure**: Monorepo
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Auth**: NextAuth
- **Styling**: Tailwind + shadcn/ui
- **Realtime**: WebSocket
- **Storage**: MinIO (dev) → S3/UploadThing (prod)
- **Analytics**: PostHog
- **Rate Limiting**: Arcjet
- **Deployment**: Coolify
- **CI/CD**: Yes
- **Docker**: Yes

This combination provides the best developer experience and production performance.

## Requirements

- Bun 1.1.31+ (or Node.js 20+ if using npm/pnpm)
- Git
- Docker (optional, for database)

## License

MIT
