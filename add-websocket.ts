#!/usr/bin/env node
import * as p from "@clack/prompts";
import color from "picocolors";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.clear();
    
    p.intro(color.bgCyan(color.black(" Add WebSocket to AFC Stack ")));
    
    const confirm = await p.confirm({
        message: "This will add WebSocket service to your project. Continue?",
        initialValue: true
    });
    
    if (!confirm || p.isCancel(confirm)) {
        p.cancel("Operation cancelled");
        process.exit(0);
    }
    
    const s = p.spinner();
    s.start("Adding WebSocket service");
    
    try {
        const projectRoot = process.cwd();
        
        // Check if we're in an AFC Stack project
        if (!fs.existsSync(path.join(projectRoot, "apps", "web"))) {
            s.stop("Not in AFC Stack project");
            p.cancel("This doesn't appear to be an AFC Stack project. Make sure you're in the project root.");
            process.exit(1);
        }
        
        // Check if WS already exists
        if (fs.existsSync(path.join(projectRoot, "apps", "ws"))) {
            s.stop("WebSocket already exists");
            p.cancel("WebSocket service already exists at apps/ws");
            process.exit(1);
        }
        
        s.message("Copying WebSocket service");
        
        // Find the template directory (might be in node_modules or parent)
        let templatePath: string | null = null;
        const possiblePaths = [
            path.join(__dirname, "..", "cli-templates", "extras", "websocket"),
            path.join(projectRoot, "cli-templates", "extras", "websocket"),
            path.join(__dirname, "cli-templates", "extras", "websocket")
        ];
        
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                templatePath = p;
                break;
            }
        }
        
        if (!templatePath) {
            s.stop("Templates not found");
            p.cancel("Could not find WebSocket templates. Make sure you're using the latest AFC Stack version.");
            process.exit(1);
        }
        
        // Copy WebSocket service
        const wsSource = path.join(templatePath, "ws");
        const wsTarget = path.join(projectRoot, "apps", "ws");
        await fs.copy(wsSource, wsTarget);
        
        s.message("Updating frontend");
        
        // Update page.tsx
        const pageSource = path.join(templatePath, "page.tsx");
        const pageTarget = path.join(projectRoot, "apps", "web", "src", "app", "page.tsx");
        await fs.copy(pageSource, pageTarget);
        
        s.message("Updating API routes");
        
        // Update API route
        const routeSource = path.join(templatePath, "route.ts");
        const routeTarget = path.join(projectRoot, "apps", "web", "src", "app", "api", "todos", "route.ts");
        await fs.copy(routeSource, routeTarget);
        
        s.message("Updating environment variables");
        
        // Update .env.example
        const envExamplePath = path.join(projectRoot, ".env.example");
        if (fs.existsSync(envExamplePath)) {
            let envContent = await fs.readFile(envExamplePath, "utf-8");
            if (!envContent.includes("NEXT_PUBLIC_WS_URL")) {
                envContent += `\n# WebSocket Realtime\nNEXT_PUBLIC_WS_URL=ws://localhost:4001\nWS_INTERNAL_URL=http://localhost:4001\nPORT=4001\n`;
                await fs.writeFile(envExamplePath, envContent);
            }
        }
        
        // Update .env if exists
        const envPath = path.join(projectRoot, ".env");
        if (fs.existsSync(envPath)) {
            let envContent = await fs.readFile(envPath, "utf-8");
            if (!envContent.includes("NEXT_PUBLIC_WS_URL")) {
                envContent += `\n# WebSocket Realtime\nNEXT_PUBLIC_WS_URL=ws://localhost:4001\nWS_INTERNAL_URL=http://localhost:4001\nPORT=4001\n`;
                await fs.writeFile(envPath, envContent);
            }
        }
        
        s.stop("WebSocket added successfully!");
        
        p.outro(
            `${color.green("✓")} WebSocket service has been added!\n\n` +
            `Next steps:\n` +
            `  ${color.cyan("bun install")}                    # Install WS dependencies\n` +
            `  ${color.cyan("bun run dev")}                     # Start all services\n\n` +
            `The WebSocket service will run on ${color.cyan("http://localhost:4001")}\n\n` +
            `For more information, see:\n` +
            `  ${color.dim("cli-templates/extras/websocket/README.md")}`
        );
        
    } catch (error) {
        s.stop("Failed to add WebSocket");
        p.cancel(error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

main().catch(console.error);
