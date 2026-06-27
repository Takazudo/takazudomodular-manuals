# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a zfb-based manual viewer for hardware synthesizer manuals. The site provides a bilingual viewing experience (original English PDF pages + Japanese translations) with continuous page numbering. Built with Preact islands for fast static pages with selective interactivity.

**Project Goal**: Create a web-based manual viewer that displays PDF page images alongside Japanese translations in a user-friendly, searchable interface.

**URL Structure**:

- Base path: `/` (root — no prefix)
- Pages: `/oxi-one-mk2/page/[1-302]`
- Example: `/oxi-one-mk2/page/1` (page 1)
- Bilingual toggle: header segmented `JA | EN` control switches the translation column language; EN adds `?lang=en` to the URL, localStorage key `zmanuals:lang`. See `doc/docs/inbox/bilingual-support.md`.

**Deployed Website**: https://manuals.takazudomodular.com/

- Full URL: `https://manuals.takazudomodular.com/oxi-one-mk2/`
- The deployed site reflects the current state of the main branch
- PR preview URLs: `https://pr-<N>-zmanuals-<hash>.takazudo.workers.dev/` (auto-deployed on every same-repo PR via `wrangler versions upload --preview-alias pr-<N>`; URL posted as PR comment)

## Base Path Configuration (Critical Architecture Decision)

**This site uses `base: '/'` in `zfb.config.ts` (via `lib/base-path.ts`).**

The site is deployed as a Cloudflare Workers static-asset site at its own custom domain (`manuals.takazudomodular.com`). There is no Netlify proxy and no `/manuals` prefix — the site lives at the root of its domain. The canonical base value is exported from `lib/base-path.ts` as `ZFB_BASE = '/'` and imported by both `zfb.config.ts` and `components/zfb/routing.ts`.

**Key rules:**

- **Route paths** (page links, navigation): No prefix needed — zfb's link rewriter handles static literal `href`/`src` values automatically at build time
- **Runtime-built URLs** (page images from JSON, fetch calls, `history.pushState`): Use `withBasePath()` from `components/zfb/routing.ts`. At base `/`, `withBasePath('/oxi-one-mk2/pages/page-001.png')` returns the path unchanged — but always call `withBasePath()` so the code stays correct if the base ever changes.
- **Pages directory**: Routes defined as `pages/[manualId]/page/[pageNum].tsx` serve at `/{manualId}/page/{pageNum}` (no `/manuals` prefix)
- **Configuration**: `lib/base-path.ts` (single source of truth), `zfb.config.ts` (imports `ZFB_BASE`), `components/zfb/routing.ts` (`withBasePath` helper)

## Language Guidelines

**Development Language: English** - All communication, GitHub issues/PRs, commit messages, code comments, documentation

**Application Language: Japanese** - UI text, translations, user-facing content (`lang="ja"`)

**Rationale:** English for development ensures accessibility for international collaboration while keeping the end-user experience fully localized for Japanese users.

## Security & Command Restrictions

- **NEVER use `rm -rf` with absolute paths** - Always use relative paths like `rm -rf ./foo/bar`
- **Never use force push** - Force push can destroy commit history
- **Don't use `git commit --amend`** - Only with explicit user permission
- **Don't reuse branch names** - Always make new branch names for each PR
- **Default merge strategy**: Regular merge (NOT squash) unless explicitly requested

## Temporary Files (`__inbox/`)

All temporary files (reports, screenshots, test outputs, error reports) go to `__inbox/` (gitignored). Never save temporary files to the repository root.

## Directory Structure

```
/
├── pages/                      # zfb page templates (static generation)
│   └── [manualId]/             # Per-manual page templates
├── layouts/                    # zfb layout wrappers
├── components/                 # Preact components
│   └── zfb/                    # zfb-specific islands and utilities
├── lib/                        # Utilities and libraries
├── styles/                     # Global CSS (Tailwind / Zudo Design System)
├── public/                     # Static assets
│   └── oxi-one-mk2/           # OXI ONE MKII manual
│       ├── data/               # Final JSON files (build time import)
│       ├── pages/              # Rendered PNG images (150 DPI)
│       └── processing/         # Intermediate files (gitignored)
├── manual-pdf/                 # Source PDFs (pages/parts gitignored)
├── scripts/                    # Build and processing scripts
├── doc/                        # zudo-doc documentation (deploys independently to doc-manuals.takazudomodular.com)
├── worktrees/                  # Git worktrees (gitignored)
└── __inbox/                    # Temporary files (gitignored)
```

Each manual is self-contained under `/public/{manual-id}/` with its own data, images, and processing files.

## Package Manager & Technology Stack

This project uses **pnpm** (workspace in `pnpm-workspace.yaml`).

- **zfb** (Preact islands, static site generation) | **Preact** (via `preact/compat`) | **TypeScript**
- **Tailwind CSS v4** with Zudo Design System | **zudo-doc 1.2.0** (`@takazudo/zudo-doc` single-package consumer) for docs
- **JSON** for translation data | **PNG** for rendered PDF pages (150 DPI)

## Development Commands

