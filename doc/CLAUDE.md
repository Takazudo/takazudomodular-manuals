# Documentation (zudo-doc) - CLAUDE.md

zudo-doc documentation system configuration. For project-wide instructions, see the root `CLAUDE.md`.

## Overview

Project documentation lives in `doc/` and is built with **zudo-doc** — a documentation framework built on zfb (Preact islands), MDX, and Tailwind CSS v4.

- **Content location**: `doc/src/content/docs/`
- **Categories**: `architecture/`, `design-system/`, `history/`, `infrastructure/`, plus top-level `index.mdx`
- **Dark mode**: Default dark theme (respects system preference)
- **Robots**: noindex/nofollow — self-managed via `doc/public/_headers`, `doc/public/robots.txt`, and `noindex: true` in `doc/src/config/settings.ts`

## Development Commands

Run from the **project root** (delegated via `pnpm -C doc`):

```bash
pnpm doc:dev            # Start zudo-doc dev server (port 4321)
pnpm doc:build          # Build documentation to doc/dist
pnpm doc:serve          # Preview the doc build locally
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
├── history/                    # Project history and migration notes
└── infrastructure/             # Deployment, CI/CD, Cloudflare setup
```

### Sidebar & Navigation

- Sidebar order: use `sidebar_position` in MDX frontmatter (lower number = higher)
- Header nav categories: configured in `doc/src/config/settings.ts` (`headerNav` array)
  - Architecture → `/docs/architecture`
  - Design System → `/docs/design-system`
  - Infrastructure → `/docs/infrastructure`
  - History → `/docs/history`

## Project Structure

```
doc/
├── src/
│   ├── content/docs/       # MDX documentation files
│   └── config/
│       └── settings.ts     # Site config (siteName, headerNav, noindex, siteUrl, etc.)
├── public/                 # Static assets (_headers, robots.txt)
├── zfb.config.ts           # zfb/zudo-doc build config
└── package.json            # Doc-specific dependencies
```

## Design System Documentation

The Zudo Design System documentation is at `doc/src/content/docs/design-system/design-system.md` (served at `/docs/design-system/design-system`). This is the authoritative reference for the custom Tailwind CSS v4 configuration used in the main app.
