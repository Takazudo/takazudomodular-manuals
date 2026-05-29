# Scripts - CLAUDE.md

PDF processing scripts and multi-manual support documentation. For project-wide instructions, see the root `CLAUDE.md`.

## PDF Processing Automation

**Claude Code Skill:** `/l-pdf-process`

Automated workflow for converting PDF manuals into zfb application data using Claude Code Task subagents.

### Important: Maintain the System, Not the Output

Translation output files are **temporary generated files**. What we maintain is the **system itself**:

**Maintain:**

- Translator prompt (`.claude/agents/manual-translator.md`)
- Processing scripts (`scripts/pdf-*.js`)
- Command documentation (`.claude/skills/pdf-process/SKILL.md`)
- Pipeline configuration (`pdf-config.json`)

**Don't maintain (regenerate as needed):**

- `public/oxi-one-mk2/processing/extracted/` - Extracted text files
- `public/oxi-one-mk2/processing/translations-draft/` - Translation work-in-progress
- `public/oxi-one-mk2/data/` - Final JSON output
- `public/oxi-one-mk2/pages/` - Rendered images
- `manual-pdf/pages/` - Split page PDFs
- `manual-pdf/parts/` - Split part PDFs

**When improving translation quality:** Update the translator prompt in `.claude/agents/manual-translator.md`, then regenerate outputs by running the pipeline again.

### Quick Start

```bash
# 1. Place PDF in manual-pdf directory
cp /path/to/OXI-ONE-MKII-Manual.pdf manual-pdf/

# 2. Run full pipeline via Claude Code
# Type: /l-pdf-process
```

Claude Code will execute the pipeline without asking questions during translation.

### PDF Processing Commands

```bash
pnpm run pdf:split               # Split PDF into parts
pnpm run pdf:render              # Render pages to PNG images
pnpm run thumbs:generate:slug    # Generate thumbnails for a single manual (requires --slug)
pnpm run thumbs:generate         # Regenerate thumbnails for ALL manuals (--all)
pnpm run pdf:extract             # Extract text from PDFs
pnpm run pdf:translate           # Translate to Japanese (requires ANTHROPIC_API_KEY)
pnpm run pdf:build               # Build final JSON files
pnpm run pdf:clean-en            # Reformat pages-en.json via the EN cleaner (uses Claude Code CLI, no API key)
pnpm run pdf:clean-en:all        # Clean every manual under public/ at once
pnpm run pdf:md-to-html          # Convert content markdown → contentHtml in pages-{ja,en}.json
pnpm run pdf:md-to-html:all      # Convert markdown for ALL manuals at once
pnpm run pdf:search-index        # Generate search-index.json for keyword search
pnpm run pdf:search-index:all    # Regenerate search-index.json for all manuals at once
pnpm run pdf:manifest            # Create manifest.json
pnpm run pdf:all                 # Run all PDF processing steps (includes thumbnail generation)
```

### Pipeline Overview

The PDF processing pipeline consists of 10 fully automated steps:

