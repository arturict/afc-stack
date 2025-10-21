# Setup Script

This script helps you quickly set up a new repository from this template.

## Usage

1. Copy this template to a new directory
2. Run the setup script:

```bash
./setup.sh your-project-name your-github-handle
```

This will:
- Replace `your-stack` with your project name
- Replace `your-github-handle` with your GitHub username
- Initialize a new git repository
- Set up the initial structure

## Manual Setup

If you prefer to set up manually:

1. **Update project name** in:
   - `package.json` (root)
   - `apps/web/package.json`
   - `apps/ws/package.json`
   - `README.md`
   - `.github/workflows/deploy.yml` (GHCR image names)

2. **Update GitHub handle** in:
   - `.github/CODEOWNERS`

3. **Initialize git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit from template"
   ```

4. **Install dependencies**:
   ```bash
   bun install
   ```

5. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

6. **Start development**:
   ```bash
   docker compose -f compose.dev.yml up -d
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   bun run dev
   ```
