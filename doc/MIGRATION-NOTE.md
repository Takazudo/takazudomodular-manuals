# Migration Note — zudo-doc 1.2.0 Single-Package Migration

This note summarises the S3 tooling/provenance changes made during the 1.2.0 clean-room migration.

## What moved to the package

All pages, layouts, components, and utilities now come from `@takazudo/zudo-doc` — no local forks:

- `pages/lib/*` — package-managed (not project-owned)
- `src/components/*` — package-managed
- `src/layouts/*` — package-managed
- Most of `src/config/*` — package-managed (except `settings.ts`, `z-index-tokens.ts`)
- `src/utils/*`, `src/types/*` — package-managed

The primary project customization point is `doc/src/config/settings.ts`.

## Tooling restored

Scripts restored from `main` (pre-migration baseline), verified against the 1.2.0 scaffold:

- `scripts/check-links.js` — post-build broken link checker (project-specific, no equivalent in scaffold)
- `scripts/check-pin-parity.mjs` — verifies zfb + zudo-doc package groups stay in lockstep
- `scripts/check-wrangler-pin.mjs` — verifies wrangler pin matches zfb's expectation
- `scripts/check-template-drift.sh` — template drift detector (adapted: feature list unchanged; sidebarResizer has no template dir so nothing to add)
- `scripts/setup-doc-skill.sh` — Claude Code skill setup helper
- `doc/lefthook.yml` — pre-commit MDX formatting hook

`scripts/run-b4push.sh` extended with a step 4 link-check on top of the scaffold's 4-step baseline.

## Package.json scripts added

`check:links`, `check:pin-parity`, `check:wrangler-pin`, `check:template-drift`, `format:md`, `format:md:check`, `b4push`, `setup:doc-skill`, `setup:doc-skill-silent`

## Provenance

- `doc/.zudo-doc.json` = `{ "packageVersion": "1.2.0", "ejected": {} }` — nothing ejected
- `doc/setup-preset.json` — `githubUrl` entry added (was missing; needed for future re-scaffolds to preserve the header github-link)

## `.template-drift-allowlist`

New list has 83 entries (vs old 154). Categories:

- **A (82 entries):** Prettier-reformatting only — templates ship double-quotes, project uses single-quotes. No content forks; safe to shrink if create-zudo-doc adopts single-quote style.
- **B (1 entry):** `scripts/run-b4push.sh` — intentionally extended with the link-check step.
- **C (1 entry):** `.zfb/doc-history-meta.json` — build-time artifact.

Old 154-entry list documented local component forks that no longer exist after the clean-room re-scaffold.

## Deliberately NOT restored

None of the old tooling was intentionally dropped — everything from `main` that was project-specific has been restored. The pin-parity and wrangler-pin scripts are now genuinely useful against the 1.2.0 baseline (they verify the zfb + zudo-doc version groups stay aligned).