1. **Split** - Divides the PDF into parts (30 pages each)
2. **Render** - Converts pages to PNG images at 150 DPI
3. **Thumbnails** - Generates 150px-wide thumbnail images from the rendered pages (`public/<slug>/thumbs/`)
4. **Extract** - Extracts text from each PDF part
5. **Translate** - Translates to Japanese using Claude Code Task subagents (5 concurrent workers). The translator agent now emits `en_clean` (formatted original English) alongside the Japanese `translation`, so `pages-en.json` is already clean after this step.
6. **Build** - Combines data into JSON files for the zfb app. Prefers `translationData.en_clean` over raw extracted text when populating `pages-en.json`.
7. **Clean EN** - Runs `pdf:clean-en` as a belt-and-suspenders pass to guarantee consistent cleanup metadata (`cleanupMethod`, `cleanupModel`, `cleanedAt`) on every page. Because the translator already emits `en_clean` natively, this separate run is typically only needed for retrofits on older manuals or after tweaks to the cleanup prompt (`scripts/lib/en-cleanup-prompt.js`); on a fresh pipeline run it's essentially a no-op over already-clean content.
8. **Markdown → HTML** - Runs `pdf:md-to-html` to convert each page's `content` markdown to `contentHtml` in both `pages-ja.json` and `pages-en.json`. Runs AFTER `pdf:clean-en` so EN html reflects the final cleaned content (in-build conversion would capture pre-clean EN). Mirrors `components/markdown-renderer.tsx`: `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-slug` + `rehype-highlight` + a custom `rehypeWrapTables` (wraps each `<table>` in `<div class="table-wrapper">`) + `rehype-stringify`. Pages with `hasContent === false` get `contentHtml: ""`. See `scripts/pdf-md-to-html.js`.
9. **Search Index** - Reads `pages-ja.json` and emits `search-index.json` (MiniSearch-ready, markdown stripped, body truncated to ~500 chars per page). Invoke with `--slug <manual-slug>`. Also writes a SHA-1 content hash to the sibling `manifest.json` as `searchIndexVersion` for cache busting. The `pdf:search-index:all` variant does the same for every manual at once and is auto-run by `pnpm build`.
10. **Manifest** - Creates manifest.json with metadata

#### Cache busting

`search-index.json` is a static asset that long-lived HTTP caches can happily keep serving after a content change, so we fingerprint it:

- The index generator writes the SHA-1 of the serialized `search-index.json` into the sibling `manifest.json` under `searchIndexVersion`.
- `manifest.json` is imported synchronously at build time via `lib/manual-registry.ts`, so the hash is bundled into the client JS with no extra fetch.
- `SearchDialog` reads `searchIndexVersion` from the registry and appends `?v=<hash>` to the `search-index.json` fetch URL. When the index changes, the query string changes, and the CDN treats it as a new resource.
- Cloudflare Pages includes the query string in its cache key by default, so this works with no `_headers` change on our side.

**Total time:** ~15-30 minutes for a 280-page manual

### Output Structure

```
manual-pdf/
  ├── pages/                                    # Split page PDFs (gitignored)
  └── parts/                                    # Split part PDFs (gitignored)
public/oxi-one-mk2/
  ├── data/                                     # Final JSON files (for the zfb app)
  │   ├── manifest.json
  │   ├── pages.json
  │   └── search-index.json                     # MiniSearch-ready keyword index
  ├── pages/                                    # Rendered PNG images (150 DPI)
  │   ├── page-001.png
  │   └── ... (page-272.png)
  ├── thumbs/                                   # Thumbnail images (150px wide, generated from pages/)
  │   ├── thumb-001.png
  │   └── ... (thumb-272.png)
  └── processing/                               # Intermediate files (gitignored)
      ├── extracted/                            # Extracted text
      └── translations-draft/                   # Translation drafts
```

### Configuration

Edit `pdf-config.json` to customize settings:

- Image DPI and format
- Translation model
- Max retries

### Cost Estimation

Translation using Claude Sonnet 4.5:

- Estimated: $5-10 per full 280-page manual
- Time: 15-30 minutes total

### Error Handling

- Error reports saved to `__inbox/`
- Scripts can be resumed from failed step
- Retry logic for API failures

### Translation Verification

**Claude Code Command:** `/l-verify-translation`

After running the PDF processing pipeline, use this command to verify that translations match the page images.

**What it does:**

1. Starts dev server on port 3100 (if not running)
2. Captures all 30 pages at high resolution (2000x1600) using `capture-all-pages` skill
3. Verifies sample pages (1, 10, 15, 21, 30) for translation accuracy
4. Checks for:
  - Translation is present
  - Page numbers match
  - Content corresponds to image
  - No missing translations
  - No page number mismatches
