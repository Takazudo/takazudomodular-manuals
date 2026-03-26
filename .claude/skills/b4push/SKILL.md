---
name: b4push
description: >-
  Run comprehensive pre-push validation covering code quality, build, production server, and smoke
  e2e tests. Use when: (1) Completing a PR or feature implementation, (2) Before pushing significant
  changes, (3) After large refactors, (4) User says 'b4push', 'before push', 'check everything', or
  'ready to push'.
user-invocable: false
allowed-tools:
  - Bash
---

# Before Push Check

Run `pnpm b4push` from the project root. This executes `scripts/b4push.sh`:

1. **Code quality checks** - typecheck, lint, format via `pnpm check`
2. **Clean build** - `pnpm clean && pnpm build` (Next.js + Docusaurus)
3. **Start production server** - serve built output on port 8030
4. **Wait for server** - retry with 30s timeout
5. **Smoke e2e tests** - test all manual pages load successfully

Takes ~5-10 minutes. All steps must pass.

## On failure

1. Read the failure output to identify which step failed
2. Auto-fix what you can:
   - Formatting: `pnpm check:fix`
   - Lint: `pnpm lint:fix`
3. Re-run `pnpm b4push` to confirm all checks pass
4. Report the final status
