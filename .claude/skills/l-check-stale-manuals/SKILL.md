---
name: l-check-stale-manuals
description: >-
  Verify committed manual PDFs against the revision each manufacturer currently publishes, and
  propose (or run) refreshes for stale ones. Use when: (1) User says 'check stale manuals', 'verify
  manuals', 'manual sweep', 'staleness check', or asks whether any manual is outdated, (2) A
  manufacturer ships new firmware or a new manual revision for a product we host, (3) A periodic
  re-verification is due (manuals silently drift — a stale one looks healthy from inside the repo),
  (4) Before relying on a manual's content for other work and freshness matters. Covers per-brand
  source URLs, download etiquette, hash/content triage, and the reprocess flows.
---

# Check Stale Manuals

Compare each committed source PDF (`manual-pdf/<slug>/`) against the manufacturer's currently published revision, report verdicts, and propose refreshes. Background: the failure mode is **silent** — issue #286's sweep found 3 of 51 "healthy-looking" manuals a full revision behind (one had drifted for months). Prior art: #280–#283 (RYK), #286/PR #287 (full sweep).

## Step 1: Scope and inventory

Decide scope from the request: one manual, one brand, or everything. Then build the inventory:

```bash
node .claude/skills/l-check-stale-manuals/scripts/build-inventory.mjs [slug ...] > /tmp/inventory.tsv
```

Columns: slug, brand, committed PDF path, sha256, page count, manifest `updatedAt`. Oldest `updatedAt` cohorts are highest-risk.

## Step 2: Locate and download published PDFs

Read **[references/manual-sources.md](references/manual-sources.md)** — the per-manual source registry: product-page URLs, direct PDF/Drive links, per-brand versioning schemes, and access quirks (OXI's Cloudflare challenge, AI Synthesis's Google-Doc exports, Shopify `?v=` stamps, ADDAC's firmware-tied guide lists…). It removes almost all URL research; verify against the live product page rather than trusting a cached deep link blindly.

**The registry is self-maintaining**: manufacturers move files and change CMSes, so whenever a sweep finds a URL dead, moved, or superseded — or discovers a new quirk — update `manual-sources.md` in the same session. A stale registry quietly rots the whole skill.

Download etiquette (small-manufacturer sites — be a polite bot):

- One worker per host, sequential requests, `sleep 2` between; max 2 retries; honor `Retry-After`.
- Browser User-Agent; record final effective URL + HTTP status; `head -c 5` must be `%PDF-` (bot-block pages return HTML with status 200).
- Verify `size_download` against `Content-Length` — slow servers (4ms) can truncate silently under a short `--max-time`.
- Never brute-force guessed filenames; find real links on product pages. Confirm document identity before download: right product, full-manual vs quick-start vs DIY-guide (match the committed doc's type), English edition.

For a multi-brand sweep, spawn one verification agent per brand (parallel across brands = still one worker per host). Give each agent the registry section, its inventory rows, and the triage rules below; have it write a per-brand report table.

## Step 3: Triage — hash mismatch is not staleness

```text
sha256 equal                         → identical            (current; done)
sha256 differs:
  page count + normalized text equal → content-equivalent   (current; re-serialization only —
                                                             ALWAYS the case for AI Synthesis)
  real content differs               → changed              (stale; cite evidence: page delta,
                                                             version strings, diff summary)
  cannot tell (extraction fails …)   → ambiguous            (say so; never guess)
  page/link gone                     → unreachable          (never infer "current" from a dead URL)
```

For mismatches: `node .claude/skills/l-check-stale-manuals/scripts/pdf-page-diff.mjs <committed> <downloaded>` gives page counts + per-page changed-text excerpts. Record the version evidence printed in the PDF (cover revision, firmware version, changelog) — but some brands re-export without bumping anything (OXI), so evidence supplements the diff, never replaces it.

## Step 4: Report and propose

Produce a verdict table (slug, verdict, published revision evidence, source URL) and post it where the work is tracked (issue comment or chat). For each `changed` manual, propose the refresh with:

- The evidence (page delta, what changed, new version string)
- Which refresh flow applies — **surgical** (same page count, few pages changed) or **full** (pages inserted/removed) — per [references/refresh-procedure.md](references/refresh-procedure.md)
- Rough re-translation scope (changed/unmatched page count)

If the user asked only to check, stop here with the proposal. If the session is authorized to fix (autonomous run or user says go), proceed.

## Step 5: Refresh stale manuals

Follow **[references/refresh-procedure.md](references/refresh-procedure.md)** — replace the PDF, re-render, control image churn via pixel-diff, re-translate only changed/unmatched pages (reusing aligned translations), rebuild `pages-ja.json` / `pages-en.json` / contentHtml / search-index / manifest, stamp `updatedAt`.

Translation policy for upstream defects: mirror the published manual verbatim — never invent missing sentences. A manufacturer's half-finished edit ships half-finished (raise an `agent-found` issue to re-check when they fix it). Only OUR extraction artifacts get repaired.

## Scripts

All in `.claude/skills/l-check-stale-manuals/scripts/` (run from repo root; they resolve the repo's `node_modules` themselves):

| script | purpose |
| --- | --- |
| `build-inventory.mjs [slug ...]` | TSV inventory: slug, brand, PDF, sha256, pages, updatedAt |
| `pdf-page-diff.mjs <old> <new>` | Per-page normalized-text diff (triage + surgical-flow page list) |
| `align-pages.mjs <old> <new>` | Page alignment map for page-count changes (translation reuse) |
| `png-diff.mjs <a> <b>` | Pixel-diff ratio (image churn control; ≤0.0005 = render noise) |
| `merge-drafts.mjs <slug> <pages…>` | Surgical merge of translation drafts into pages JSONs |
| `rebuild-json.mjs <slug> <align.json>` | Full rebuild of pages JSONs from alignment + drafts |
