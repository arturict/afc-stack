#!/usr/bin/env bun
import { createInterface } from "readline";
import { mkdirSync, writeFileSync, cpSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// ANSI Colors
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    bold: "\x1b[1m"
};

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
    });
}

function log(msg: string, color = "cyan") {
    console.log(`${colors[color as keyof typeof colors]}${msg}${colors.reset}`);
}

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

async function selectOption(
    question: string,
    options: string[],
    defaultOption?: string
): Promise<string> {
    const optionsList = options.map((opt, i) => `  ${i + 1}. ${opt}`).join("\n");
    const defaultText = defaultOption ? ` (default: ${defaultOption})` : "";
    
    log(`\n${question}${defaultText}`, "bold");
    console.log(optionsList);
    
    const answer = await ask("\nYour choice:");
    
    if (!answer && defaultOption) return defaultOption;
    
    const num = parseInt(answer);
    if (num >= 1 && num <= options.length) {
        return options[num - 1];
    }
    
    const found = options.find((opt) => opt.toLowerCase() === answer.toLowerCase());
    return found || defaultOption || options[0];
}

async function confirmOption(question: string, defaultValue = true): Promise<boolean> {
    const defaultText = defaultValue ? "[Y/n]" : "[y/N]";
    const answer = await ask(`${question} ${defaultText}:`);
    
    if (!answer) return defaultValue;
    return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
}

async function gatherConfig(): Promise<ProjectConfig> {
    log("\n🚀 Welcome to the Stack Generator!\n", "green");
    log("Let's create your perfect full-stack setup.\n", "yellow");
    
    const name = await ask("Project name:");
    if (!name) {
        log("❌ Project name is required!", "yellow");
        process.exit(1);
    }
    
    const language = (await selectOption(
        "Choose language",
        ["typescript", "javascript"],
        "typescript"
    )) as "typescript" | "javascript";
    
    const packageManager = (await selectOption(
        "Package manager",
        ["bun", "pnpm", "npm"],
        "bun"
    )) as "bun" | "pnpm" | "npm";
    
    const monorepo = await confirmOption("Use monorepo structure?", true);
    
    const database = (await selectOption(
        "Database",
        ["postgres", "mysql", "sqlite", "none"],
        "postgres"
    )) as ProjectConfig["database"];
    
    let orm: ProjectConfig["orm"] = "none";
    if (database !== "none") {
        orm = (await selectOption(
            "ORM/Query Builder",
            ["drizzle", "prisma", "none"],
            "drizzle"
        )) as ProjectConfig["orm"];
    }
    
    const auth = (await selectOption(
        "Authentication",
        ["nextauth", "lucia", "clerk", "none"],
        "nextauth"
    )) as ProjectConfig["auth"];
    
    const styling = (await selectOption(
        "UI/Styling",
        ["tailwind", "shadcn", "none"],
        "tailwind"
    )) as ProjectConfig["styling"];
    
    const realtime = (await selectOption(
        "Realtime features",
        ["websocket", "sse", "none"],
        "websocket"
    )) as ProjectConfig["realtime"];
    
    const storage = (await selectOption(
        "File storage",
        ["minio", "uploadthing", "s3", "none"],
        "minio"
    )) as ProjectConfig["storage"];
    
    const analytics = (await selectOption(
        "Analytics",
        ["posthog", "plausible", "umami", "none"],
        "posthog"
    )) as ProjectConfig["analytics"];
    
    const ratelimit = (await selectOption(
        "Rate limiting",
        ["arcjet", "upstash", "unkey", "none"],
        "arcjet"
    )) as ProjectConfig["ratelimit"];
    
    const deployment = (await selectOption(
        "Deployment target",
        ["coolify", "vercel", "railway", "none"],
        "coolify"
    )) as ProjectConfig["deployment"];
    
    const cicd = await confirmOption("Include CI/CD (GitHub Actions)?", true);
    const docker = deployment === "coolify" || deployment === "railway" 
        ? await confirmOption("Include Dockerfiles?", true)
        : false;
    
    return {
        name,
        language,
        orm,
        auth,
        realtime,
        storage,
        analytics,
        ratelimit,
        styling,
        database,
        deployment,
        packageManager,
        cicd,
        docker,
        monorepo
    };
}

