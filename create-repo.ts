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
    database: "postgres" | "mysql" | "mariadb" | "mongodb" | "mssql" | "sqlite" | "none";
    deployment: "coolify" | "vercel" | "railway" | "none";
    packageManager: "bun" | "pnpm" | "npm";
    cicd: boolean;
    docker: boolean;
    monorepo: boolean;
    hasHostedDb?: boolean;
    databaseUrl?: string;
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
                        { value: "mariadb", label: "MariaDB" },
                        { value: "mongodb", label: "MongoDB" },
                        { value: "mssql", label: "Microsoft SQL Server" },
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
            hasHostedDb: ({ results }) =>
                results.database !== "none" && results.database !== "sqlite"
                    ? p.confirm({
                          message: `Do you have a hosted ${
                              results.database === "postgres"
                                  ? "PostgreSQL"
                                  : results.database === "mysql"
                                    ? "MySQL"
                                    : results.database === "mariadb"
                                      ? "MariaDB"
                                      : results.database === "mongodb"
                                        ? "MongoDB"
                                        : results.database === "mssql"
                                          ? "SQL Server"
                                          : ""
                          } instance?`,
                          initialValue: false
                      })
                    : Promise.resolve(false),
            databaseUrl: async ({ results }) => {
                if (results.hasHostedDb && results.database !== "none" && results.database !== "sqlite") {
                    const dbTypeMap = {
                        postgres: "PostgreSQL",
                        mysql: "MySQL",
                        mariadb: "MariaDB",
                        mongodb: "MongoDB",
                        mssql: "SQL Server"
                    };
                    const dbType = dbTypeMap[results.database as keyof typeof dbTypeMap];

                    // Show popular providers
                    const providersByDb = {
                        postgres: ["Supabase", "Neon", "Railway", "Render", "Vercel Postgres", "AWS RDS", "Other"],
                        mysql: ["PlanetScale", "Railway", "Render", "AWS RDS", "Other"],
                        mariadb: ["Railway", "Render", "AWS RDS", "DigitalOcean", "Other"],
                        mongodb: ["MongoDB Atlas", "Railway", "Render", "DigitalOcean", "Other"],
                        mssql: ["Azure SQL", "AWS RDS", "Railway", "Other"]
                    };

                    const providers = providersByDb[results.database as keyof typeof providersByDb];

                    const providerChoice = await p.select({
                        message: `Which ${dbType} provider are you using?`,
                        options: providers.map((p) => ({ value: p.toLowerCase().replace(/ /g, "-"), label: p }))
                    });

                    if (providerChoice === Symbol.for("clack:cancel")) {
                        p.cancel("Operation cancelled");
                        process.exit(0);
                    }

                    const examplesByDb: Record<string, Record<string, string>> = {
                        postgres: {
                            supabase: "postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres",
                            neon: "postgres://[user]:[password]@[endpoint].neon.tech/[dbname]",
                            railway: "postgres://postgres:[password]@[region].railway.app:5432/railway",
                            render: "postgres://[user]:[password]@[hostname].render.com/[dbname]",
                            "vercel-postgres":
                                "postgres://[user]:[password]@[endpoint].postgres.vercel-storage.com/[dbname]",
                            "aws-rds": "postgres://[user]:[password]@[endpoint].rds.amazonaws.com:5432/[dbname]",
                            other: "postgres://user:password@host:5432/dbname"
                        },
                        mysql: {
                            planetscale: "mysql://[username]:[password]@[host].psdb.cloud/[database]?sslaccept=strict",
                            railway: "mysql://mysql:[password]@[region].railway.app:3306/railway",
                            render: "mysql://[user]:[password]@[hostname].render.com/[dbname]",
                            "aws-rds": "mysql://[user]:[password]@[endpoint].rds.amazonaws.com:3306/[dbname]",
                            other: "mysql://user:password@host:3306/dbname"
                        },
                        mariadb: {
                            railway: "mysql://mysql:[password]@[region].railway.app:3306/railway",
                            render: "mysql://[user]:[password]@[hostname].render.com/[dbname]",
                            "aws-rds": "mysql://[user]:[password]@[endpoint].rds.amazonaws.com:3306/[dbname]",
                            digitalocean:
                                "mysql://[user]:[password]@[host].db.ondigitalocean.com:25060/[dbname]?ssl-mode=REQUIRED",
                            other: "mysql://user:password@host:3306/dbname"
                        },
                        mongodb: {
                            "mongodb-atlas":
                                "mongodb+srv://[username]:[password]@[cluster].mongodb.net/[dbname]?retryWrites=true&w=majority",
                            railway: "mongodb://mongo:[password]@[region].railway.app:27017",
                            render: "mongodb://[user]:[password]@[hostname].render.com/[dbname]",
                            digitalocean:
                                "mongodb://[user]:[password]@[host].db.ondigitalocean.com:27017/[dbname]?tls=true",
                            other: "mongodb://user:password@host:27017/dbname"
                        },
                        mssql: {
                            "azure-sql":
                                "Server=[server].database.windows.net,1433;Database=[dbname];User Id=[user];Password=[password];Encrypt=true",
                            "aws-rds":
                                "Server=[endpoint].rds.amazonaws.com,1433;Database=[dbname];User Id=[user];Password=[password]",
                            railway:
                                "Server=[region].railway.app,1433;Database=railway;User Id=sqlserver;Password=[password]",
                            other: "Server=host,1433;Database=dbname;User Id=user;Password=password"
                        }
                    };

                    const examples = examplesByDb[results.database as keyof typeof examplesByDb];
                    const example = examples[providerChoice as string];

                    const prefixMap = {
                        postgres: "postgres",
                        mysql: "mysql",
                        mariadb: "mysql",
                        mongodb: "mongodb",
                        mssql: "Server="
                    };

                    return p.text({
                        message: `Enter your ${dbType} connection string`,
                        placeholder: example,
                        validate: (value) => {
                            if (!value) return "Connection string is required";
                            const prefix = prefixMap[results.database as keyof typeof prefixMap];
                            if (!value.startsWith(prefix)) {
                                return `Connection string must start with ${prefix}`;
                            }
                        }
                    });
                }
                return Promise.resolve(undefined);
            },
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
                (config.hasHostedDb
                    ? `  ${color.cyan("cp .env.example .env")}  ${color.dim("# Database URL already configured")}\n`
                    : (config.database !== "none" && config.database !== "sqlite") || config.storage !== "none"
                      ? `  ${color.cyan(`${pm} run docker:up`)}  ${color.dim("# Start local database & services")}\n`
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
        packageManager:
            config.packageManager === "bun"
                ? "bun@1.3.0"
                : config.packageManager === "pnpm"
                  ? "pnpm@9.14.4"
                  : "npm@10.9.2",
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

    // Add docker scripts if database or storage is used AND database is not hosted
    if (
        ((config.database !== "none" && !config.hasHostedDb) || config.storage !== "none") &&
        config.database !== "sqlite"
    ) {
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
    let envExample = `# Database\n${config.database !== "none" ? `DATABASE_URL=${config.databaseUrl || getDefaultDatabaseUrl(config.database, config.name)}` : ""}

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

    // Also create .env file for local development
    await fs.writeFile(path.join(projectPath, ".env"), envExample.trim());

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

function getDefaultDatabaseUrl(db: string, projectName: string): string {
    switch (db) {
        case "postgres":
            return `postgres://app:app@localhost:5432/${projectName}`;
        case "mysql":
            return `mysql://app:app@localhost:3306/${projectName}`;
        case "mariadb":
            return `mysql://app:app@localhost:3306/${projectName}`;
        case "mongodb":
            return `mongodb://app:app@localhost:27017/${projectName}`;
        case "mssql":
            return `Server=localhost,1433;Database=${projectName};User Id=sa;Password=YourStrong@Passw0rd`;
        case "sqlite":
            return "file:./dev.db";
        default:
            return "";
    }
}

