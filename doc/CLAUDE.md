# Documentation (zudo-doc) - CLAUDE.md

zudo-doc documentation system configuration. For project-wide instructions, see the root `CLAUDE.md`.

## Overview

Project documentation lives in `doc/` and is built with **zudo-doc 1.2.0** — a documentation framework built on zfb (Preact islands), MDX, and Tailwind CSS v4.

As of the 1.2.0 migration, `doc/` is a **single-package consumer** of `@takazudo/zudo-doc`. All pages, layouts, components, and utilities come from the package — there are no local `pages/lib/*` or `src/components/*` forks. Only project-specific config and content live in `doc/`.

- **Content location**: `doc/src/content/docs/`
- **Categories**: `architecture/`, `design-system/`, `infrastructure/`, plus top-level `index.mdx`
- **Color mode**: Light + dark, respects system preference, defaults to dark
- **Robots**: noindex/nofollow — self-managed via `doc/public/_headers`, `doc/public/robots.txt`, and `noindex: true` in `doc/src/config/settings.ts`

## Development Commands

Run from the **project root** (delegated via `pnpm -C doc`):

```bash
pnpm doc:dev            # Start zudo-doc dev server (port 4321)
pnpm doc:build          # Build documentation to doc/dist
```

Or directly in `doc/`:

```bash
pnpm dev                # Dev server (port 4321)
pnpm build              # Build to dist/
pnpm check              # TypeScript type check + lint + format
pnpm b4push             # Full pre-push gate (check + build + html-validate + check:links)
```

The docs build is **independent** of the main app build (`pnpm build` does not build docs).

## Deployment

Docs deploy independently to a dedicated Cloudflare Worker (`zmanuals-doc`) at:

**https://doc-manuals.takazudomodular.com/**

## Content Structure

```
doc/src/content/docs/
├── index.mdx                   # Top-level landing page
├── architecture/               # Architecture decisions and diagrams
├── design-system/              # Zudo Design System reference
│   └── design-system.md        # Tailwind v4 tokens, CSS variables, dark theme
└── infrastructure/             # Deployment, CI/CD, Cloudflare setup
```

### Sidebar & Navigation

- Sidebar order: use `sidebar_position` in MDX frontmatter (lower number = higher)
- Header nav categories: configured in `doc/src/config/settings.ts` (`headerNav` array)
  - Architecture → `/docs/architecture`
  - Design System → `/docs/design-system`
  - Infrastructure → `/docs/infrastructure`

## Project Structure

```
doc/
├── src/
│   ├── content/docs/       # MDX documentation files
│   └── config/
│       ├── settings.ts     # Site config (siteName, headerNav, noindex, siteUrl, githubUrl, etc.)
│       └── z-index-tokens.ts  # Project z-index token definitions
├── public/                 # Static assets (_headers, robots.txt, ogp.png)
├── scripts/                # Project tooling (check-links, pin-parity, template-drift, etc.)
├── .template-drift-allowlist  # Intentional template divergences from create-zudo-doc baseline
├── setup-preset.json       # Scaffold preset used to generate this project (provenance)
├── .zudo-doc.json          # Package version + ejected-files tracking
├── zfb.config.ts           # zfb/zudo-doc build config
└── package.json            # Doc-specific dependencies and scripts
```

## Single-Package Architecture (1.2.0)

In this single-package setup:

- `pages/lib/*`, `src/components/*`, `src/layouts/*` come entirely from `@takazudo/zudo-doc`.
- `src/config/settings.ts` is the primary project customization point — all feature flags and site metadata live here.
- `src/config/z-index-tokens.ts` is the one project-owned config extension (z-index layer definitions).
- Adding/removing features: update `settings.ts` flags; no local file changes needed.
- If a component must be customized (rare), use `zudo-doc`'s ejection mechanism and update `.zudo-doc.json`.

## Design System Documentation

The Zudo Design System documentation is at `doc/src/content/docs/design-system/design-system.md` (served at `/docs/design-system/design-system`). This is the authoritative reference for the custom Tailwind CSS v4 configuration used in the main app.

## Category index convention

Each category directory has an `index.mdx` that acts as its landing page. The convention is:

- **Category index** (`{category}/index.mdx`): contains ONLY a short one-sentence intro + `<CategoryNav category="{slug}" />`. No manual link lists.
- **Top-level index** (`index.mdx`): uses `<CategoryNav categories={["slug1", "slug2", ...]} />` listing the top-level categories explicitly.
- **Actual docs** live as `.md` / `.mdx` files directly under the category directory (not nested further).
- **CategoryNav** is a globally available MDX component — no import needed. It renders each child doc's frontmatter `title` + `description` as cards, ordered by `sidebar_position`.
- Every doc file should carry a `description:` frontmatter line so CategoryNav cards display useful summaries.
- Slugs passed to `category=` or `categories={[...]}` must exactly match directory names under `doc/src/content/docs/`.

## Tooling Scripts

The `doc/scripts/` directory contains project-specific quality scripts:

- `check-links.js` — post-build broken link checker (run via `pnpm check:links` after `pnpm build`)
- `check-pin-parity.mjs` — verifies zfb + zudo-doc package groups stay in lockstep
- `check-wrangler-pin.mjs` — verifies installed wrangler matches the version zfb expects
- `check-template-drift.sh` — compares project files against create-zudo-doc template baseline
- `setup-doc-skill.sh` — sets up the `zmanuals-doc-wisdom` Claude Code skill
- `run-b4push.sh` — full pre-push gate (check + build + html-validate + links)

Run `pnpm b4push` as the pre-push quality gate before any `git push` on doc changes.

## Updating zudo-doc

When bumping `@takazudo/zudo-doc`:

1. Update `@takazudo/zudo-doc`, `@takazudo/zudo-doc-history-server`, and `create-zudo-doc` together (pin-parity group).
2. Run `pnpm check:pin-parity` to verify.
3. Run `pnpm check:template-drift` to see if any scaffold files changed. Add new divergences to `.template-drift-allowlist` only if they are intentional project customizations.
4. Run `pnpm b4push` to verify everything still passes.
