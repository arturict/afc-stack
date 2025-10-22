#!/usr/bin/env node
import * as p from "@clack/prompts";
import { setTimeout } from "node:timers/promises";
import color from "picocolors";
import fs from "fs-extra";
import path from "path";
import { execa } from "execa";

interface ProjectConfig {
    name: string;
    language: "typescript" | "javascript";
    orm: "drizzle" | "prisma" | "none";
    auth: "nextauth" | "lucia" | "clerk" | "none";
    realtime: "websocket" | "sse" | "none";
    storage: "minio" | "uploadthing" | "s3" | "none";
    analytics: "posthog" | "plausible" | "umami" | "none";
    ratelimit: "arcjet" | "upstash" | "unkey" | "none";
    styling: "tailwind" | "shadcn" | "none";
    database: "postgres" | "mysql" | "sqlite" | "none";
    deployment: "coolify" | "vercel" | "railway" | "none";
    packageManager: "bun" | "pnpm" | "npm";
    cicd: boolean;
    docker: boolean;
    monorepo: boolean;
}

async function main() {
    console.clear();

    await setTimeout(100);

    p.intro(color.bgCyan(color.black(" create-afc-stack ")));

    const project = await p.group(
        {
            name: () =>
                p.text({
                    message: "Project name",
                    placeholder: "my-app",
                    validate: (value) => {
                        if (!value) return "Please enter a project name";
                        if (!/^[a-z0-9-]+$/.test(value)) return "Only lowercase letters, numbers, and hyphens allowed";
                    }
                }),
            language: () =>
                p.select({
                    message: "Language",
                    options: [
                        { value: "typescript", label: "TypeScript", hint: "recommended" },
                        { value: "javascript", label: "JavaScript" }
                    ],
                    initialValue: "typescript" as const
                }),
            packageManager: () =>
                p.select({
                    message: "Package manager",
                    options: [
                        { value: "bun", label: "Bun", hint: "recommended" },
                        { value: "pnpm", label: "pnpm" },
                        { value: "npm", label: "npm" }
                    ],
                    initialValue: "bun" as const
                }),
            monorepo: () =>
                p.confirm({
                    message: "Use monorepo structure?",
                    initialValue: true
                }),
            database: () =>
                p.select({
                    message: "Database",
                    options: [
                        { value: "postgres", label: "PostgreSQL", hint: "recommended" },
                        { value: "mysql", label: "MySQL" },
                        { value: "sqlite", label: "SQLite" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "postgres" as const
                }),
            orm: ({ results }) =>
                results.database !== "none"
                    ? p.select({
                          message: "ORM",
                          options: [
                              { value: "drizzle", label: "Drizzle ORM", hint: "recommended" },
                              { value: "prisma", label: "Prisma" },
                              { value: "none", label: "None" }
                          ],
                          initialValue: "drizzle" as const
                      })
                    : Promise.resolve("none" as const),
            auth: () =>
                p.select({
                    message: "Authentication",
                    options: [
                        { value: "nextauth", label: "NextAuth v5", hint: "recommended" },
                        { value: "lucia", label: "Lucia" },
                        { value: "clerk", label: "Clerk" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "nextauth" as const
                }),
            styling: () =>
                p.select({
                    message: "UI/Styling",
                    options: [
                        { value: "tailwind", label: "Tailwind CSS", hint: "recommended" },
                        { value: "shadcn", label: "shadcn/ui + Tailwind" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "tailwind" as const
                }),
            realtime: () =>
                p.select({
                    message: "Realtime updates",
                    options: [
                        { value: "none", label: "None (can add later)", hint: "recommended" },
                        { value: "websocket", label: "WebSocket (Fastify service)" },
                        { value: "sse", label: "Server-Sent Events (future)" }
                    ],
                    initialValue: "none" as const
                }),
            storage: () =>
                p.select({
                    message: "File Storage",
                    options: [
                        { value: "minio", label: "MinIO (dev) / S3 (prod)", hint: "recommended" },
                        { value: "uploadthing", label: "UploadThing" },
                        { value: "s3", label: "AWS S3 only" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "minio" as const
                }),
            analytics: () =>
                p.select({
                    message: "Analytics",
                    options: [
                        { value: "posthog", label: "PostHog", hint: "recommended" },
                        { value: "plausible", label: "Plausible" },
                        { value: "umami", label: "Umami" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "posthog" as const
                }),
            ratelimit: () =>
                p.select({
                    message: "Rate Limiting",
                    options: [
                        { value: "arcjet", label: "Arcjet", hint: "recommended" },
                        { value: "upstash", label: "Upstash" },
                        { value: "unkey", label: "Unkey" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "arcjet" as const
                }),
            deployment: () =>
                p.select({
                    message: "Deployment",
                    options: [
                        { value: "coolify", label: "Coolify", hint: "recommended" },
                        { value: "vercel", label: "Vercel" },
                        { value: "railway", label: "Railway" },
                        { value: "none", label: "None" }
                    ],
                    initialValue: "coolify" as const
                }),
            cicd: () =>
                p.confirm({
                    message: "Include CI/CD (GitHub Actions)?",
                    initialValue: true
                }),
            docker: ({ results }) =>
                results.deployment === "coolify" || results.deployment === "railway"
                    ? p.confirm({
                          message: "Include Dockerfiles?",
                          initialValue: true
                      })
                    : Promise.resolve(false)
        },
        {
            onCancel: () => {
                p.cancel("Operation cancelled");
                process.exit(0);
            }
        }
    );

    const config = project as ProjectConfig;

    const s = p.spinner();
    s.start("Creating your project");

    await setTimeout(500);

    try {
        // Check if directory exists
        const projectPath = path.join(process.cwd(), config.name);
        if (fs.existsSync(projectPath)) {
            s.stop("Directory already exists");
            p.cancel(`Directory ${config.name} already exists!`);
            process.exit(1);
        }

        // Create project directory
        fs.mkdirSync(projectPath, { recursive: true });

        s.message("Copying base files");
        // Copy base template
        await copyTemplate(projectPath, config);

        s.message("Generating configuration");
        // Generate config files
        await generateConfigs(projectPath, config);

        s.message("Installing dependencies");
        // Install dependencies
        await installDependencies(projectPath, config);

        s.stop("Project created successfully!");

        const pm = config.packageManager;
        const pmx = pm === "bun" ? "bunx" : pm === "pnpm" ? "pnpx" : "npx";

        p.outro(
            `${color.green("✓")} Project created at ${color.cyan(`./${config.name}`)}\n\n` +
                `${color.bold("Next steps:")}\n` +
                `  ${color.cyan("cd")} ${config.name}\n` +
                (config.database !== "none" || config.storage !== "none"
                    ? `  ${color.cyan(`${pm} run docker:up`)}  ${color.dim("# Start database & services")}\n`
                    : "") +
                (config.database !== "none" && config.orm === "drizzle"
                    ? `  ${color.cyan(`${pmx} drizzle-kit generate && ${pmx} drizzle-kit migrate`)}  ${color.dim("# Setup database")}\n`
                    : config.database !== "none" && config.orm === "prisma"
                      ? `  ${color.cyan(`${pmx} prisma migrate dev`)}  ${color.dim("# Setup database")}\n`
                      : "") +
                `  ${color.cyan(`${pm} run dev`)}  ${color.dim("# Start development server")}\n\n` +
                `${color.bold("View full setup guide:")}\n` +
                `  ${color.cyan(`${pm} run setup`)}`
        );
    } catch (error) {
        s.stop("Failed to create project");
        p.cancel(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

async function copyTemplate(projectPath: string, config: ProjectConfig) {
    const templateBase = path.join(process.cwd(), "cli-templates", "base");

    // Copy base structure based on monorepo choice
    if (config.monorepo) {
        await fs.copy(templateBase, projectPath);
        
        // Add WebSocket service if selected
        if (config.realtime === "websocket") {
            const wsSource = path.join(process.cwd(), "cli-templates", "extras", "websocket", "ws");
            const wsTarget = path.join(projectPath, "apps", "ws");
            await fs.copy(wsSource, wsTarget);
            
            // Replace page.tsx with WebSocket version
            const wsPageSource = path.join(process.cwd(), "cli-templates", "extras", "websocket", "page.tsx");
            const wsPageTarget = path.join(projectPath, "apps", "web", "src", "app", "page.tsx");
            await fs.copy(wsPageSource, wsPageTarget);
            
            // Replace API route with WebSocket version
            const wsRouteSource = path.join(process.cwd(), "cli-templates", "extras", "websocket", "route.ts");
            const wsRouteTarget = path.join(projectPath, "apps", "web", "src", "app", "api", "todos", "route.ts");
            await fs.copy(wsRouteSource, wsRouteTarget);
        }
    } else {
        // Copy single app structure (to be implemented)
        await fs.copy(templateBase, projectPath);
    }
}

async function generateConfigs(projectPath: string, config: ProjectConfig) {
    // Generate package.json
    const pkg = {
        name: config.name,
        version: "0.1.0",
        private: true,
        type: "module" as const,
        scripts: config.monorepo
            ? {
                  dev: "turbo run dev --parallel",
                  build: "turbo run build",
                  lint: "turbo run lint",
                  test: "turbo run test",
                  setup: "cat SETUP.md"
              }
            : {
                  dev: "next dev",
                  build: "next build",
                  start: "next start",
                  lint: "next lint",
                  setup: "cat SETUP.md"
              },
        dependencies: {} as Record<string, string>,
        devDependencies: {} as Record<string, string>
    };

    // Add docker scripts if database or storage is used
    if (config.database !== "none" || config.storage !== "none") {
        pkg.scripts["docker:up"] = "docker compose up -d";
        pkg.scripts["docker:down"] = "docker compose down";
        pkg.scripts["docker:logs"] = "docker compose logs -f";
    }

    if (config.monorepo) {
        pkg.devDependencies.turbo = "latest";
        (pkg as any).workspaces = ["apps/*", "packages/*"];
    }

    // Add dependencies based on config
    pkg.dependencies.next = "^15.0.3";
    pkg.dependencies.react = "^18.3.1";
    pkg.dependencies["react-dom"] = "^18.3.1";

    if (config.language === "typescript") {
        pkg.devDependencies.typescript = "^5.6.3";
        pkg.devDependencies["@types/node"] = "^22.8.6";
        pkg.devDependencies["@types/react"] = "^18.3.11";
        pkg.devDependencies["@types/react-dom"] = "^18.3.1";
    }

    // Write package.json
    await fs.writeJSON(path.join(projectPath, "package.json"), pkg, { spaces: 2 });

    // Generate docker-compose.yml based on selections
    await generateDockerCompose(projectPath, config);

    // Generate .env.example
    let envExample = `# Database\n${config.database !== "none" ? `DATABASE_URL=${getDefaultDatabaseUrl(config.database)}` : ""}

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    if (config.auth === "nextauth") {
        envExample += `\n# NextAuth\nNEXTAUTH_SECRET=change-me-32-chars\nNEXTAUTH_URL=http://localhost:3000\n`;
    }

    if (config.realtime === "websocket") {
        envExample += `\n# WebSocket Realtime\nNEXT_PUBLIC_WS_URL=ws://localhost:4001\nWS_INTERNAL_URL=http://localhost:4001\n`;
    }

    if (config.storage === "minio") {
        envExample += `\n# MinIO Storage\nMINIO_ENDPOINT=localhost\nMINIO_PORT=9000\nMINIO_ACCESS_KEY=minio\nMINIO_SECRET_KEY=minio12345\nMINIO_USE_SSL=false\nMINIO_BUCKET_NAME=uploads\n`;
    } else if (config.storage === "s3") {
        envExample += `\n# AWS S3 Storage\nAWS_REGION=us-east-1\nAWS_ACCESS_KEY_ID=your-access-key\nAWS_SECRET_ACCESS_KEY=your-secret-key\nS3_BUCKET_NAME=your-bucket\n`;
    }

    await fs.writeFile(path.join(projectPath, ".env.example"), envExample.trim());

    // Generate SETUP.md
    await generateSetupInstructions(projectPath, config);
}

async function installDependencies(projectPath: string, config: ProjectConfig) {
    const cmd = config.packageManager === "bun" ? "bun" : config.packageManager;
    await execa(cmd, ["install"], {
        cwd: projectPath,
        stdio: "ignore"
    });
}

function getDefaultDatabaseUrl(db: string): string {
    switch (db) {
        case "postgres":
            return "postgres://app:app@localhost:5432/app";
        case "mysql":
            return "mysql://app:app@localhost:3306/app";
        case "sqlite":
            return "file:./dev.db";
        default:
            return "";
    }
}

async function generateDockerCompose(projectPath: string, config: ProjectConfig) {
    // Only generate if database or storage is needed
    if (config.database === "none" && config.storage === "none") {
        return;
    }

    let compose = `services:\n`;

    // Add database service
    if (config.database === "postgres") {
        compose += `  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    volumes:
      - ./_data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 5

`;
    } else if (config.database === "mysql") {
        compose += `  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: app
      MYSQL_USER: app
      MYSQL_PASSWORD: app
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
    volumes:
      - ./_data/mysql:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5

`;
    }

    // Add MinIO if selected
    if (config.storage === "minio") {
        compose += `  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio12345
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - ./_data/minio:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

`;
    }

    await fs.writeFile(path.join(projectPath, "docker-compose.yml"), compose.trim() + "\n");
}

async function generateSetupInstructions(projectPath: string, config: ProjectConfig) {
    const pm = config.packageManager;
    const pmx = pm === "bun" ? "bunx" : pm === "pnpm" ? "pnpx" : "npx";

    let instructions = `# ${config.name} - Setup Instructions

## Quick Start

### 1. Install Dependencies

\`\`\`bash
${pm} install
\`\`\`

`;

    // Docker setup section
    if (config.database !== "none" || config.storage !== "none") {
        instructions += `### 2. Start Docker Services

Start the local development services (${config.database !== "none" ? config.database : ""}${config.database !== "none" && config.storage === "minio" ? " and " : ""}${config.storage === "minio" ? "MinIO" : ""}):

\`\`\`bash
# Start services in background
${pm} run docker:up

# Or start with logs visible
docker compose up

# Stop services
${pm} run docker:down

# View logs
${pm} run docker:logs
\`\`\`

`;

        // Docker run commands as alternative
        instructions += `#### Alternative: Docker Run Commands

If you prefer not to use Docker Compose, you can run services individually:

`;

        if (config.database === "postgres") {
            instructions += `**PostgreSQL:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-postgres \\
  -e POSTGRES_DB=app \\
  -e POSTGRES_USER=app \\
  -e POSTGRES_PASSWORD=app \\
  -p 5432:5432 \\
  -v ${config.name}_postgres_data:/var/lib/postgresql/data \\
  postgres:16
\`\`\`

`;
        } else if (config.database === "mysql") {
            instructions += `**MySQL:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-mysql \\
  -e MYSQL_DATABASE=app \\
  -e MYSQL_USER=app \\
  -e MYSQL_PASSWORD=app \\
  -e MYSQL_ROOT_PASSWORD=root \\
  -p 3306:3306 \\
  -v ${config.name}_mysql_data:/var/lib/mysql \\
  mysql:8
\`\`\`

`;
        }

        if (config.storage === "minio") {
            instructions += `**MinIO (S3-compatible storage):**
\`\`\`bash
docker run -d \\
  --name ${config.name}-minio \\
  -e MINIO_ROOT_USER=minio \\
  -e MINIO_ROOT_PASSWORD=minio12345 \\
  -p 9000:9000 \\
  -p 9001:9001 \\
  -v ${config.name}_minio_data:/data \\
  minio/minio:latest \\
  server /data --console-address ":9001"
\`\`\`

Access MinIO Console at: http://localhost:9001 (login: minio / minio12345)

`;
        }
    }

    // Database migration section
    if (config.database !== "none" && config.orm !== "none") {
        const stepNum = config.database !== "none" || config.storage !== "none" ? "3" : "2";
        instructions += `### ${stepNum}. Setup Database

`;

        if (config.orm === "drizzle") {
            instructions += `Copy environment file and update if needed:
\`\`\`bash
cp .env.example .env
\`\`\`

Generate and run database migrations:
\`\`\`bash
# Generate migration files
${pmx} drizzle-kit generate

# Apply migrations
${pmx} drizzle-kit migrate

# Optional: Open Drizzle Studio to view database
${pmx} drizzle-kit studio
\`\`\`

`;
        } else if (config.orm === "prisma") {
            instructions += `Copy environment file and update if needed:
\`\`\`bash
cp .env.example .env
\`\`\`

Run database migrations:
\`\`\`bash
${pmx} prisma migrate dev
\`\`\`

`;
        }
    } else {
        instructions += `### ${config.database !== "none" || config.storage !== "none" ? "3" : "2"}. Environment Variables

Copy the example environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and update the values as needed.

`;
    }

    // Development server
    const lastStep = config.database !== "none" || config.storage !== "none" ? "4" : config.database !== "none" && config.orm !== "none" ? "3" : "2";
    instructions += `### ${lastStep}. Start Development Server

\`\`\`bash
${pm} run dev
\`\`\`

`;

    // Access points
    instructions += `## Access Points

- **Web App**: http://localhost:3000
`;

    if (config.realtime === "websocket") {
        instructions += `- **WebSocket Server**: ws://localhost:4001
`;
    }

    if (config.database === "postgres" || config.database === "mysql") {
        instructions += `- **Database**: localhost:${config.database === "postgres" ? "5432" : "3306"}
`;
    }

    if (config.storage === "minio") {
        instructions += `- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000
`;
    }

    instructions += `
## Useful Commands

\`\`\`bash
# View this setup guide anytime
${pm} run setup

# Development
${pm} run dev          # Start dev server
${pm} run build        # Build for production
${pm} run lint         # Run linter
`;

    if (config.database !== "none" || config.storage !== "none") {
        instructions += `
# Docker Services
${pm} run docker:up    # Start services
${pm} run docker:down  # Stop services
${pm} run docker:logs  # View logs
`;
    }

    if (config.orm === "drizzle") {
        instructions += `
# Database (Drizzle)
${pmx} drizzle-kit generate  # Generate migrations
${pmx} drizzle-kit migrate   # Apply migrations
${pmx} drizzle-kit studio    # Open Drizzle Studio
`;
    } else if (config.orm === "prisma") {
        instructions += `
# Database (Prisma)
${pmx} prisma migrate dev    # Create & apply migration
${pmx} prisma studio         # Open Prisma Studio
${pmx} prisma generate       # Generate Prisma Client
`;
    }

    instructions += `\`\`\`

## Project Structure

${config.monorepo ? `This is a monorepo using Turborepo:

- \`apps/web\` - Next.js frontend application
${config.realtime === "websocket" ? "- `apps/ws` - WebSocket server (Fastify + Bun)\n" : ""}- \`packages/db\` - Shared database schema and client
- \`packages/*\` - Other shared packages

` : ""}## Next Steps

1. Start building your app in \`${config.monorepo ? "apps/web/src" : "src"}\`
2. Define database schema in \`${config.monorepo ? "packages/db/src/schema.ts" : "src/db/schema.ts"}\`
3. Add API routes in \`${config.monorepo ? "apps/web/src/app/api" : "src/app/api"}\`
4. Customize configuration as needed

## Troubleshooting

### Docker services not starting?

\`\`\`bash
# Check if ports are already in use
${config.database === "postgres" ? "lsof -i :5432\n" : config.database === "mysql" ? "lsof -i :3306\n" : ""}${config.storage === "minio" ? "lsof -i :9000\nlsof -i :9001\n" : ""}
# Stop and remove containers
docker compose down -v
# Start fresh
docker compose up
\`\`\`

### Database connection issues?

Make sure:
- Docker services are running (\`docker compose ps\`)
- Environment variables in \`.env\` match docker-compose.yml
- Database is ready (check with \`${pm} run docker:logs\`)

### Need help?

Run \`${pm} run setup\` to see this guide again.
`;

    await fs.writeFile(path.join(projectPath, "SETUP.md"), instructions);
}

main().catch(console.error);