async function generateDockerCompose(projectPath: string, config: ProjectConfig) {
    // Only generate if database or storage is needed AND database is not hosted
    if ((config.database === "none" || config.hasHostedDb) && config.storage === "none") {
        return;
    }

    let compose = `services:\n`;

    // Add database service only if not hosted
    if (config.database === "postgres" && !config.hasHostedDb) {
        compose += `  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${config.name}
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
    } else if (config.database === "mysql" && !config.hasHostedDb) {
        compose += `  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${config.name}
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
    } else if (config.database === "mariadb" && !config.hasHostedDb) {
        compose += `  mariadb:
    image: mariadb:11
    environment:
      MARIADB_DATABASE: ${config.name}
      MARIADB_USER: app
      MARIADB_PASSWORD: app
      MARIADB_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
    volumes:
      - ./_data/mariadb:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 5

`;
    } else if (config.database === "mongodb" && !config.hasHostedDb) {
        compose += `  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_DATABASE: ${config.name}
      MONGO_INITDB_ROOT_USERNAME: app
      MONGO_INITDB_ROOT_PASSWORD: app
    ports:
      - "27017:27017"
    volumes:
      - ./_data/mongodb:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5

`;
    } else if (config.database === "mssql" && !config.hasHostedDb) {
        compose += `  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "YourStrong@Passw0rd"
      MSSQL_PID: "Developer"
    ports:
      - "1433:1433"
    volumes:
      - ./_data/mssql:/var/opt/mssql
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "YourStrong@Passw0rd", "-Q", "SELECT 1"]
      interval: 10s
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

    // Only write file if there's content (not just "services:\n")
    if (compose.trim() !== "services:") {
        await fs.writeFile(path.join(projectPath, "docker-compose.yml"), compose.trim() + "\n");
    }
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

    // Docker setup section or hosted DB section
    let stepNumber = 2;
    if (config.hasHostedDb && config.database !== "none") {
        instructions += `### 2. Database Configuration (Hosted)

You've configured a hosted ${config.database === "postgres" ? "PostgreSQL" : "MySQL"} database.

Your \`.env.example\` already contains your database connection string.

\`\`\`bash
# Copy environment file
cp .env.example .env
\`\`\`

**Important:** Your database credentials are in the \`.env\` file. Make sure this file is in \`.gitignore\` (it already is by default).

`;
        stepNumber = 3;
    } else if ((config.database !== "none" && config.database !== "sqlite") || config.storage !== "none") {
        const services = [];
        if (config.database !== "none" && config.database !== "sqlite") {
            services.push(config.database);
        }
        if (config.storage === "minio") {
            services.push("MinIO");
        }
        const servicesText = services.join(" and ");

        instructions += `### 2. Start Docker Services

Start the local development services (${servicesText}):

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

        if (config.database === "postgres" && !config.hasHostedDb) {
            instructions += `**PostgreSQL:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-postgres \\
  -e POSTGRES_DB=${config.name} \\
  -e POSTGRES_USER=app \\
  -e POSTGRES_PASSWORD=app \\
  -p 5432:5432 \\
  -v ${config.name}_postgres_data:/var/lib/postgresql/data \\
  postgres:16
\`\`\`

`;
        } else if (config.database === "mysql" && !config.hasHostedDb) {
            instructions += `**MySQL:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-mysql \\
  -e MYSQL_DATABASE=${config.name} \\
  -e MYSQL_USER=app \\
  -e MYSQL_PASSWORD=app \\
  -e MYSQL_ROOT_PASSWORD=root \\
  -p 3306:3306 \\
  -v ${config.name}_mysql_data:/var/lib/mysql \\
  mysql:8
\`\`\`

`;
        } else if (config.database === "mariadb" && !config.hasHostedDb) {
            instructions += `**MariaDB:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-mariadb \\
  -e MARIADB_DATABASE=${config.name} \\
  -e MARIADB_USER=app \\
  -e MARIADB_PASSWORD=app \\
  -e MARIADB_ROOT_PASSWORD=root \\
  -p 3306:3306 \\
  -v ${config.name}_mariadb_data:/var/lib/mysql \\
  mariadb:11
\`\`\`

`;
        } else if (config.database === "mongodb" && !config.hasHostedDb) {
            instructions += `**MongoDB:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-mongodb \\
  -e MONGO_INITDB_DATABASE=${config.name} \\
  -e MONGO_INITDB_ROOT_USERNAME=app \\
  -e MONGO_INITDB_ROOT_PASSWORD=app \\
  -p 27017:27017 \\
  -v ${config.name}_mongodb_data:/data/db \\
  mongo:7
\`\`\`

`;
        } else if (config.database === "mssql" && !config.hasHostedDb) {
            instructions += `**Microsoft SQL Server:**
\`\`\`bash
docker run -d \\
  --name ${config.name}-mssql \\
  -e ACCEPT_EULA=Y \\
  -e MSSQL_SA_PASSWORD=YourStrong@Passw0rd \\
  -e MSSQL_PID=Developer \\
  -p 1433:1433 \\
  -v ${config.name}_mssql_data:/var/opt/mssql \\
  mcr.microsoft.com/mssql/server:2022-latest
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
        stepNumber = 3;
    }

    // Database migration section
    if (config.database !== "none" && config.orm !== "none") {
        instructions += `### ${stepNumber}. Setup Database

`;

        if (config.orm === "drizzle") {
            if (!config.hasHostedDb) {
                instructions += `Copy environment file and update if needed:
\`\`\`bash
cp .env.example .env
\`\`\`

`;
            }
            instructions += `Generate and run database migrations:
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
            if (!config.hasHostedDb) {
                instructions += `Copy environment file and update if needed:
\`\`\`bash
cp .env.example .env
\`\`\`

`;
            }
            instructions += `Run database migrations:
\`\`\`bash
${pmx} prisma migrate dev
\`\`\`

`;
        }
        stepNumber++;
    } else if (!config.hasHostedDb) {
        instructions += `### ${stepNumber}. Environment Variables

Copy the example environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and update the values as needed.

`;
        stepNumber++;
    }

    // Development server
    instructions += `### ${stepNumber}. Start Development Server

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

    if (!config.hasHostedDb) {
        const portMap = {
            postgres: "5432",
            mysql: "3306",
            mariadb: "3306",
            mongodb: "27017",
            mssql: "1433"
        };
        const port = portMap[config.database as keyof typeof portMap];
        if (port) {
            instructions += `- **Database**: localhost:${port}
