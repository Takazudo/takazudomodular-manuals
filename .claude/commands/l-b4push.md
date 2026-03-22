---
allowed-tools: Bash
description: "Run pre-push checks: code quality, build, serve production build, and run smoke e2e tests"
---

# Before Push (b4push)

Run comprehensive pre-push checks to ensure code quality and functionality before pushing to remote.

## What This Command Does

1. **Code quality checks** (typecheck, lint, format)
2. **Clean build** (clean + production build)
3. **Start production server** on port 8030
4. **Wait for server** (retry with 30s timeout)
5. **Run smoke e2e tests** against production build
6. **Cleanup** (server killed via trap on exit)

## Usage

```bash
pnpm run b4push
```

## What Gets Tested

- TypeScript compilation
- ESLint rules
- Prettier formatting
- Production build succeeds
- All manual pages load successfully (dynamically detects all manuals from registry)
- No HTTP errors

## Time Estimate

- **Total:** ~5-10 minutes
  - Code checks: ~30 seconds
  - Build: ~1-2 minutes
  - Smoke tests: ~3-7 minutes (all manuals)

## Notes

- Tests run against **production build** served on port 8030
- Uses `serve` package via `pnpm dlx`
- Server health checked with retry (up to 30 attempts)
- Cleanup trap ensures server is killed on exit (even on failure)
- Collects all failures and reports summary at the end
- **Dynamic manual detection**: Automatically tests all manuals from registry

## On Failure

1. Read the failure output to identify which step failed
2. Auto-fix what you can:
   - Formatting: `pnpm check:fix`
   - Lint: `pnpm lint:fix`
3. Re-run `pnpm b4push` to confirm all checks pass
4. Report the final status

## See Also

- Script: `scripts/b4push.sh`
- Test script: `scripts/test-all-pages-fast.js`