function generateProject(config: ProjectConfig) {
    log(`\n📦 Creating project: ${config.name}`, "green");
    
    const projectPath = join(process.cwd(), config.name);
    
    if (existsSync(projectPath)) {
        log(`❌ Directory ${config.name} already exists!`, "yellow");
        process.exit(1);
    }
    
    mkdirSync(projectPath, { recursive: true });
    process.chdir(projectPath);
    
    log("✓ Created project directory", "green");
    
    // Generate structure
    if (config.monorepo) {
        generateMonorepo(config);
    } else {
        generateSingleApp(config);
    }
    
    // Generate config files
    generateConfigFiles(config);
    
    // Generate package.json
    generatePackageJson(config);
    
    // Generate database setup
    if (config.database !== "none") {
        generateDatabaseSetup(config);
    }
    
    // Generate auth setup
    if (config.auth !== "none") {
        generateAuthSetup(config);
    }
    
    // Generate CI/CD
    if (config.cicd) {
        generateCICD(config);
    }
    
    // Generate Docker
    if (config.docker) {
        generateDocker(config);
    }
    
    // Generate README
    generateReadme(config);
    
    log("\n✅ Project created successfully!", "green");
    log(`\nNext steps:`, "cyan");
    log(`  cd ${config.name}`, "yellow");
    log(`  ${config.packageManager} install`, "yellow");
    
    if (config.database !== "none") {
        log(`  docker compose up -d`, "yellow");
        if (config.orm === "drizzle") {
            log(`  ${config.packageManager === "bun" ? "bunx" : "npx"} drizzle-kit generate`, "yellow");
            log(`  ${config.packageManager === "bun" ? "bunx" : "npx"} drizzle-kit migrate`, "yellow");
        } else if (config.orm === "prisma") {
            log(`  ${config.packageManager === "bun" ? "bunx" : "npx"} prisma migrate dev`, "yellow");
        }
    }
    
    log(`  ${config.packageManager} run dev`, "yellow");
    log("", "reset");
}

function generateMonorepo(config: ProjectConfig) {
    const dirs = [
        "apps/web",
        "apps/web/src/app",
        "apps/web/src/app/api",
        "apps/web/public",
        "packages",
    ];
    
    if (config.database !== "none") {
        dirs.push("packages/db/src");
    }
    
    if (config.realtime === "websocket") {
        dirs.push("apps/ws/src");
    }
    
    dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));
    log("✓ Created monorepo structure", "green");
}

function generateSingleApp(config: ProjectConfig) {
    const dirs = [
        "src/app",
        "src/app/api",
        "public",
    ];
    
    if (config.database !== "none") {
        dirs.push("src/db");
    }
    
    dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));
    log("✓ Created app structure", "green");
}

