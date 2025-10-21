#!/bin/bash

# Setup script for your-stack template
# Usage: ./setup.sh <project-name> <github-handle>

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <project-name> <github-handle>"
    echo "Example: $0 my-awesome-app john-doe"
    exit 1
fi

PROJECT_NAME=$1
GITHUB_HANDLE=$2

echo "🚀 Setting up $PROJECT_NAME..."

# Replace project name
echo "📝 Updating project name..."
find . -type f \( -name "*.json" -o -name "*.yml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -exec sed -i.bak "s/your-stack/$PROJECT_NAME/g" {} +

# Replace GitHub handle
echo "📝 Updating GitHub handle..."
find . -type f -name "CODEOWNERS" \
    -exec sed -i.bak "s/your-github-handle/$GITHUB_HANDLE/g" {} +

# Clean up backup files
find . -name "*.bak" -delete

# Initialize git
if [ ! -d ".git" ]; then
    echo "🎯 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit from template"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env.example with your values"
echo "2. Run: bun install"
echo "3. Start local services: docker compose -f compose.dev.yml up -d"
echo "4. Generate migrations: bunx drizzle-kit generate"
echo "5. Apply migrations: bunx drizzle-kit migrate"
echo "6. Start dev: bun run dev"
echo ""
echo "📚 See README.md for more information"
