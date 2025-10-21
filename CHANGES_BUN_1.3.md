# Bun 1.3 Update

## Changes Made

### Version Updates
- **Bun**: 1.1.31 → 1.3.0
- **setup-bun GitHub Action**: v1 → v2

### Test Runner Migration
Migrated from Vitest to Bun's native test runner:
- ✅ **Faster test execution** - Native Bun performance
- ✅ **Jest-compatible API** - Same syntax as before
- ✅ **Built-in coverage** - No additional dependencies
- ✅ **Watch mode** - `bun test --watch`

**Before:**
```typescript
import { describe, it, expect } from "vitest";
```

**After:**
```typescript
import { describe, it, expect } from "bun:test";
```

### Configuration
Added `bunfig.toml` for Bun configuration:
- Install behavior (auto peer deps)
- Test settings
- Future registry configurations

### Removed Dependencies
- `vitest` - Replaced with `bun test`
- `vitest.config.ts` - No longer needed

### Benefits of Bun 1.3

1. **Native Test Runner**
   - No external dependencies
   - Faster execution
   - Better TypeScript support

2. **Improved Performance**
   - Faster package installation
   - Better caching
   - Optimized bundling

3. **Better DX**
   - Unified tooling (runtime, bundler, test runner, package manager)
   - Simplified configuration
   - Watch mode for everything

## Running Tests

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Specific test file
bun test apps/web/src/lib/utils.test.ts

# Coverage (future)
bun test --coverage
```

## Migration Guide for Existing Projects

If you have an existing AFC Stack project on Bun 1.1:

1. **Update Bun**
   ```bash
   bun upgrade
   ```

2. **Update package.json**
   ```json
   {
     "packageManager": "bun@1.3.0"
   }
   ```

3. **Update tests**
   ```bash
   # Replace all test imports
   find . -name "*.test.ts" -exec sed -i 's/from "vitest"/from "bun:test"/g' {} \;
   ```

4. **Remove Vitest**
   ```bash
   bun remove vitest
   rm vitest.config.ts
   ```

5. **Update GitHub Actions** (if using)
   - Change `setup-bun@v1` → `setup-bun@v2`
   - Update `bun-version: 1.3.0`

6. **Run tests**
   ```bash
   bun test
   ```

Done! Your project is now on Bun 1.3.