```bash
# App development
pnpm dev                # Start zfb dev server (port 3300)
pnpm build              # Build for production (search index + zfb only; docs build separately)
pnpm preview            # Preview the zfb build
pnpm serve              # Serve production build locally (port 8030)

# Documentation (see doc/CLAUDE.md for details)
pnpm doc:dev            # Start zudo-doc dev server (port 4321)
pnpm doc:build          # Build documentation

# Quality
pnpm typecheck          # Type checking
pnpm lint               # Linting (lint:fix to auto-fix)
pnpm format             # Formatting (format:fix to auto-fix)
pnpm check              # Run all checks (check:fix to auto-fix)
pnpm test               # Run Playwright e2e tests
pnpm test:unit          # Run Vitest unit tests
pnpm clean              # Clean build outputs (.zfb-build, dist, doc/dist, doc/.zfb)
```

## Adding New Manuals

**Use the `/l-pdf-process` skill to add new manuals.** This is the recommended workflow that handles the complete pipeline automatically:

```bash
# 1. Place source PDF in manual-pdf/{slug}/ directory
cp /path/to/Manual.pdf manual-pdf/my-manual/

# 2. Run the PDF processing skill
/l-pdf-process my-manual
```

The skill will:

- Process the PDF (split, render pages, extract text)
- Translate to Japanese using Claude Code subagents
- Build JSON data files
- Regenerate the manual registry (`pnpm run gen:registry` → `lib/zfb-registry.generated.ts`)
- Handle all metadata and configuration

**Do NOT run individual PDF commands manually** (`pnpm run pdf:split`, etc.). The `/l-pdf-process` skill manages the entire workflow with proper integration and metadata collection.

For details on PDF processing steps and configuration, see `scripts/CLAUDE.md`.

## Design System (Zudo Design System)

Custom Tailwind CSS v4 config: all defaults disabled, only Zudo tokens. CSS variables in `:root`, semantic naming (`hgap`/`vgap`), dark theme enforced. See `doc/src/content/docs/design-system/design-system.md` (served at `/docs/design-system/design-system`).

## Coding Standards

### TypeScript

- Strict type checking, define interfaces for all data structures, avoid `any`

### Preact Components

- Functional components with hooks, proper prop types/interfaces, single-purpose
- JSX uses `jsxImportSource: "preact"` — imports resolve to Preact automatically
- Interactive UI lives in `components/zfb/` as islands (`*-island.tsx` files)

### Styling

- **NEVER use inline styles** - Always use Tailwind CSS classes
- Use Zudo design system tokens exclusively
- For long className strings, use `ctl` from `@netlify/classnames-template-literals`

### File Naming

- Use kebab-case for all file names (e.g., `page-viewer.tsx`, `translation-panel.tsx`)

## Quality Assurance & Pre-Push Checklist

**Pre-commit checks**: ESLint, Prettier, TypeScript type checking
**CI/CD**: Automated builds, type checking, linting, formatting, tests, build verification on every PR

**ALWAYS run before pushing:**

```bash
pnpm check          # Run all quality checks (typecheck + lint + format)
pnpm check:fix      # Fix issues if any
pnpm test:unit      # Run unit tests
pnpm build          # Verify production build succeeds
```

## Git Worktree Workflow

We use git worktrees under `worktrees/{tree-name}/` for topic-based development.

**Critical rules:**

- **Always check `pwd` before any git operation** to confirm you're in the correct context
- **Root session (manager)**: Never cd into worktrees for git operations
- **Worktree session (worker)**: All work stays in the worktree, commits go to feature branch
- **Always pull before creating a worktree**: `git pull origin main` first
- **Use `pnpm run init-worktree <name>`** to set up worktrees with correct env links

For detailed worktree workflow, examples, and troubleshooting, see `.claude/CLAUDE.md`.

## Localhost Port Mapping

| Port | Service          | Domain                   | Purpose                     | Start Command |
| ---- | ---------------- | ------------------------ | --------------------------- | ------------- |
| 3300 | zfb App          | `zmanuals.localhost`     | Manual viewer app           | `pnpm dev`    |
| 4321 | zudo-doc Docs    | `localhost`              | Technical documentation     | `pnpm doc:dev`|
| 8030 | Production Build | `localhost`              | Production build test serve | `pnpm serve`  |

Port cleanup: `lsof -ti:[PORT] | xargs kill -9`

## Japanese Text Guidelines

- **Target audience**: Japanese users (です・ます調)
- Preserve technical terms in English (MIDI, CV, Sequencer)
- Maintain consistent terminology across all parts

## GitHub Issues

- #1: Technical Documentation | #2: Project Setup | #3: Docusaurus Setup
- #4: Tailwind CSS Design System | #5: Next.js App MVP | #6: Data Migration
- #7: Convert All Parts | #8: Search | #9: Bookmarking | #10: Performance | #11: Deployment
- #126: zfb Migration Epic (migrated from Next.js to zfb/Preact in waves #127-#137)

## Subdirectory CLAUDE.md Files

Detailed context-specific instructions are in subdirectory CLAUDE.md files (loaded automatically when working in those directories):

- **`scripts/CLAUDE.md`** - PDF processing pipeline, multi-manual support, data structure formats
- **`doc/CLAUDE.md`** - zudo-doc documentation setup and conventions
- **`.claude/CLAUDE.md`** - Git worktree workflow details, Claude Code skills/agents overview
