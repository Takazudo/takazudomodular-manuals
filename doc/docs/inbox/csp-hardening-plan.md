---
title: CSP Flip-to-Enforced Hardening Plan
sidebar_position: 70
---

# CSP Flip-to-Enforced Hardening Plan

## Why this document exists

Cloudflare `_headers` files cannot contain comments. The flip-to-enforced plan that was documented in the commit message for `612cddf` (PR #156) would otherwise be completely undiscoverable from `public/_headers`. This document captures that plan so it is not lost.

## Current header (Report-Only phase)

`public/_headers` currently sets the following header on all routes (`/*`):

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

During the Report-Only phase the live site is unaffected by the policy — violations appear in the browser console only. This is intentional: the site is proxied through `takazudomodular.com/manuals/*` via a Netlify redirect, so a misconfigured enforced CSP could silently break hydration on the proxied origin in ways that `pnpm serve` on `localhost:8030` does NOT exercise.

## Flip-to-enforced criteria

Switch `Content-Security-Policy-Report-Only` → `Content-Security-Policy` only after all three steps below have been completed:

### Step 1 — Confirm zero violations on the PR-preview origin

The PR preview URL (`https://pr-<N>.zmanuals.pages.dev/manuals/oxi-one-mk2/`) goes through the real Cloudflare Pages + Netlify proxy chain. Open the browser console on that origin and verify there are **zero CSP violation reports** for any legitimate scripts, styles, images, or fonts before proceeding.

### Step 2 — Replace `script-src 'unsafe-inline'` with the SHA-256 hash

The only inline script on the page is `LANG_BOOTSTRAP_SCRIPT`, defined in `layouts/default.tsx`:

```ts
const LANG_BOOTSTRAP_SCRIPT = `(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();`;
```

This string is a build-time constant and its content never changes, so its SHA-256 hash is stable. Compute it with:

```bash
printf '%s' "(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();" \
  | openssl dgst -sha256 -binary | base64
```

Replace `'unsafe-inline'` in `script-src` with `'sha256-<computed-hash>'`. When a hash is present, browsers ignore `'unsafe-inline'`, so the swap is clean and requires no other changes.

### Step 3 — Audit `style-src 'unsafe-inline'`

`'unsafe-inline'` was kept permissive for the Report-Only phase. Before flipping to enforced, audit whether any inline `<style>` elements or `style=` attributes remain in the rendered HTML. The Tailwind stylesheet is an external `<link rel="stylesheet">`, so it does not require `'unsafe-inline'`. Drop the token if no inline styles are found.

### Step 4 — Rename the header

Rename the header in `public/_headers`:

```diff
-  Content-Security-Policy-Report-Only: default-src 'self'; ...
+  Content-Security-Policy: default-src 'self'; ...
```

This is the actual "flip to enforced" step. It is a live-site security change and requires human sign-off before merging.

## Future options (not yet decided)

Instead of console-only violation reporting, a **reporting endpoint** could be added to collect violations centrally. This would be configured via the `report-to` / `report-uri` directives and backed by either:

- A lightweight Cloudflare Worker that forwards reports to a logging service, or
- A third-party report collection service (e.g. [report-uri.com](https://report-uri.com))

This is an infrastructure decision deferred for now. The console-only approach is sufficient for the current Report-Only observation phase.
