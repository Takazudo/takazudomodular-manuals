# Refreshing a stale manual

Two flows depending on whether the page count changed. Both were proven in PR #287 (oxi-one-mk1 surgical; addac112-looper / addac511-svgen full). Scripts referenced here live in this skill's `scripts/` dir; pipeline commands are the repo's `pnpm run pdf:*` scripts (see `scripts/CLAUDE.md` at the repo root).

Shared first steps:

1. Keep a copy of the OLD committed PDF accessible (it's in git; also the downloaded published file from the check phase is the NEW one).
2. Replace the committed PDF under `manual-pdf/<slug>/`. If the published filename changed (common for firmware-tied brands), `git rm` the old file and add the new one — the pipeline picks up whatever single PDF is in the dir. Note: `git rm` of the dir's last file deletes the directory; `mkdir -p` before copying the new file in.
3. Run the pipeline stages that regenerate images and extracted text:

   ```bash
   pnpm run pdf:split --slug <slug>
   pnpm run pdf:render --slug <slug>            # writes ALL page PNGs to public/<slug>/pages/
   pnpm run thumbs:generate:slug --slug <slug>
   pnpm run pdf:extract --slug <slug>           # per-page text to temp-processing/<slug>/extracted/
   ```

## Image churn control (both flows)

A re-exported PDF re-serializes every page, so re-rendering "modifies" most PNGs even where nothing visibly changed. Committing that noise bloats git history (page PNGs are ~0.5–1 MB each). After rendering, pixel-compare each modified PNG against HEAD and restore the noise:

```bash
SK=.claude/skills/l-check-stale-manuals/scripts
for f in $(git status --porcelain "public/<slug>/pages/" "public/<slug>/thumbs/" | awk '$1=="M" {print $2}'); do
  git show "HEAD:$f" > /tmp/old.png 2>/dev/null || continue   # untracked new pages: keep
  ratio=$(node "$SK/png-diff.mjs" /tmp/old.png "$f" | awk '{print $1}')
  [ "$ratio" = "DIMS-DIFFER" ] && continue
  awk "BEGIN{exit !($ratio <= 0.0005)}" && git checkout -- "$f"
done
```

Ratio ≤ 0.0005 is rendering noise → restore; anything above is a real visual change → keep. When the manual was re-laid-out wholesale (both ADDAC FW2.0 refreshes: every page 5–49%), everything stays — that's correct, don't fight it. When only a few pages changed (oxi-one-mk1: 8 of 161), this cuts ~100 MB of pointless binary churn.

zsh caution: `for k in $LIST` does NOT word-split in zsh — use `case`/`esac` patterns or explicit loops like the one above, never a space-joined keep-list variable.

## Flow A — surgical (page count UNCHANGED)

Use when `pdf-page-diff.mjs <old.pdf> <new.pdf>` shows the same total and only a handful of changed pages.

1. `node scripts/pdf-page-diff.mjs <old> <new>` → list of changed page numbers. Pages can change **visually only** (diagrams) with identical text, so trust the pixel-diff step for images and the text diff for translations — the two lists can differ (oxi-one-mk1: 6 text-changed, 8 visually-changed).
2. Translate each text-changed page with the `manual-translator` agent (one agent per page, parallel):
   - Source: `temp-processing/<slug>/extracted/page-NNN.txt`
   - Output: `temp-processing/<slug>/translations-draft/page-NNN.json` (`mkdir -p` first)
   - Prompt format per `.claude/agents/manual-translator.md` ("Translate page N of … Total pages: T").
3. `node scripts/merge-drafts.mjs <slug> <changed page numbers…>` — merges drafts into `pages-ja.json` / `pages-en.json` in place, stamps `processedAt`.
4. Rebuild derived artifacts (order matters — html before search index):

   ```bash
   pnpm run pdf:md-to-html --slug <slug>
   pnpm run pdf:search-index --slug <slug>
   pnpm run pdf:manifest --slug <slug>
   ```

5. Stamp `updatedAt` in `public/<slug>/data/manifest.json` to today (`YYYYMMDD`) — it's a curated field the manifest script preserves but does not update.

## Flow B — full (page count CHANGED)

Use when pages were inserted/removed (firmware-generation manual updates).

1. `node scripts/align-pages.mjs <old.pdf> <new.pdf> > /tmp/align.json` — maps each new page to its old page by normalized text (page-number footers stripped, greedy in-order). Unmatched pages are the ones needing fresh translation; typically the TOC, front matter, and the genuinely new/rewritten chapters.
2. Translate each unmatched page with `manual-translator` agents (same input/output convention as Flow A step 2).
3. `node scripts/rebuild-json.mjs <slug> /tmp/align.json` — rebuilds both pages JSONs at the new length: aligned pages reuse the old translation + contentHtml verbatim, fresh pages get draft content with empty contentHtml.
4. Derived artifacts + `updatedAt` stamp — same as Flow A steps 4–5.
5. Page count grew → new `page-NNN.png` / `thumb-NNN.png` files appear as untracked; add them. Page count shrank → delete the now-orphaned trailing PNGs/thumbs beyond the new count (the render step does not remove them).

## After either flow

- No registry regen needed unless a slug was added/removed (`lib/zfb-registry.generated.ts` imports per-slug files; content changes don't touch it).
- Quality gates before push: `pnpm check`, `pnpm test:unit`, `pnpm build`.
- Spot-check the changed pages' JA/EN content against the page images (or `/l-verify-translation` for a fuller pass).
- Translation policy for upstream defects: mirror the published manual verbatim — do NOT invent or restore missing sentences (a manufacturer's half-finished edit stays half-finished; raise an `agent-found` issue to re-check later instead). Fix only OUR extraction artifacts (e.g. a side-column footnote merging mid-line and truncating a word — restore what the PDF actually shows).
