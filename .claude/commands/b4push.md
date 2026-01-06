---
allowed-tools: Bash
description: "Run pre-push checks: code quality, build, serve production build, and run smoke e2e tests"
---

# Before Push (b4push)

Run comprehensive pre-push checks to ensure code quality and functionality before pushing to remote.

## What This Command Does

1. **Kill existing servers** on port 3100
2. **Code quality checks** (typecheck, lint, format)
3. **Clean build directories**
4. **Build production bundle**
5. **Serve production build** on port 3100 (using `serve`)
6. **Run smoke e2e tests** against production build
7. **Clean up** (stop server)

## Usage

```bash
pnpm run b4push
```

## What Gets Tested

- ✅ TypeScript compilation
- ✅ ESLint rules
- ✅ Prettier formatting
- ✅ Production build succeeds
- ✅ All manual pages load successfully (dynamically detects all manuals from registry)
  - OXI ONE MK2 (272 pages)
  - OXI Coral (46 pages)
  - OXI E16 Quick Start (4 pages)
- ✅ No HTTP errors

## Time Estimate

- **Total:** ~5-10 minutes
  - Code checks: ~30 seconds
  - Build: ~1-2 minutes
  - Smoke tests: ~3-7 minutes (322 pages across all manuals)

## Notes

- Tests run against **production build** (much faster than dev server)
- Server runs on port 3100 (same as dev server)
- Uses `serve` package (Next.js recommended)
- Automatically cleans up after completion
- Exits with error code if any check fails
- **Dynamic manual detection**: Automatically tests all manuals from registry - adding new manuals requires no test updates

## See Also

- Script: `scripts/b4push.sh`
- Test script: `scripts/test-all-pages-fast.js`