5. Generates verification report

**Usage:**

```bash
# Ensure dev server is running
pnpm dev

# Run verification command
/l-verify-translation
```

**Output location:** `__inbox/captures-{date}-{session}/`

**Project-Specific Skill:** `capture-all-pages`

This skill captures screenshots of all manual pages at high resolution for visual verification.

- **Resolution:** 2000x1600 (high detail for inspection)
- **Pages:** All 30 pages (or configured total)
- **Output:** `__inbox/captures-{YYYYMMDD}-{session}/`
- **Format:** PNG files named `page-001.png` to `page-030.png`

**Full Documentation:** See `scripts/README-PDF-PROCESSING.md`

## Multi-Manual Support

The system supports multiple PDF manuals with unique slugs. Each manual is self-contained under `/public/{manual-id}/` with its own data, images, and processing files.

### Architecture

**Directory structure per manual:**

```
/manual-pdf/{slug}/              # Source PDF directory
  └── *.pdf                      # Any PDF file (first one found is used)

/public/{slug}/                  # Output directory
  ├── data/                      # Final JSON files (committed)
  │   ├── manifest.json
  │   └── pages.json
  ├── pages/                     # Rendered images (committed)
  │   ├── page-001.png
  │   └── ... (page-XXX.png)
  ├── thumbs/                    # Thumbnail images (committed, generated from pages/)
  │   ├── thumb-001.png
  │   └── ... (thumb-XXX.png)
  └── processing/                # Intermediate files (gitignored)
      ├── extracted/
      └── translations-draft/
```

**URL structure:**

- Base: `/manuals/{slug}/`
- Pages: `/manuals/{slug}/page/{pageNum}`
- Examples:
  - `/manuals/oxi-one-mk2/page/1`
  - `/manuals/oxi-coral/page/1`

### Adding a New Manual

1. **Create source directory:**
   ```bash
   mkdir manual-pdf/{slug}
   ```

2. **Add PDF file** (any filename works):
   ```bash
   cp ~/path/to/manual.pdf manual-pdf/{slug}/
   ```

3. **Process the PDF:**
   ```bash
   /l-pdf-process {slug}
   ```
   This runs all 10 pipeline steps: split, render, thumbnails, extract, translate, build, clean-en, md-to-html, search-index, manifest.

4. **Update manual registry** (`lib/manual-registry.ts`):

   Add imports for the new manual:
   ```typescript
   import newManualManifest from '@/public/new-manual/data/manifest.json';
   import newManualPages from '@/public/new-manual/data/pages.json';

   const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
     'new-manual': {
       manifest: newManualManifest as unknown as ManualManifest,
       pages: newManualPages as unknown as ManualPagesData,
     },
   };
   ```

   **Why explicit imports?** Type safety, build-time bundling, compatible with zfb static site generation.

5. **Build and deploy:**
   ```bash
   pnpm build
   ```

### Processing Multiple Manuals

All PDF processing scripts accept a `--slug` parameter:

```bash
# Process specific manual
pnpm run pdf:all --slug oxi-one-mk2
pnpm run pdf:all --slug oxi-coral

# Individual steps
pnpm run pdf:split --slug oxi-coral
pnpm run pdf:render --slug oxi-coral
pnpm run thumbs:generate:slug --slug oxi-coral   # Generate thumbnails (after render)
pnpm run pdf:extract --slug oxi-coral
pnpm run pdf:translate --slug oxi-coral
pnpm run pdf:build --slug oxi-coral
pnpm run pdf:md-to-html --slug oxi-coral
pnpm run pdf:search-index --slug oxi-coral
pnpm run pdf:manifest --slug oxi-coral
```

**Configuration:**

- All paths computed from slug (no config files needed)
- Source PDF: `/manual-pdf/{slug}/*.pdf` (first PDF found)
- Output: `/public/{slug}/`
- Settings: `pdf-config.json` (shared across all manuals)

