---
title: Migration — Next.js → zfb
sidebar_position: 1
---

# Migration: Next.js → zfb

This page records the migration of the zmanuals app from Next.js 14+ (App Router) to
`@takazudo/zfb` (Preact islands, static site generation), completed in GitHub Epic #126.

## Background

The original app was built with Next.js 14+ App Router and React 19. The migration to zfb
was done to reduce bundle size, eliminate the React 19 runtime dependency, and align with
the Preact-based zfb framework used in the takazudomodular ecosystem.

## What changed

### Framework

| Before | After |
| ------ | ----- |
| Next.js 14+ App Router | `@takazudo/zfb` Preact islands |
| React 19 + `react-dom` | Preact via `preact/compat` |
| `app/` directory (RSC) | `pages/` + `layouts/` (zfb templates) |
| `next.config.js` | `zfb.config.ts` |
| `basePath: '/manuals'` in next.config | `base: '/manuals/'` in zfb.config (later changed to `'/'` in the CF Workers migration — see issue #211) |
| `next build` → `out/` | `zfb build` → `dist/` |

### Routing

| Before | After |
| ------ | ----- |
| `<Link href="/path">` (next/link) | Plain `<a href="/path">` (zfb rewrites at build) |
| `useRouter()` (next/navigation) | `components/zfb/routing.ts` helpers |
| `usePathname()` (next/navigation) | URL read from `window.location` in island |
| `notFound()` (next/navigation) | Static fallback pages |

### Components

| Before | After |
| ------ | ----- |
| `components/` (Next-coupled, React 19) | `components/zfb/` (Preact, prop-based) |
| `components/language/language-context.tsx` | `components/zfb/manual-app.tsx` owns lang state |
| `components/markdown-renderer.tsx` | Build-time `contentHtml` via `pdf:md-to-html` |

### TypeScript

- `tsconfig.json` now uses `jsx: "react-jsx"` + `jsxImportSource: "preact"` (no Next plugin)
- `tsconfig.zfb.json` (migration shim) merged into `tsconfig.json` and deleted
- `react`/`react-dom` path aliases in tsconfig map to `preact/compat`

### Dependencies removed

- `next`, `eslint-config-next`
- `react`, `react-dom`, `@types/react`, `@types/react-dom` (covered by `preact/compat`)
- `next-mdx-remote`, `react-markdown` (markdown now rendered at build time to `contentHtml`)
- `@svgr/webpack`
- `remark-frontmatter` (only used in `scripts/md-formatter` sub-package which has its own dep)

### Dependencies moved to devDeps

- `rehype-highlight`, `rehype-slug`, `remark-gfm` (only used by `scripts/pdf-md-to-html.js`)

### Base path handling

Before: Next.js `basePath: '/manuals'` added the prefix automatically to all routes and
static asset references.

After (zfb, at migration time): zfb's link rewriter handles static literal `href`/`src` at build time. Runtime-built
URLs (page images from JSON, fetch calls, `history.pushState`) use `withBasePath()` from
`components/zfb/routing.ts`.

After (CF Workers migration, issue #211): The site now deploys at the root of its own domain
(`manuals.takazudomodular.com`), so the base is `'/'`. `withBasePath()` is still called for
correctness but at base `/` it returns root-relative paths unchanged.

## Sub-issues (wave order)

| Sub | What |
| --- | ---- |
| #127 | Set up zfb + Preact config, port global CSS |
| #128 | Port styles and layout |
| #129 | Build-time markdown → HTML (`pdf:md-to-html`) |
| #130 | Port the mega-island (viewer, lang, search) |
| #131 | SVG + asset URL handling |
| #132 | Port landing page |
| #133 | zfb routing + build pipeline |
| #134 | Static assets (favicon, headers) |
| #135 | Swap tests to zfb components |
| #136 | CI cutover to zfb build |
| #137 | Decommission Next.js (this doc) |
