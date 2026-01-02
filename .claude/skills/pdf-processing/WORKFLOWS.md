# PDF Processing Workflows

Detailed documentation for each step in the PDF processing pipeline.

## Step 1: Split PDF (`pdf:split`)

**Purpose:** Divide the main PDF into smaller parts for easier processing.

**Command:** `pnpm run pdf:split`

**Input:** `manual-pdf/*.pdf` (single PDF file)

**Output:** `manual-pdf/parts/part-01.pdf` through `part-10.pdf`

**Configuration:**
```json
{
  "partConfig": {
    "part01": { "pages": 30, "startPage": 1 },
    "part02": { "pages": 30, "startPage": 31 },
    ...
  }
}
```

**What it does:**

- Reads the main PDF from `manual-pdf/` directory
- Splits into 10 parts (30 pages each, except part 10 with 32 pages)
- Uses pdf-lib for PDF manipulation
- Creates output directory if needed

**Time:** ~30 seconds

---

## Step 2: Render Pages (`pdf:render`)

**Purpose:** Convert PDF pages to PNG images for web display.

**Command:** `pnpm run pdf:render`

**Input:** `manual-pdf/parts/part-*.pdf`

**Output:** `public/manual/pages/page_001.png`, `page_002.png`, etc.

**Configuration:**
```json
{
  "settings": {
    "imageDPI": 150,
    "imageFormat": "png"
  }
}
```

**What it does:**

- Processes each PDF part sequentially
- Renders each page using pdfjs-dist + canvas
- Optimizes PNG with sharp
- Global page numbering (page_001, page_002, not per-part)

**Time:** ~5-10 minutes for 280 pages

**Quality:** 150 DPI provides good balance of quality and file size

---

## Step 3: Extract Text (`pdf:extract`)

**Purpose:** Extract raw text content for translation.

**Command:** `pnpm run pdf:extract`

**Input:** `manual-pdf/parts/part-*.pdf`

**Output:** `data/extracted/part-01.txt`, `part-02.txt`, etc.

**What it does:**

- Extracts all text from each PDF part
- Preserves page boundaries
- Adds metadata header (total pages, extraction timestamp)
- Uses pdf-parse library

**Time:** ~1-2 minutes

**Output format:**
```
=== PART 01 ===
Total Pages: 30
Extracted: 2026-01-02T12:34:56.789Z

=== EXTRACTED TEXT ===

[Raw text content here...]
```

---

## Step 4: Translate (`pdf:translate`)

**Purpose:** Translate English text to Japanese using Claude API.

**Command:** `pnpm run pdf:translate`

**Input:** `data/extracted/part-*.txt`

**Output:** `data/translations-draft/part-*.json`

**Requirements:** `ANTHROPIC_API_KEY` environment variable

**Configuration:**
```json
{
  "settings": {
    "translationModel": "claude-sonnet-4-5-20250929",
    "maxRetries": 3
  }
}
```

**What it does:**

- Reads extracted text files
- Sends to Claude API with translation prompt
- Uses technical documentation style (です・ます調)
- Preserves technical terms in English
- Includes retry logic with exponential backoff
- Tracks token usage and cost

**Time:** ~10-20 minutes (depends on API speed)

**Cost:** ~$5-10 for full 280-page manual

**Error handling:**

- Saves error reports to `__inbox/translation-error-part-XX.json`
- Can resume from failed part

**Output format:**
```json
{
  "part": "01",
  "originalText": "...",
  "translation": "...",
  "metadata": {
    "model": "claude-sonnet-4-5-20250929",
    "inputTokens": 12345,
    "outputTokens": 23456,
    "translatedAt": "2026-01-02T12:34:56.789Z"
  }
}
```

---

## Step 5: Build JSON (`pdf:build`)

**Purpose:** Combine all data into final Next.js JSON structure.

**Command:** `pnpm run pdf:build`

**Input:**

- `data/extracted/part-*.txt`
- `data/translations-draft/part-*.json`
- `public/manual/pages/page_*.png`

**Output:** `data/translations/part-01.json` through `part-10.json`

**What it does:**

- Combines extracted text, translations, and image paths
- Creates JSON structure matching Next.js requirements
- Adds metadata and section information
- Can handle missing translations (creates empty structure)

**Time:** ~10 seconds

**Output format:**
```json
{
  "part": "01",
  "totalPages": 30,
  "metadata": {
    "title": "OXI ONE MKII Manual - Part 01",
    "sections": [],
    "translatedAt": "2026-01-02T12:34:56.789Z",
    "translationModel": "claude-sonnet-4-5-20250929"
  },
  "pages": [
    {
      "pageNum": 1,
      "globalPageNum": 1,
      "image": "/manual/pages/page_001.png",
      "title": "Page 1",
      "sectionName": null,
      "translation": "...",
      "hasContent": true
    }
  ]
}
```

---

## Step 6: Create Manifest (`pdf:manifest`)

**Purpose:** Generate manifest.json with metadata about all parts.

**Command:** `pnpm run pdf:manifest`

**Input:** `data/translations/part-*.json`

**Output:** `data/translations/manifest.json`

**What it does:**

- Reads all part JSON files
- Calculates page ranges
- Aggregates metadata
- Creates master index file

**Time:** ~1 second

**Output format:**
```json
{
  "version": "1.0.0",
  "title": "OXI ONE MKII Manual",
  "totalPages": 280,
  "totalParts": 10,
  "parts": [
    {
      "part": "01",
      "title": "OXI ONE MKII Manual - Part 01",
      "file": "/data/translations/part-01.json",
      "totalPages": 30,
      "pageRange": [1, 30],
      "sections": []
    }
  ],
  "metadata": {
    "createdAt": "2026-01-02T12:34:56.789Z",
    "imageFormat": "png",
    "imageDPI": 150,
    "translationModel": "claude-sonnet-4-5-20250929"
  }
}
```

---

## Error Recovery

### Translation Failed

If translation fails on part 5:

1. Check error report: `__inbox/translation-error-part-05.json`
2. Fix issue (API key, rate limits, etc.)
3. Re-run: `pnpm run pdf:translate` (skips completed parts)
4. Continue: `pnpm run pdf:build && pnpm run pdf:manifest`

### Missing Images

If some images are missing or corrupted:

```bash
# Delete existing images
rm -rf ./public/manual/pages/*

# Re-render all pages
pnpm run pdf:render
```

### Configuration Changes

After updating `pdf-config.json`:

```bash
# Re-run from split
pnpm run pdf:all
```

---

## Tips

1. **Test with small PDF first** - Use a 5-10 page PDF to verify workflow
2. **Monitor costs** - Check token usage after each translation
3. **Check __inbox/** - All error reports saved here
4. **Resume capability** - Most scripts skip already-processed files
5. **Parallel processing** - Future enhancement for faster rendering

---

## Troubleshooting

### "No PDF found"

```bash
# Check manual-pdf directory
ls -la manual-pdf/

# Place PDF
cp /path/to/manual.pdf manual-pdf/
```

### "ANTHROPIC_API_KEY not set"

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Or add to .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

### "Parts directory not found"

```bash
# Run split first
pnpm run pdf:split
```

### Canvas/Sharp Installation Issues

```bash
# Reinstall dependencies
pnpm install --force
```

### Out of Memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm run pdf:render
```
