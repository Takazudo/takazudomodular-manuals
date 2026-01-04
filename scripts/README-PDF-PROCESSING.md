# PDF Processing Automation

Automated workflow for converting the OXI ONE MKII PDF manual into Next.js application data.

## Overview

This system automates the entire PDF processing pipeline:

```
PDF Manual
  ↓
Split into parts (pdf:split)
  ↓
Render pages to PNG (pdf:render)
  ↓
Extract text (pdf:extract)
  ↓
Translate to Japanese (pdf:translate)
  ↓
Build JSON files (pdf:build)
  ↓
Create manifest (pdf:manifest)
  ↓
Ready for Next.js app!
```

## Quick Start

### 1. Prerequisites

- Node.js 18+ and pnpm installed
- Anthropic API key for translation

### 2. Setup

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Or add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

### 3. Place Your PDF

```bash
# Place your PDF in the manual-pdf directory
cp /path/to/OXI-ONE-MKII-Manual.pdf manual-pdf/
```

### 4. Run the Full Pipeline

```bash
# Option A: Use the Claude Code skill (recommended)
# In Claude Code, type: /apply-pdf-to-app

# Option B: Run manually
pnpm run pdf:all
```

## Individual Scripts

You can run each step individually:

### 1. Split PDF

```bash
pnpm run pdf:split
```

**Input:** `manual-pdf/*.pdf`
**Output:** `manual-pdf/parts/part-01.pdf` through `part-10.pdf`

Splits the main PDF into 10 parts (30 pages each, except part 10 with 32 pages).

### 2. Render Pages

```bash
pnpm run pdf:render
```

**Input:** `manual-pdf/parts/part-*.pdf`
**Output:** `public/manuals/oxi-one-mk2/pages/page-001.png` through `page-272.png`

Renders each PDF page to PNG format at 150 DPI.

**Note:** This step may take 5-10 minutes for 272 pages.

### 3. Extract Text

```bash
pnpm run pdf:extract
```

**Input:** `manual-pdf/pages/page-*.pdf`
**Output:** `public/manuals/oxi-one-mk2/processing/extracted/page-001.txt` through `page-272.txt`

Extracts text content from each PDF page individually (page-by-page processing).

### 4. Translate Text

```bash
pnpm run pdf:translate
```

**Input:** `public/manuals/oxi-one-mk2/processing/extracted/page-*.txt`
**Output:** `public/manuals/oxi-one-mk2/processing/translations-draft/page-*.json`

**⚠️ Requires:** `ANTHROPIC_API_KEY` environment variable

Translates each page individually to Japanese using Claude Code Task subagents.

**Note:**

- Page-by-page processing (272 pages)
- Parallel processing with 5 concurrent subagents
- This step may take 15-30 minutes
- Costs approximately $5-10 per full manual (estimate)
- Uses Claude Sonnet 4.5 model
- Includes retry logic for API failures

### 5. Build JSON Files

```bash
pnpm run pdf:build
```

**Input:** `public/manuals/oxi-one-mk2/processing/translations-draft/page-*.json`

**Output:** `public/manuals/oxi-one-mk2/data/part-01.json` through `part-10.json`

Combines page translations into part JSON files (28 pages per part) for Next.js.

### 6. Create Manifest

```bash
pnpm run pdf:manifest
```

**Input:** `public/manuals/oxi-one-mk2/data/part-*.json`
**Output:** `public/manuals/oxi-one-mk2/data/manifest.json`

Generates a manifest file with metadata about all parts.

## Configuration

Edit `pdf-config.json` to customize:

```json
{
  "source": {
    "pdf": "manual-pdf/OXI-ONE-MKII-Manual.pdf",
    "totalPages": 272
  },
  "output": {
    "pages": "manual-pdf/pages",
    "images": "public/manuals/oxi-one-mk2/pages",
    "extracted": "public/manuals/oxi-one-mk2/processing/extracted",
    "translationsDraft": "public/manuals/oxi-one-mk2/processing/translations-draft",
    "translations": "public/manuals/oxi-one-mk2/data"
  },
  "settings": {
    "pagesPerPart": 28,
    "imageFormat": "png",
    "imageDPI": 150,
    "translationModel": "claude-sonnet-4-5-20250929",
    "maxRetries": 3
  }
}
```

**All paths are relative to repository root**

## Directory Structure

