# CLI Templates

This directory contains template files used by the AFC Stack CLI to generate new projects.

## Structure

```
cli-templates/
├── base/           # Base template files (always included)
│   ├── apps/       # Application templates
│   ├── packages/   # Package templates
│   └── .github/    # GitHub configuration
└── extras/         # Optional feature templates (future)
    ├── auth/       # Authentication variants
    ├── styling/    # Styling options
    └── features/   # Additional features
```

## Base Template

The `base/` directory contains a complete, working AFC Stack setup including:

- **apps/web**: Next.js 15 App Router with Tailwind
- **apps/ws**: Fastify WebSocket service
- **packages/db**: Drizzle ORM schema and client
- **.github**: CI/CD workflows, issue templates, etc.

## How It Works

1. User runs `bun run create` in the AFC Stack repo
2. CLI prompts for project configuration
3. Base template is copied to new project directory
4. Configuration files are generated based on choices
5. Dependencies are installed with chosen package manager

## Customization

### Adding New Templates

To add a new optional template:

1. Create a new directory in `extras/`
2. Add template files with placeholders
3. Update CLI to conditionally copy these files
4. Document the new option

### Template Variables

Templates can use these placeholders (future feature):

- `{{PROJECT_NAME}}` - Project name from CLI
- `{{PACKAGE_MANAGER}}` - bun/pnpm/npm
- `{{DATABASE}}` - postgres/mysql/sqlite
- `{{ORM}}` - drizzle/prisma

## Maintenance

- Keep templates in sync with main repo
- Test template generation regularly
- Update dependencies in templates
- Document breaking changes

## Future Plans

### Extras Templates (Coming Soon)

```
extras/
├── auth/
│   ├── nextauth/       # NextAuth v5 setup
│   ├── lucia/          # Lucia Auth setup
│   └── clerk/          # Clerk integration
├── styling/
│   ├── shadcn/         # shadcn/ui components
│   └── tailwind/       # Extended Tailwind config
├── features/
│   ├── websocket/      # WebSocket service
│   ├── storage/        # File upload setup
│   └── analytics/      # Analytics integration
└── deployment/
    ├── coolify/        # Coolify configs
    ├── vercel/         # Vercel setup
    └── railway/        # Railway configs
```

### Conditional File Generation

Example: Only include WebSocket service if user chooses realtime option:

```typescript
if (config.realtime === "websocket") {
    await fs.copy(path.join(templateExtras, "features/websocket"), path.join(projectPath, "apps/ws"));
}
```

### Template Variables

Future implementation for dynamic content:

```typescript
// Template file
const pkg = {
    name: "{{PROJECT_NAME}}",
    packageManager: "{{PACKAGE_MANAGER}}"
};

// Replace in CLI
content = content.replace(/{{PROJECT_NAME}}/g, config.name);
```

## Testing Templates

```bash
# Test template generation
cd /tmp
git clone <your-afc-stack-fork>
cd afc-stack
bun install
bun run create

# Follow prompts
# Verify generated project works:
cd <new-project>
docker compose -f compose.dev.yml up -d
bun run db:migrate
bun run dev
```

## Contributing

When modifying templates:

1. Test generation with different configurations
2. Verify all package.json scripts work
3. Check Docker builds succeed
4. Update this README
5. Document any breaking changes