function generatePackageJson(config: ProjectConfig) {
    const pkg = {
        name: config.name,
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {} as Record<string, string>,
        dependencies: {} as Record<string, string>,
        devDependencies: {} as Record<string, string>,
    };
    
    if (config.monorepo) {
        pkg.scripts = {
            dev: "turbo run dev --parallel",
            build: "turbo run build",
            lint: "turbo run lint",
            test: "turbo run test",
        };
        pkg.devDependencies.turbo = "latest";
        (pkg as any).workspaces = ["apps/*", "packages/*"];
    } else {
        pkg.scripts = {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
        };
    }
    
    // Core dependencies
    pkg.dependencies.next = "^15.0.3";
    pkg.dependencies.react = "^18.3.1";
    pkg.dependencies["react-dom"] = "^18.3.1";
    
    if (config.language === "typescript") {
        pkg.devDependencies.typescript = "^5.6.3";
        pkg.devDependencies["@types/node"] = "^22.8.6";
        pkg.devDependencies["@types/react"] = "^18.3.11";
        pkg.devDependencies["@types/react-dom"] = "^18.3.1";
    }
    
    // Styling
    if (config.styling === "tailwind" || config.styling === "shadcn") {
        pkg.devDependencies.tailwindcss = "^3.4.14";
        pkg.devDependencies.postcss = "^8.4.47";
        pkg.devDependencies.autoprefixer = "^10.4.20";
    }
    
    // ORM
    if (config.orm === "drizzle") {
        pkg.dependencies["drizzle-orm"] = "^0.36.0";
        pkg.devDependencies["drizzle-kit"] = "^0.24.0";
        
        if (config.database === "postgres") {
            pkg.dependencies.pg = "^8.12.0";
            pkg.devDependencies["@types/pg"] = "^8.11.0";
        } else if (config.database === "mysql") {
            pkg.dependencies.mysql2 = "^3.11.0";
        }
    } else if (config.orm === "prisma") {
        pkg.dependencies["@prisma/client"] = "^5.22.0";
        pkg.devDependencies.prisma = "^5.22.0";
    }
    
    // Auth
    if (config.auth === "nextauth") {
        pkg.dependencies["next-auth"] = "5.0.0-beta.25";
        pkg.dependencies["@auth/core"] = "^0.37.2";
        if (config.orm === "drizzle") {
            pkg.dependencies["@auth/drizzle-adapter"] = "^1.7.2";
        } else if (config.orm === "prisma") {
            pkg.dependencies["@auth/prisma-adapter"] = "^2.7.2";
        }
    } else if (config.auth === "lucia") {
        pkg.dependencies.lucia = "^3.2.1";
    } else if (config.auth === "clerk") {
        pkg.dependencies["@clerk/nextjs"] = "^5.7.1";
    }
    
    // Analytics
    if (config.analytics === "posthog") {
        pkg.dependencies["posthog-js"] = "^1.173.1";
    }
    
    // Rate limiting
    if (config.ratelimit === "arcjet") {
        pkg.dependencies["@arcjet/next"] = "^1.0.0-alpha.25";
    } else if (config.ratelimit === "upstash") {
        pkg.dependencies["@upstash/ratelimit"] = "^2.0.3";
        pkg.dependencies["@upstash/redis"] = "^1.34.3";
    } else if (config.ratelimit === "unkey") {
        pkg.dependencies["@unkey/api"] = "^0.28.1";
    }
    
    // Storage
    if (config.storage === "minio" || config.storage === "s3") {
        pkg.dependencies["@aws-sdk/client-s3"] = "^3.679.0";
    } else if (config.storage === "uploadthing") {
        pkg.dependencies.uploadthing = "^7.2.0";
        pkg.dependencies["@uploadthing/react"] = "^7.2.0";
    }
    
    // Realtime
    if (config.realtime === "websocket" && config.monorepo) {
        // WebSocket service dependencies in separate package
    }
    
    pkg.dependencies.zod = "^3.23.8";
    pkg.dependencies.dotenv = "^16.4.5";
    
    pkg.devDependencies.eslint = "^8.57.1";
    pkg.devDependencies["eslint-config-next"] = "^15.0.3";
    
    const pkgPath = config.monorepo ? "package.json" : "package.json";
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
    log("✓ Generated package.json", "green");
}

