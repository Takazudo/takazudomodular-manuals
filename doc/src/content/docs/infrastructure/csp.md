---
title: Content Security Policy (CSP)
sidebar_position: 3
description: Current Content Security Policy setup for the zmanuals site, including the viewer directive and docs carve-out.
---

# Content Security Policy (CSP)

The zmanuals site (`manuals.takazudomodular.com`) enforces a Content Security Policy via `public/_headers`, which Cloudflare applies at the edge. Rationale for the header values lives here rather than inline in `_headers`.

## Enforced directive (viewer surface `/*`)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-hIolMSvWhopr46DqQi50arv0b3/qeN3LLlH0NTMq3K8='; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

- `script-src`: uses the SHA-256 hash of `LANG_BOOTSTRAP_SCRIPT` (the only inline script, defined as a build-time constant in `layouts/default.tsx`). When a hash is present browsers ignore `'unsafe-inline'`, so no unsafe token is needed.

  The hash was computed from the literal script string:

  ```bash
  printf '%s' "(function(){try{var l=localStorage.getItem('zmanuals:lang');if(l==='en')document.documentElement.setAttribute('data-lang','en');}catch(e){}})();" \
    | openssl dgst -sha256 -binary | base64
  ```

  Result: `sha256-hIolMSvWhopr46DqQi50arv0b3/qeN3LLlH0NTMq3K8=`

- `style-src`: `'unsafe-inline'` is absent. The viewer surface has no inline `style=` attributes or `<style>` elements; Google Fonts is listed as an allowed origin. CSSOM mutations (`element.style.setProperty(...)`) are not governed by `style-src`.

## Docs carve-out (`/doc` + `/doc/*`)

The docs output (built separately, deployed under `/doc/`) contains inline `<script>` and `<style>` elements that the enforced viewer policy would block. Two more-specific rules in `_headers` detach the enforced header for the docs path and substitute a `Content-Security-Policy-Report-Only` directive that allows `'unsafe-inline'`:

```
/doc
  ! Content-Security-Policy
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'

/doc/*
  ! Content-Security-Policy
  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'
```

`! Content-Security-Policy` is the Cloudflare `_headers` detach syntax: the `/*` rule sets the enforced header; these more-specific rules remove it for the docs path and substitute the Report-Only directive. **Two rules are required** — the `/doc/*` glob does not match the exact bare `/doc` URL, so without the separate `/doc` rule the landing page at that URL would fall through to the enforced `/*` policy and break. The exact `/doc` rule must appear first, immediately before the glob.

## Future options

A **reporting endpoint** (`report-to` / `report-uri`) could collect violations centrally instead of console-only, backed by either a lightweight Cloudflare Worker or a third-party service (e.g. [report-uri.com](https://report-uri.com)). The directive currently has no `report-to`/`report-uri`, so violations surface only in each visitor's console.