`;
        }
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

    if (
        ((config.database !== "none" && !config.hasHostedDb) || config.storage !== "none") &&
        config.database !== "sqlite"
    ) {
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

${
    config.monorepo
        ? `This is a monorepo using Turborepo:

- \`apps/web\` - Next.js frontend application
${config.realtime === "websocket" ? "- `apps/ws` - WebSocket server (Fastify + Bun)\n" : ""}- \`packages/db\` - Shared database schema and client
- \`packages/*\` - Other shared packages

`
        : ""
}## Next Steps

1. Start building your app in \`${config.monorepo ? "apps/web/src" : "src"}\`
2. Define database schema in \`${config.monorepo ? "packages/db/src/schema.ts" : "src/db/schema.ts"}\`
3. Add API routes in \`${config.monorepo ? "apps/web/src/app/api" : "src/app/api"}\`
4. Customize configuration as needed

## Troubleshooting
${
    !config.hasHostedDb && ((config.database !== "none" && config.database !== "sqlite") || config.storage !== "none")
        ? `
### Docker services not starting?

\`\`\`bash
# Check if ports are already in use
${
    config.database === "postgres"
        ? "lsof -i :5432\n"
        : config.database === "mysql"
          ? "lsof -i :3306\n"
          : config.database === "mariadb"
            ? "lsof -i :3306\n"
            : config.database === "mongodb"
              ? "lsof -i :27017\n"
              : config.database === "mssql"
                ? "lsof -i :1433\n"
                : ""
}${config.storage === "minio" ? "lsof -i :9000\nlsof -i :9001\n" : ""}# Stop and remove containers
docker compose down -v
# Start fresh
docker compose up
\`\`\`

### Database connection issues?

Make sure:
- Docker services are running (\`docker compose ps\`)
- Environment variables in \`.env\` match docker-compose.yml
- Database is ready (check with \`${pm} run docker:logs\`)
`
        : config.hasHostedDb
          ? `
### Database connection issues?

Make sure:
- Your hosted database is accessible from your development machine
- The connection string in \`.env\` is correct
- Your database firewall allows connections from your IP
- The database credentials are valid
`
          : ""
}
### Need help?

Run \`${pm} run setup\` to see this guide again.
`;

    await fs.writeFile(path.join(projectPath, "SETUP.md"), instructions);
}

main().catch(console.error);