function generateConfigFiles(config: ProjectConfig) {
    // .gitignore
    const gitignore = `
node_modules/
.next/
out/
build/
dist/
.env
.env*.local
.turbo
*.log
.DS_Store
_data/
`.trim();
    writeFileSync(".gitignore", gitignore);
    
    // .env.example
    let envExample = `
# Database
${config.database !== "none" ? `DATABASE_URL=${getDefaultDatabaseUrl(config.database)}` : ""}

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`.trim();
    
    if (config.auth === "nextauth") {
        envExample += `\n\n# NextAuth\nNEXTAUTH_SECRET=your-secret-here\nNEXTAUTH_URL=http://localhost:3000`;
    }
    
    writeFileSync(".env.example", envExample);
    
    // tsconfig.json or jsconfig.json
    if (config.language === "typescript") {
        const tsconfig = {
            compilerOptions: {
                target: "ES2022",
                lib: ["dom", "dom.iterable", "esnext"],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                noEmit: true,
                esModuleInterop: true,
                module: "esnext",
                moduleResolution: "bundler",
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: "preserve",
                incremental: true,
                plugins: [{ name: "next" }],
                paths: {
                    "@/*": ["./src/*"],
                },
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
            exclude: ["node_modules"],
        };
        writeFileSync(
            config.monorepo ? "apps/web/tsconfig.json" : "tsconfig.json",
            JSON.stringify(tsconfig, null, 4)
        );
    }
    
    // Tailwind config
    if (config.styling === "tailwind" || config.styling === "shadcn") {
        const tailwindConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`.trim();
        writeFileSync(
            config.monorepo ? "apps/web/tailwind.config.js" : "tailwind.config.js",
            tailwindConfig
        );
        
        const postcssConfig = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`.trim();
        writeFileSync(
            config.monorepo ? "apps/web/postcss.config.js" : "postcss.config.js",
            postcssConfig
        );
    }
    
    log("✓ Generated config files", "green");
}

function generateDatabaseSetup(config: ProjectConfig) {
    if (config.database === "none") return;
    
    // docker-compose.yml
    let composeContent = "";
    
    if (config.database === "postgres") {
        composeContent = `
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${config.name}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - ./_data/postgres:/var/lib/postgresql/data
`.trim();
    } else if (config.database === "mysql") {
        composeContent = `
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: ${config.name}
      MYSQL_ROOT_PASSWORD: mysql
    ports:
      - "3306:3306"
    volumes:
      - ./_data/mysql:/var/lib/mysql
`.trim();
    }
    
    if (config.storage === "minio") {
        composeContent += `\n\n  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio12345
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - ./_data/minio:/data`;
    }
    
    if (composeContent) {
        writeFileSync("docker-compose.yml", composeContent);
    }
    
    // ORM setup
    if (config.orm === "drizzle") {
        const schemaDir = config.monorepo ? "packages/db/src" : "src/db";
        const schemaPath = join(schemaDir, "schema.ts");
        
        const schema = `
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
`.trim();
        
        writeFileSync(schemaPath, schema);
        
        const drizzleConfig = `
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./${schemaDir}/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! }
});
`.trim();
        
        writeFileSync("drizzle.config.ts", drizzleConfig);
    } else if (config.orm === "prisma") {
        mkdirSync("prisma", { recursive: true });
        const schema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${config.database}"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
`.trim();
        
        writeFileSync("prisma/schema.prisma", schema);
    }
    
    log("✓ Generated database setup", "green");
}

function generateAuthSetup(config: ProjectConfig) {
    if (config.auth === "none") return;
    
    const apiDir = config.monorepo ? "apps/web/src/app/api" : "src/app/api";
    
    if (config.auth === "nextauth") {
        mkdirSync(join(apiDir, "auth/[...nextauth]"), { recursive: true });
        const routePath = join(apiDir, "auth/[...nextauth]/route.ts");
        
        const authRoute = `
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

const auth = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
});

export const GET = auth.handlers.GET;
export const POST = auth.handlers.POST;
`.trim();
        
        writeFileSync(routePath, authRoute);
    }
    
    log("✓ Generated auth setup", "green");
}

function generateCICD(config: ProjectConfig) {
    mkdirSync(".github/workflows", { recursive: true });
    
    const ciYml = `
name: CI

on:
  pull_request:
  push:
    branches: ["main"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${config.packageManager === "bun" ? "oven-sh/setup-bun@v1" : "actions/setup-node@v4"}
        ${config.packageManager === "bun" ? "with:\n          bun-version: 1.1.31" : ""}
      - run: ${config.packageManager} install
      - run: ${config.packageManager} run lint
      ${config.language === "typescript" ? `- run: ${config.packageManager === "bun" ? "bunx" : "npx"} tsc --noEmit` : ""}
      - run: ${config.packageManager} run build
`.trim();
    
    writeFileSync(".github/workflows/ci.yml", ciYml);
    log("✓ Generated CI/CD workflows", "green");
}

function generateDocker(config: ProjectConfig) {
    if (!config.docker) return;
    
    const dockerfile = `
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
`.trim();
    
    const dockerfilePath = config.monorepo ? "apps/web/Dockerfile" : "Dockerfile";
    writeFileSync(dockerfilePath, dockerfile);
    
    log("✓ Generated Dockerfile", "green");
}

function generateReadme(config: ProjectConfig) {
    const readme = `
# ${config.name}

${config.language === "typescript" ? "TypeScript" : "JavaScript"} full-stack application built with:

- **Framework**: Next.js 15
${config.database !== "none" ? `- **Database**: ${config.database}` : ""}
${config.orm !== "none" ? `- **ORM**: ${config.orm}` : ""}
${config.auth !== "none" ? `- **Auth**: ${config.auth}` : ""}
${config.styling !== "none" ? `- **Styling**: ${config.styling}` : ""}
${config.realtime !== "none" ? `- **Realtime**: ${config.realtime}` : ""}
${config.storage !== "none" ? `- **Storage**: ${config.storage}` : ""}
${config.analytics !== "none" ? `- **Analytics**: ${config.analytics}` : ""}
${config.ratelimit !== "none" ? `- **Rate Limiting**: ${config.ratelimit}` : ""}
- **Package Manager**: ${config.packageManager}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   ${config.packageManager} install
   \`\`\`

${config.database !== "none" ? `2. Start database:
   \`\`\`bash
   docker compose up -d
   \`\`\`

3. Run migrations:
   \`\`\`bash
   ${config.orm === "drizzle" ? `${config.packageManager === "bun" ? "bunx" : "npx"} drizzle-kit migrate` : `${config.packageManager === "bun" ? "bunx" : "npx"} prisma migrate dev`}
   \`\`\`

4. Start dev server:` : "2. Start dev server:"}
   \`\`\`bash
   ${config.packageManager} run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

${config.monorepo ? `
\`\`\`
apps/
  web/          # Next.js application
packages/
  db/           # Database schema and client
\`\`\`
` : `
\`\`\`
src/
  app/          # Next.js app directory
  db/           # Database schema
\`\`\`
`}

