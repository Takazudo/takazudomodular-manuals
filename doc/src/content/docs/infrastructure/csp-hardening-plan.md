---
title: CSP Flip-to-Enforced Hardening Plan
sidebar_position: 3
---

# CSP Flip-to-Enforced Hardening Plan

## Why this document exists

Cloudflare `_headers` files keep their rationale here rather than inline (the
flip-to-enforced plan was originally captured only in the commit message for
`612cddf`, PR #156). This document is the runbook of record for the CSP on the
manuals site, and now records the **executed** enforced state.

## Executed state (2026-06-10, issue #164)

The viewer surface (`/*`) was flipped from `Content-Security-Policy-Report-Only`
to **enforced** `Content-Security-Policy` in `public/_headers`. A docs carve-out
keeps the Docusaurus site (`/doc` and `/doc/*`) on Report-Only.

Steps 2, 3, and 4 below were executed in this change. Step 1 (zero violations on
the PR-preview proxied origin) is verified on the PR preview before the PR is
merged — the change ships on a topic branch first.

### Enforced directive (viewer surface `/*`)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-hIolMSvWhopr46DqQi50arv0b3/qeN3LLlH0NTMq3K8='; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

- `script-src`: `'unsafe-inline'` replaced with the SHA-256 hash of
  `LANG_BOOTSTRAP_SCRIPT` (the only inline script). When a hash is present
  browsers ignore `'unsafe-inline'`, so the swap is clean.
- `style-src`: `'unsafe-inline'` **dropped** (Google Fonts origin kept) — see the
  audit result below.

### Docs carve-out (`/doc` + `/doc/*`)

`pnpm build` copies the Docusaurus output into `dist/doc/`
(`baseUrl: '/doc/'`), and Docusaurus output contains inline `<script>`
and inline `<style>` that the enforced viewer policy would block. A naive global
flip would therefore break the docs site.

The carve-out detaches the enforced header for the docs path and keeps docs on
the previous docs-tolerant Report-Only directive (with `'unsafe-inline'` in both
`script-src` and `style-src`). **Two rules are needed**, because the
`/doc/*` glob does NOT match the exact no-trailing-slash URL form
`/doc` — a response served at that bare URL (the Docusaurus landing page)
would otherwise fall through to the enforced `/*` policy and break on its inline
scripts/styles. The exact `/doc` rule must be listed first, immediately
before the glob:

```
/doc
  ! Content-Security-Policy
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'

/doc/*
  ! Content-Security-Policy
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

`! Content-Security-Policy` is the Cloudflare `_headers` detach syntax: the `/*` rule
sets the enforced header, then these more-specific rules remove it for the docs
path and substitute the Report-Only directive.

> **Migration note:** When the site moved from Cloudflare Pages (proxied at
> `takazudomodular.com/manuals/*`) to Cloudflare Workers at its own domain
> (`manuals.takazudomodular.com`), the Docusaurus `baseUrl` changed from
> `/manuals/doc/` to `/doc/`. The `_headers` carve-out rules and the `dist/`
> directory layout were updated accordingly (CF Workers migration, issue #211).

## Flip-to-enforced criteria (reference)

The viewer flip was gated on the steps below.

### Step 1 — Confirm zero violations on the PR-preview origin

The PR preview URL (deployed to `*.workers.dev` via Cloudflare Workers) goes through
the real Cloudflare edge. Verify **zero CSP violations** in the browser console on
that origin for both a viewer page **and** a `/doc/` page before merging.

### Step 2 — Replace `script-src 'unsafe-inline'` with the SHA-256 hash (executed)

The only inline script on the page is `LANG_BOOTSTRAP_SCRIPT`, defined in
`layouts/default.tsx`:

```ts
const LANG_BOOTSTRAP_SCRIPT = `(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();`;
```

This string is a build-time constant and never changes, so its hash is stable.
Compute it with:

```bash
printf '%s' "(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();" \
  | openssl dgst -sha256 -binary | base64
```

Result: `sha256-hIolMSvWhopr46DqQi50arv0b3/qeN3LLlH0NTMq3K8=`

### Step 3 — Audit `style-src 'unsafe-inline'` (executed — token dropped)

Audited the rendered surface without running `pnpm build`:

- No `style=` attributes or `<style>` elements in `layouts/`, `components/`,
  `pages/`, `lib/`, `styles/`, or `public/` (non-data).
- No `style=` / `<style>` in any committed `public/*/data/pages-*.json`.
- Programmatic `element.style.setProperty(...)` calls are CSSOM mutations, which CSP `style-src` does **not** govern.

Conclusion: no inline styles on the viewer surface, so `'unsafe-inline'` was
dropped from `style-src`.

### Step 4 — Rename the header (executed)

`Content-Security-Policy-Report-Only` on `/*` was renamed to
`Content-Security-Policy` (the enforced directive). This is the live-site
flip; it is verified on the PR preview (Step 1) before merge.

## Future options (not yet decided)

A **reporting endpoint** (`report-to` / `report-uri`) could collect violations
centrally instead of console-only, backed by either a lightweight Cloudflare
Worker or a third-party service (e.g. [report-uri.com](https://report-uri.com)). The directive currently has
no `report-to`/`report-uri`, so violations surface only in each visitor's
console.
