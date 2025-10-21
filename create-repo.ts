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
                        if (!/^[a-z0-9-]+$/.test(value))
                            return "Only lowercase letters, numbers, and hyphens allowed";
                    },
                }),
            language: () =>
                p.select({
                    message: "Language",
                    options: [
                        { value: "typescript", label: "TypeScript", hint: "recommended" },
                        { value: "javascript", label: "JavaScript" },
                    ],
                    initialValue: "typescript" as const,
                }),
            packageManager: () =>
                p.select({
                    message: "Package manager",
                    options: [
                        { value: "bun", label: "Bun", hint: "recommended" },
                        { value: "pnpm", label: "pnpm" },
                        { value: "npm", label: "npm" },
                    ],
                    initialValue: "bun" as const,
                }),
            monorepo: () =>
                p.confirm({
                    message: "Use monorepo structure?",
                    initialValue: true,
                }),
            database: () =>
                p.select({
                    message: "Database",
                    options: [
                        { value: "postgres", label: "PostgreSQL", hint: "recommended" },
                        { value: "mysql", label: "MySQL" },
                        { value: "sqlite", label: "SQLite" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "postgres" as const,
                }),
            orm: ({ results }) =>
                results.database !== "none"
                    ? p.select({
                          message: "ORM",
                          options: [
                              { value: "drizzle", label: "Drizzle ORM", hint: "recommended" },
                              { value: "prisma", label: "Prisma" },
                              { value: "none", label: "None" },
                          ],
                          initialValue: "drizzle" as const,
                      })
                    : Promise.resolve("none" as const),
            auth: () =>
                p.select({
                    message: "Authentication",
                    options: [
                        { value: "nextauth", label: "NextAuth v5", hint: "recommended" },
                        { value: "lucia", label: "Lucia" },
                        { value: "clerk", label: "Clerk" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "nextauth" as const,
                }),
            styling: () =>
                p.select({
                    message: "UI/Styling",
                    options: [
                        { value: "tailwind", label: "Tailwind CSS", hint: "recommended" },
                        { value: "shadcn", label: "shadcn/ui + Tailwind" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "tailwind" as const,
                }),
            realtime: () =>
                p.select({
                    message: "Realtime",
                    options: [
                        { value: "websocket", label: "WebSocket (Fastify)", hint: "recommended" },
                        { value: "sse", label: "Server-Sent Events" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "websocket" as const,
                }),
            storage: () =>
                p.select({
                    message: "File Storage",
                    options: [
                        { value: "minio", label: "MinIO (dev) / S3 (prod)", hint: "recommended" },
                        { value: "uploadthing", label: "UploadThing" },
                        { value: "s3", label: "AWS S3 only" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "minio" as const,
                }),
            analytics: () =>
                p.select({
                    message: "Analytics",
                    options: [
                        { value: "posthog", label: "PostHog", hint: "recommended" },
                        { value: "plausible", label: "Plausible" },
                        { value: "umami", label: "Umami" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "posthog" as const,
                }),
            ratelimit: () =>
                p.select({
                    message: "Rate Limiting",
                    options: [
                        { value: "arcjet", label: "Arcjet", hint: "recommended" },
                        { value: "upstash", label: "Upstash" },
                        { value: "unkey", label: "Unkey" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "arcjet" as const,
                }),
            deployment: () =>
                p.select({
                    message: "Deployment",
                    options: [
                        { value: "coolify", label: "Coolify", hint: "recommended" },
                        { value: "vercel", label: "Vercel" },
                        { value: "railway", label: "Railway" },
                        { value: "none", label: "None" },
                    ],
                    initialValue: "coolify" as const,
                }),
            cicd: () =>
                p.confirm({
                    message: "Include CI/CD (GitHub Actions)?",
                    initialValue: true,
                }),
            docker: ({ results }) =>
                results.deployment === "coolify" || results.deployment === "railway"
                    ? p.confirm({
                          message: "Include Dockerfiles?",
                          initialValue: true,
                      })
                    : Promise.resolve(false),
        },
        {
            onCancel: () => {
                p.cancel("Operation cancelled");
                process.exit(0);
            },
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

        p.outro(
            `${color.green("✓")} Project created at ${color.cyan(`./${config.name}`)}\n\n` +
                `Next steps:\n` +
                `  ${color.cyan("cd")} ${config.name}\n` +
                (config.database !== "none"
                    ? `  ${color.cyan("docker compose up -d")}\n` +
                      (config.orm === "drizzle"
                          ? `  ${color.cyan(`${config.packageManager === "bun" ? "bunx" : "npx"} drizzle-kit generate`)}\n` +
                            `  ${color.cyan(`${config.packageManager === "bun" ? "bunx" : "npx"} drizzle-kit migrate`)}\n`
                          : config.orm === "prisma"
                            ? `  ${color.cyan(`${config.packageManager === "bun" ? "bunx" : "npx"} prisma migrate dev`)}\n`
                            : "")
                    : "") +
                `  ${color.cyan(`${config.packageManager} run dev`)}`
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
              }
            : {
                  dev: "next dev",
                  build: "next build",
                  start: "next start",
                  lint: "next lint",
              },
        dependencies: {} as Record<string, string>,
        devDependencies: {} as Record<string, string>,
    };

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

    // Generate .env.example
    let envExample = `# Database\n${config.database !== "none" ? `DATABASE_URL=${getDefaultDatabaseUrl(config.database)}` : ""}

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    if (config.auth === "nextauth") {
        envExample += `\n# NextAuth\nNEXTAUTH_SECRET=change-me-32-chars\nNEXTAUTH_URL=http://localhost:3000\n`;
    }

    await fs.writeFile(path.join(projectPath, ".env.example"), envExample.trim());
}

async function installDependencies(projectPath: string, config: ProjectConfig) {
    const cmd = config.packageManager === "bun" ? "bun" : config.packageManager;
    await execa(cmd, ["install"], {
        cwd: projectPath,
        stdio: "ignore",
    });
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

main().catch(console.error);