## Environment Variables

Copy \`.env.example\` to \`.env\` and fill in the values.

## Deployment

${config.deployment === "coolify" ? "Deploy to Coolify using the included Dockerfile." : config.deployment === "vercel" ? "Deploy to Vercel with one click." : config.deployment === "railway" ? "Deploy to Railway using the included Dockerfile." : "Configure your deployment platform."}

## License

MIT
`.trim();
    
    writeFileSync("README.md", readme);
    log("✓ Generated README", "green");
}

function getDefaultDatabaseUrl(db: string): string {
    switch (db) {
        case "postgres":
            return "postgres://postgres:postgres@localhost:5432/dbname";
        case "mysql":
            return "mysql://root:mysql@localhost:3306/dbname";
        case "sqlite":
            return "file:./dev.db";
        default:
            return "";
    }
}

// Main execution
async function main() {
    try {
        const config = await gatherConfig();
        
        log("\n📋 Configuration Summary:", "cyan");
        Object.entries(config).forEach(([key, value]) => {
            console.log(`  ${key}: ${colors.yellow}${value}${colors.reset}`);
        });
        
        const confirm = await confirmOption("\nProceed with this configuration?", true);
        
        if (!confirm) {
            log("\n❌ Cancelled", "yellow");
            process.exit(0);
        }
        
        generateProject(config);
    } catch (error) {
        log(`\n❌ Error: ${error}`, "yellow");
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
