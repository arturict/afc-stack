# Branch Protection & Git Workflow

## Branch Rules for GitHub

### Protected Branches

#### `main` Branch

**Protection Rules:**

- ✅ Require pull request before merging
    - Require 1 approval (adjust for team size)
    - Dismiss stale reviews when new commits are pushed
    - Require review from Code Owners
- ✅ Require status checks to pass before merging
    - Required checks:
        - `checks` (CI workflow)
        - Build web
        - Build ws
        - Lint
        - Typecheck
- ✅ Require conversation resolution before merging
- ✅ Require linear history (rebase or squash)
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
    - Only maintainers
- ✅ Allow force pushes: **NO**
- ✅ Allow deletions: **NO**

#### `develop` Branch (if using GitFlow)

**Protection Rules:**

- ✅ Require pull request before merging
    - Require 1 approval
- ✅ Require status checks to pass
- ✅ Allow force pushes: **NO**

## Branch Naming Convention

### Feature Branches

```
feat/short-description
feat/issue-123-add-user-auth
feat/websocket-reconnect
```

### Bug Fix Branches

```
fix/short-description
fix/issue-456-database-connection
fix/rate-limit-bypass
```

### Chore/Refactor Branches

```
chore/update-dependencies
chore/improve-logging
refactor/api-routes-structure
```

### Release Branches (if using GitFlow)

```
release/v1.2.0
```

### Hotfix Branches

```
hotfix/critical-security-patch
hotfix/v1.1.1-database-leak
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no code change)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples

```bash
feat(auth): add OAuth support for Discord
fix(websocket): handle reconnection properly
docs: update deployment guide for Coolify
chore(deps): bump next to 15.0.4
refactor(api): extract validation to middleware
```

### Breaking Changes

```bash
feat(api)!: change todos endpoint response format

BREAKING CHANGE: The todos API now returns an array instead of an object.
Migration guide: Update client code to expect { todos: Todo[] }
```

## Pull Request Workflow

### 1. Create Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/my-feature
```

### 2. Make Changes

```bash
# Make your changes
git add .
git commit -m "feat(scope): description"
```

### 3. Keep Up to Date

```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts if any
```

### 4. Push Branch

```bash
git push origin feat/my-feature
```

### 5. Create PR

- Use the PR template
- Link related issues
- Add reviewers
- Add labels
- Request review from Code Owners

### 6. Address Review Feedback

```bash
# Make changes
git add .
git commit -m "fix: address review feedback"
git push origin feat/my-feature
```

### 7. Merge

- **Squash and merge** (default, keeps history clean)
- **Rebase and merge** (for features with multiple logical commits)
- Delete branch after merge

## Code Review Guidelines

### For Authors

- ✅ Self-review your code first
- ✅ Write clear PR description
- ✅ Keep PRs small (< 400 lines ideal)
- ✅ Add tests for new features
- ✅ Update documentation
- ✅ Ensure CI passes
- ✅ Link related issues
- ✅ Add screenshots/videos for UI changes
- ✅ Create changeset for user-facing changes

### For Reviewers

- ✅ Review within 24 hours
- ✅ Be constructive and kind
- ✅ Ask questions, don't demand
- ✅ Approve when ready, request changes when needed
- ✅ Check for:
    - Code quality and readability
    - Test coverage
    - Security issues
    - Performance concerns
    - Breaking changes
    - Documentation updates

## Release Process

### Using Changesets

#### 1. During Development

```bash
# After making changes
bunx changeset
# Choose change type (major/minor/patch)
# Write user-facing description
git add .changeset/
git commit -m "chore: add changeset"
```

#### 2. Prepare Release

```bash
# Bump versions and update CHANGELOG
bun run version
git add .
git commit -m "chore: version packages"
git push origin main
```

#### 3. Create Release

- Tag will be created automatically
- GitHub Release will be drafted
- Update release notes with highlights

## GitHub Actions Required Secrets

Configure these in repository settings:

### For Deployment

- `COOLIFY_WEB_HOOK_URL` - Coolify webhook for web app
- `COOLIFY_WS_HOOK_URL` - Coolify webhook for WebSocket service

### For Package Publishing (if applicable)

- `NPM_TOKEN` - If publishing to npm

## Git Hooks (Coming Soon)

We recommend setting up:

- **pre-commit**: Run linting and formatting
- **commit-msg**: Validate commit message format
- **pre-push**: Run tests before pushing

Implementation coming with `husky` and `lint-staged`.

## Tips for Better Workflow

### Keep PRs Focused

- One feature/fix per PR
- Split large features into smaller PRs
- Use draft PRs for work in progress

### Communication

- Use GitHub discussions for questions
- Comment in PRs for clarification
- Update PR description as scope changes

### Testing

- Write tests for new features
- Update tests for bug fixes
- Run full test suite locally before pushing

### Documentation

- Update README if user-facing changes
- Update API docs if endpoints change
- Add comments for complex logic

## Troubleshooting

### PR Conflicts

```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts
git add .
git rebase --continue
git push origin feat/my-feature --force-with-lease
```

### Failed CI Checks

```bash
# Run checks locally first
bun run lint
bun run typecheck
bun run test
bun run build
```

### Accidental Commit to Main

```bash
# If not pushed yet
git reset HEAD~1
git checkout -b feat/my-feature
git push origin feat/my-feature

# If already pushed (need admin access)
# Contact repository admin
```
