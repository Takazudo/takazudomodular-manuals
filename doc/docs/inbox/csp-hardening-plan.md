---
title: CSP Flip-to-Enforced Hardening Plan
sidebar_position: 70
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
keeps the Docusaurus site (`/manuals/doc/*`) on Report-Only.

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

### Docs carve-out (`/manuals/doc/*`)

`pnpm build` copies the Docusaurus output into `dist/manuals/doc/`
(`baseUrl: '/manuals/doc/'`), and Docusaurus output contains inline `<script>`
and inline `<style>` that the enforced viewer policy would block. A naive global
flip would therefore break `/manuals/doc/*`.

The carve-out detaches the enforced header for that path and keeps docs on the
previous docs-tolerant Report-Only directive (with `'unsafe-inline'` in both
`script-src` and `style-src`):

```
/manuals/doc/*
  ! Content-Security-Policy
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

`! Content-Security-Policy` is Cloudflare Pages' detach syntax: the `/*` rule
sets the enforced header, then this more-specific rule removes it for the docs
path and substitutes the Report-Only directive. The other security headers
(`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) are inherited
from `/*` and still apply to docs. Hardening the docs CSP (hashing Docusaurus's
inline scripts/styles, or enforcing a docs-specific policy) is deferred.

## Flip-to-enforced criteria (reference)

The viewer flip was gated on the steps below.

### Step 1 — Confirm zero violations on the PR-preview origin

The PR preview URL (`https://pr-<N>.zmanuals.pages.dev/manuals/oxi-one-mk2/`)
goes through the real Cloudflare Pages + Netlify proxy chain. Verify **zero CSP
violations** in the browser console on that origin for both a viewer page **and**
a `/manuals/doc/` page before merging. This is the pre-merge gate for the topic
branch; it cannot be exercised by `pnpm serve` on `localhost:8030`.

### Step 2 — Replace `script-src 'unsafe-inline'` with the SHA-256 hash ✅ executed

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

Result: `sha256-hIolMSvWhopr46DqQi50arv0b3/qeN3LLlH0NTMq3K8=` (cross-checked by
extracting the constant from source and hashing via `node` to avoid shell
single-quote pitfalls). This value replaced `'unsafe-inline'` in `script-src`.

### Step 3 — Audit `style-src 'unsafe-inline'` ✅ executed — token dropped

Audited the rendered surface WITHOUT running `pnpm build`:

- No `style=` attributes or `<style>` elements in `layouts/`, `components/`,
  `pages/`, `lib/`, `styles/`, or `public/` (non-data).
- No `style=` / `<style>` in any committed `public/*/data/pages-*.json` — this is
  the HTML injected via `dangerouslySetInnerHTML` (`prose-content.tsx`
  `contentHtml`).
- `manual-app.tsx`'s `markerInnerHtml` only re-injects the captured SSR body; it
  introduces no new inline styles.
- The only `<style>` match repo-wide is in `scripts/pdf-render-browser.js`, a
  build-time Puppeteer render script that never reaches the live site.
- Programmatic `element.style.setProperty(...)` calls (e.g. the zoom lens in
  `page-viewer.tsx`) are CSSOM mutations, which CSP `style-src` does **not**
  govern — only HTML-parsed `style=`/`<style>` and external stylesheet origins.
  Preact island hydration does not inject inline styles by itself.

Conclusion: no inline styles on the viewer surface, so `'unsafe-inline'` was
dropped from `style-src`. The Google Fonts stylesheet is an external
`<link rel="stylesheet">`, so the `https://fonts.googleapis.com` origin is kept.

### Step 4 — Rename the header ✅ executed

`Content-Security-Policy-Report-Only` on `/*` was renamed to
`Content-Security-Policy` (the enforced directive above). This is the live-site
flip; it is verified on the PR preview (Step 1) before merge.

## Future options (not yet decided)

A **reporting endpoint** (`report-to` / `report-uri`) could collect violations
centrally instead of console-only, backed by either a lightweight Cloudflare
Worker forwarding to a logging service, or a third-party service (e.g.
[report-uri.com](https://report-uri.com)). This remains an infrastructure
decision and is **not** part of the enforced flip. The directive currently has
no `report-to`/`report-uri`, so violations surface only in each visitor's
console.
</content>
</invoke>
