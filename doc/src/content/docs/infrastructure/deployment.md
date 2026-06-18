---
title: Deployment
sidebar_position: 1
description: How the zmanuals site and its docs deploy to Cloudflare Workers.
---

# Deployment

## Production site

The zmanuals site (`manuals.takazudomodular.com`) is a Cloudflare Workers static-assets deployment. The Worker (`zmanuals`) is configured in `wrangler.toml` at the repo root and serves the `dist/` directory produced by the zfb build.

### What deploys

- **Worker name:** `zmanuals`
- **Entry point:** `dist/_worker.js` (emitted by the zfb adapter; handles SSR fallbacks and the `/manuals/* → /:splat` 301 redirect at the base-path layer)
- **Static assets:** `dist/` directory, with `_worker.js` and `_zfb_inner.mjs` excluded from the public asset layer via `dist/.assetsignore` (written by the deploy workflow before upload)
- **Custom domain:** `manuals.takazudomodular.com` — auto-attached via the `[[routes]]` block in `wrangler.toml` (`custom_domain = true`)
- **workers.dev subdomain:** enabled (`workers_dev = true`) to allow `*.workers.dev` preview-alias URLs for PRs

### Deploy trigger

Every push to `main` runs `.github/workflows/main-deploy.yml`, which:

1. Builds the zfb static site via the `./.github/actions/build-zfb` composite action (Node 22, pnpm).
2. Writes `dist/.assetsignore` to exclude `_worker.js` and `_zfb_inner.mjs` from the public asset directory.
3. Runs `wrangler deploy` (version pinned to `package.json` `devDependencies.wrangler`) — this deploys the Worker and auto-attaches the custom domain.
4. Records a GitHub deployment status (`cloudflare/production`) on the commit.

The deploy job runs after the build job (outputs cached via `actions/cache` scoped to `github.run_id`). Concurrency is serialised under the `production-deploy` group; in-progress runs are not cancelled.

**Secrets required:**

| Secret | Scope |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Workers: Edit (account-level) |
| `CLOUDFLARE_ACCOUNT_ID` | — |

### Legacy redirect

Old deep links at `/manuals/*` (e.g. former Docusaurus-era bookmarks) are handled by the Worker itself at the base-path layer:

```
/manuals/* → /:splat  (HTTP 301)
```

This redirect is built into the zfb app — no separate Cloudflare redirect rule is needed.

### Static asset caching

Cache rules are set in `public/_headers` (deployed alongside the Worker):

| Path pattern | Cache-Control |
|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` (content-hashed bundles) |
| `/*/pages/*`, `/*/thumbs/*` | `public, max-age=31536000, immutable` (rendered PDF PNGs) |
| `/*/data/*` | `public, max-age=0, must-revalidate` (JSON data files) |

## Docs site

The documentation site (`doc-manuals.takazudomodular.com`) deploys independently via a separate Cloudflare Worker (`zmanuals-doc`) configured in `doc/wrangler.toml`. The docs build produces a pure-static output (no `_worker.js`) so the asset-serving layer handles all routing directly. The docs CI deploy runs in a separate workflow (`doc-pr-checks.yml` / `doc-deploy.yml`) and does not share build artifacts or secrets with the main app deploy.