### Important Notes

**Manual Registry is Manual:**

- The registry (`lib/manual-registry.ts`) requires explicit imports for each manual
- This is NOT automatic - you must add imports for each new manual
- The build will fail if imports are missing
- This ensures type safety and build-time optimization

**Processing Files are Temporary:**

- Only `data/` and `pages/` directories are committed
- `processing/` directory is gitignored
- Can delete processing files after successful deploy

**Backward Compatibility:**

- Existing manual URLs unchanged: `/manuals/oxi-one-mk2/page/1`
- Each manual is independent
- No conflicts between manuals

## Data Structure

Each manual has two JSON files: manifest.json (metadata) and pages.json (all pages).

### Data Directory

```
/public/oxi-one-mk2/data/
├── manifest.json         # Master index with metadata
└── pages.json            # All pages in single array
```

### How Data is Loaded

**Build-time import (Current Approach):**

- JSON files imported as ES modules in `lib/manual-registry.ts`
- Data bundled into HTML at build time
- Compatible with zfb static site generation
- Fast page loads (no runtime fetch)

```typescript
// lib/manual-registry.ts
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import oxiOneMk2Pages from '@/public/oxi-one-mk2/data/pages.json';
```

### Manifest Format (`manifest.json`)

```json
{
  "title": "OXI ONE MKII: Manual",
  "brand": "OXI Instruments",
  "version": "1.0.0",
  "totalPages": 272,
  "contentPages": 260,
  "lastUpdated": "2026-01-12T...",
  "source": {
    "filename": "OXI-ONE-MKII-Manual.pdf",
    "processedAt": "2026-01-12T...",
    "imageDPI": 300,
    "imageFormat": "png"
  }
}
```

### Pages Format (`pages-ja.json` / `pages-en.json`)

```json
{
  "metadata": {
    "processedAt": "2026-01-12T...",
    "translationMethod": "claude-code-subagent-page-by-page",
    "imageFormat": "png",
    "imageDPI": 300
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/oxi-one-mk2/pages/page-001.png",
      "title": "Page 1",
      "sectionName": null,
      "content": "# Markdown content here...",
      "contentHtml": "<h1 id=\"markdown-content-here\">Markdown content here...</h1>",
      "hasContent": true,
      "tags": []
    }
  ]
}
```

**`contentHtml` field** (added by `pdf:md-to-html` step):

- Present on every page object in both `pages-ja.json` and `pages-en.json`.
- Contains the `content` field converted to HTML using the unified pipeline: `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-slug` + `rehype-highlight` + `rehype-stringify`.
- Empty string (`""`) when `hasContent === false`.
- Heading elements get `id` attributes from `rehype-slug` (e.g., `<h2 id="section-name">`).
- Fenced code blocks get `hljs` CSS classes from `rehype-highlight` (e.g., `<code class="hljs language-js">`). The highlight namespace is **`hljs`** (not syntect) — the prose theme CSS targets `.hljs` / `.hljs-*`.
- Each `<table>` is wrapped in `<div class="table-wrapper">` (custom `rehypeWrapTables` step) so wide GFM tables can scroll, mirroring the React `Table` component. Per-table wrapping happens here because a page can hold multiple tables and the island can only wrap the whole blob.
- GFM tables, strikethrough, and task lists are supported via `remark-gfm`.
- Sub 4's island injects this HTML via `dangerouslySetInnerHTML` — the client ships zero markdown JS. The island adds the outer `.zd-prose` wrapper on its container; `.zd-prose` is NOT baked into `contentHtml`. Prose CSS should scope under `.zd-prose` and `.zd-prose .table-wrapper`.
- Structural deviations from react-markdown's custom `components/markdown/*`: no Tailwind classNames on elements, `<h2>`/`<h3>` lack decorative spans, `<a>` lacks `target="_blank"`. The prose CSS targets raw HTML elements.