```
manual-oxi-one-mk2/
├── manual-pdf/                                 # Input PDF
│   ├── OXI-ONE-MKII-Manual.pdf                 # Original PDF (place here)
│   ├── pages/                                  # Split page PDFs (gitignored)
│   └── parts/                                  # Split part PDFs (gitignored)
│       ├── part-01.pdf
│       └── ...
├── public/
│   └── manuals/                                # Multi-manual structure
│       └── oxi-one-mk2/                        # OXI ONE MKII manual
│           ├── data/                           # Final JSON (for Next.js)
│           │   ├── manifest.json
│           │   └── part-*.json
│           ├── pages/                          # Rendered page images (150 DPI)
│           │   ├── page-001.png
│           │   └── ... (page-272.png)
│           └── processing/                     # Intermediate files (gitignored)
│               ├── extracted/                  # Extracted text
│               │   ├── page-001.txt
│               │   └── ... (page-272.txt)
│               └── translations-draft/         # Translation drafts
│                   ├── page-001.json
│                   └── ... (page-272.json)
└── scripts/
    ├── pdf-split.js
    ├── pdf-render-pages.js
    ├── pdf-extract-text.js
    ├── pdf-translate-page-by-page.js
    ├── pdf-build.js
    ├── pdf-manifest.js
    ├── pdf-clean.js
    └── migrate-to-multi-manual.js
```

**Multi-Manual Architecture:**

- Each manual is self-contained under `/public/manuals/{manual-id}/`
- Final data (JSON + images) committed to repository
- Processing files are gitignored (can delete after deploy)
- Ready for adding more manuals with same structure

## Error Handling

### Common Issues

**"No PDF found"**

- Ensure PDF is in `manual-pdf/` directory
- Only one PDF should exist in the directory

**"ANTHROPIC_API_KEY not set"**

- Set the environment variable: `export ANTHROPIC_API_KEY=sk-ant-...`

**"Parts directory not found"**

- Run `pnpm run pdf:split` first

**API Rate Limits**

- The translation script includes retry logic with exponential backoff
- If you hit rate limits, wait a few minutes and resume

### Error Reports

Failed translations save error reports to `__inbox/`:

```
__inbox/
└── translation-error-part-XX.json
```

## Performance

**Estimated Times (272-page manual):**

- Split: ~30 seconds
- Render: ~5-10 minutes
- Extract: ~1-2 minutes
- Translate: ~15-30 minutes (page-by-page with 5 parallel subagents)
- Build: ~10 seconds
- Manifest: ~1 second

**Total:** ~20-40 minutes for full pipeline

**Page-by-Page Processing:**

- Each page is processed individually (not in batches)
- 272 pages = 272 separate translation tasks
- Parallel processing with 5 concurrent Claude Code subagents
- More reliable error recovery (can retry individual pages)
- Better progress tracking

## Cost Estimation

Translation costs (using Claude Sonnet 4.5):

- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- Estimated total for 272-page manual: **$5-10**

Actual costs depend on text density and complexity.

**Page-by-Page Processing Benefits:**

- Each page is a separate API call (272 calls total)
- Smaller context per call = more predictable costs
- Failed pages can be retried without re-processing entire parts
- Better cost tracking per page

## Resuming After Failure

If a step fails, you can resume from that step:

```bash
# If translation failed on part 5, you can:
# 1. Fix the issue (e.g., API key, rate limits)
# 2. Re-run just the translation
pnpm run pdf:translate

# Then continue with build and manifest
pnpm run pdf:build
pnpm run pdf:manifest
```

The scripts will skip already-processed files when possible.

## Future Enhancements

- ✅ Basic automation complete
- 🔄 Smart update detection (only process changed pages)
- 🔄 Parallel processing for faster rendering
- 🔄 Translation review workflow
- 🔄 Progress bars and real-time status
- 🔄 Version control for translations

## Troubleshooting

### Canvas/Sharp Installation Issues

If you encounter canvas or sharp installation errors:

```bash
# Reinstall dependencies
pnpm install --force
```

### PDF.js Font Issues

PDF.js requires standard fonts. These are included in the `pdfjs-dist` package.

### Out of Memory

For very large PDFs, you may need to increase Node.js memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm run pdf:render
```

## Support

For issues or questions:

- Check error logs in `__inbox/`
- Review this README
- Check the main CLAUDE.md documentation
- Create a GitHub issue
