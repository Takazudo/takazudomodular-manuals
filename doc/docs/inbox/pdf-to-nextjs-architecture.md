# PDF Processing to Next.js Architecture

## Overview

This document describes the architecture for processing PDF manuals and integrating them with the Next.js application. The system is designed to handle complete PDF updates, ensuring all data is regenerated cleanly when a new manual version is released.

## Design Goals

1. **Complete Rebuild**: When PDF updates, regenerate ALL data (images, translations, metadata)
2. **Clean Separation**: Clear boundary between PDF processing and Next.js data consumption
3. **Atomic Updates**: All-or-nothing approach - either complete success or rollback
4. **Verifiable Output**: Built-in validation to ensure data integrity
5. **Simple Workflow**: Single command to process entire PDF

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Source PDF                                                   │
│ manual-pdf/OXI-ONE-MKII-Manual.pdf (272 pages)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: PDF Processing (Intermediate Data)                 │
│                                                              │
│  pdf:split    → manual-pdf/parts/part-*.pdf                 │
│  pdf:render   → public/manual/pages/page_*.png (300 DPI)    │
│  pdf:extract  → data/extracted/part-*.txt                   │
│  pdf:translate→ data/translations-draft/part-*.json         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Build for Next.js (Final Data)                     │
│                                                              │
│  pdf:build    → data/translations/part-*.json               │
│               → Adds metadata, titles, section info         │
│                                                              │
│  pdf:manifest → data/translations/manifest.json             │
│               → Master index with all parts                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Application (Data Consumer)                         │
│                                                              │
│  • Reads manifest.json at build time                        │
│  • Lazy-loads part JSON files as needed                     │
│  • Serves images from /manual/pages/                        │
│  • Renders pages at /manuals/oxi-one-mk2/page/[1-272]      │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
worktree/
├── manual-pdf/                     # Source PDFs
│   ├── OXI-ONE-MKII-Manual.pdf     # Original PDF (272 pages)
│   └── parts/                      # Split PDFs (intermediate)
│       ├── part-01.pdf             # Pages 1-30
│       ├── part-02.pdf             # Pages 31-60
│       └── ...
│
├── public/manual/pages/            # Page images (served by Next.js)
│   ├── page_001.png                # Global page numbering
│   ├── page_002.png
│   └── ...                         # 272 total images
│
├── data/
│   ├── extracted/                  # Intermediate: Raw text
│   │   ├── part-01.txt
│   │   └── ...
│   │
│   ├── translations-draft/         # Intermediate: Raw translations
│   │   ├── part-01.json
│   │   └── ...
│   │
│   └── translations/               # Final: Next.js consumable data
│       ├── manifest.json           # Master index
│       ├── part-01.json            # Pages 1-30 with full metadata
│       ├── part-02.json            # Pages 31-60 with full metadata
│       └── ...
│
└── scripts/
    ├── pdf-split.js
    ├── pdf-render-pages.js
    ├── pdf-extract-text.js
    ├── pdf-translate.js
    ├── pdf-build.js                # NEW: Build final JSON
    ├── pdf-manifest.js             # NEW: Generate manifest
    ├── pdf-clean.js                # NEW: Clean generated files
    └── pdf-verify.js               # NEW: Validate output
```

## Data Formats

### manifest.json

Master index file that Next.js reads to understand the manual structure.

```json
{
  "title": "OXI ONE MKII Manual",
  "version": "1.0.0",
  "totalPages": 272,
  "lastUpdated": "2026-01-03T00:00:00Z",
  "source": {
    "filename": "OXI-ONE-MKII-Manual.pdf",
    "processedAt": "2026-01-03T00:00:00Z"
  },
  "parts": [
    {
      "part": "01",
      "pageRange": [1, 30],
      "file": "/data/translations/part-01.json",
      "sections": ["Introduction", "Getting Started"]
    },
    {
      "part": "02",
      "pageRange": [31, 60],
      "file": "/data/translations/part-02.json",
      "sections": ["Sequencer Basics"]
    }
  ]
}
```

### part-XX.json

Per-part data file with page-level details.

```json
{
  "part": "01",
  "pageRange": [1, 30],
  "totalPages": 30,
  "metadata": {
    "processedAt": "2026-01-03T00:00:00Z",
    "translationMethod": "claude-code-subagent",
    "imageFormat": "png",
    "imageDPI": 300
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/manual/pages/page_001.png",
      "title": "表紙",
      "sectionName": "表紙・目次",
      "translation": "# OXI ONE MKII Manual\n\n## 表紙\n\n...",
      "hasContent": true,
      "tags": ["cover", "table-of-contents"]
    },
    {
      "pageNum": 2,
      "image": "/manual/pages/page_002.png",
      "title": "ワークフロー 2: 表現力豊かなMonoシーケンサーフレーズ",
      "sectionName": "ワークフロー",
      "translation": "## ワークフロー 2\n\n...",
      "hasContent": true,
      "tags": ["workflow", "mono-sequencer"]
    }
  ]
}
```

### translations-draft/part-XX.json (Intermediate)

Raw translation output before building final format.

```json
{
  "part": "01",
  "pageRange": [1, 30],
  "originalText": "...",
  "translation": "...",
  "metadata": {
    "translatedAt": "2026-01-03T00:00:00Z",
    "method": "claude-code-subagent",
    "agent": "manual-translator",
    "taskId": "a974a4d"
  }
}
```

## Processing Pipeline

### Phase 1: PDF Processing (Intermediate Data)

These steps create intermediate data that will be refined in Phase 2.

```bash
# 1. Split PDF into parts (30 pages each)
pnpm run pdf:split
# Output: manual-pdf/parts/part-01.pdf, part-02.pdf, ...

# 2. Render pages to PNG images at 300 DPI
pnpm run pdf:render
# Output: public/manual/pages/page_001.png, page_002.png, ...

# 3. Extract text from each part
pnpm run pdf:extract
# Output: data/extracted/part-01.txt, part-02.txt, ...

# 4. Translate text to Japanese using subagents
pnpm run pdf:translate
# Output: data/translations-draft/part-01.json, part-02.json, ...
```

### Phase 2: Build for Next.js (Final Data)

These steps transform intermediate data into Next.js-consumable format.

```bash
# 5. Build final part JSON files with metadata
pnpm run pdf:build
# Input:  data/translations-draft/part-*.json
# Output: data/translations/part-01.json, part-02.json, ...
# - Adds page titles, section names, tags
# - Restructures translation text
# - Adds metadata fields

# 6. Generate manifest.json
pnpm run pdf:manifest
# Input:  data/translations/part-*.json
# Output: data/translations/manifest.json
# - Scans all part files
# - Generates master index
# - Calculates totals
```

### Phase 3: Verification (Optional)

```bash
# Verify all generated files
pnpm run pdf:verify
# Checks:
# - All expected files exist
# - JSON structure is valid
# - Image files have correct dimensions
# - Page numbering is continuous
# - No missing translations
```

## Command Reference

### Main Workflow

```bash
# Complete PDF processing (recommended)
pnpm run pdf:all
# Runs: split → render → extract → translate → build → manifest

# Clean all generated files (before reprocessing)
pnpm run pdf:clean
# Removes:
# - public/manual/pages/*
# - data/extracted/*
# - data/translations-draft/*
# - data/translations/*
# - manual-pdf/parts/*
```

### Individual Steps

```bash
pnpm run pdf:split       # Step 1: Split PDF
pnpm run pdf:render      # Step 2: Render images
pnpm run pdf:extract     # Step 3: Extract text
pnpm run pdf:translate   # Step 4: Translate to Japanese
pnpm run pdf:build       # Step 5: Build final JSON
pnpm run pdf:manifest    # Step 6: Generate manifest
pnpm run pdf:verify      # Validation: Check output
```

## Next.js Integration

### How Next.js Consumes the Data

#### 1. At Build Time (Static Site Generation)

```typescript
// lib/manual-data.ts
import manifest from '@/data/translations/manifest.json';

export async function getManifestData() {
  return manifest;
}

export async function getPartData(partNum: string) {
  const partData = await import(`@/data/translations/part-${partNum}.json`);
  return partData;
}

export async function getPageData(pageNum: number) {
  // Find which part contains this page
  const part = manifest.parts.find(
    p => pageNum >= p.pageRange[0] && pageNum <= p.pageRange[1]
  );

  if (!part) return null;

  // Load part data
  const partData = await getPartData(part.part);

  // Find specific page
  const page = partData.pages.find(p => p.pageNum === pageNum);

  return page;
}
```

#### 2. Page Component

```typescript
// app/manuals/oxi-one-mk2/page/[pageNum]/page.tsx
export async function generateStaticParams() {
  const manifest = await getManifestData();

  return Array.from({ length: manifest.totalPages }, (_, i) => ({
    pageNum: String(i + 1),
  }));
}

export default async function ManualPage({
  params
}: {
  params: { pageNum: string }
}) {
  const pageNum = parseInt(params.pageNum);
  const pageData = await getPageData(pageNum);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="manual-page">
      <img
        src={pageData.image}
        alt={`Page ${pageNum}`}
        className="page-image"
      />
      <div className="page-translation">
        <h1>{pageData.title}</h1>
        <MarkdownRenderer content={pageData.translation} />
      </div>
    </div>
  );
}
```

#### 3. Runtime (Client-side Navigation)

When user navigates between pages, Next.js:

1. Uses pre-rendered static pages (fast)
2. Lazy-loads part JSON only when needed
3. Caches loaded parts for subsequent pages in same part

## Update Workflow

### When New PDF Version is Released

```bash
# 1. Place new PDF (overwrites old one)
cp ~/Downloads/OXI-ONE-MKII-Manual-v2.0.pdf \
   manual-pdf/OXI-ONE-MKII-Manual.pdf

# 2. Clean all old generated files
pnpm run pdf:clean

# 3. Process entire PDF (recreate everything)
pnpm run pdf:all

# 4. Verify output
pnpm run pdf:verify

# 5. Test locally
pnpm dev
# Navigate to http://localhost:3100/manuals/oxi-one-mk2/page/1
# Check a few pages to ensure rendering is correct

# 6. Commit and deploy
git add .
git commit -m "docs: update manual to version 2.0"
git push origin main
```

### What Happens During `pdf:all`

```bash
# 1. Split (5 seconds)
Splitting manual-pdf/OXI-ONE-MKII-Manual.pdf...
✓ Created 10 parts (30 pages each)

# 2. Render (2-3 minutes)
Rendering 272 pages at 300 DPI...
✓ Rendered 272 PNG images (total: ~200MB)

# 3. Extract (30 seconds)
Extracting text from 10 parts...
✓ Extracted 10 text files

# 4. Translate (15-30 minutes)
Translating 10 parts using 4 parallel subagents...
Batch 1: parts 01-04 (4 agents in parallel)
Batch 2: parts 05-08 (4 agents in parallel)
Batch 3: parts 09-10 (2 agents in parallel)
✓ Translated 272 pages to Japanese

# 5. Build (10 seconds)
Building final JSON files with metadata...
✓ Created 10 part JSON files

# 6. Manifest (2 seconds)
Generating manifest.json...
✓ Created manifest with 272 pages

# Total time: ~20-35 minutes
```

## Missing Pieces (To Implement)

### 1. pdf:build script

**Purpose**: Transform translation drafts into Next.js-consumable format

**Input**: `data/translations-draft/part-*.json`

**Output**: `data/translations/part-*.json`

**Responsibilities**:

- Parse translation text to extract page titles
- Detect section names from content
- Add page metadata (tags, hasContent flag)
- Restructure JSON for Next.js consumption
- Handle missing translations gracefully

**Implementation**:
```javascript
// scripts/pdf-build.js
// 1. Read all translation-draft files
// 2. For each page in part:
//    - Extract title from first heading
//    - Detect section from content
//    - Add metadata fields
// 3. Write to data/translations/
```

### 2. pdf:manifest script

**Purpose**: Generate master manifest.json

**Input**: `data/translations/part-*.json`

**Output**: `data/translations/manifest.json`

**Responsibilities**:

- Scan all part JSON files
- Extract section information
- Calculate total pages
- Generate master index

**Implementation**:
```javascript
// scripts/pdf-manifest.js
// 1. Read all part JSON files
// 2. Extract metadata from each
// 3. Build manifest structure
// 4. Write manifest.json
```

### 3. pdf:clean script

**Purpose**: Remove all generated files before reprocessing

**Responsibilities**:

- Delete public/manual/pages/*
- Delete data/extracted/*
- Delete data/translations-draft/*
- Delete data/translations/*
- Delete manual-pdf/parts/*
- Keep source PDF in manual-pdf/

**Implementation**:
```javascript
// scripts/pdf-clean.js
// Use rimraf or fs.rm to remove directories
// Recreate empty directories
```

### 4. pdf:verify script

**Purpose**: Validate all generated files

**Checks**:

- All expected files exist
- JSON structure is valid
- Images have correct dimensions (300 DPI)
- Page numbering is continuous
- No missing translations
- manifest.json matches part files

**Implementation**:
```javascript
// scripts/pdf-verify.js
// Check file existence
// Validate JSON schemas
// Check image dimensions
// Verify page count matches
```

### 5. Page Metadata Extraction

**Challenge**: How to determine page titles and section names?

**Options**:

**Option A: Heuristic Parsing**

- Parse first heading from translation markdown
- Use page number patterns to detect sections
- Pros: Fully automated
- Cons: May not be 100% accurate

**Option B: Manual Configuration**

- Create `page-metadata.json` with manual annotations
- Reference during build
- Pros: Accurate, controlled
- Cons: Manual work required

**Option C: Hybrid**

- Auto-extract titles from markdown
- Allow manual overrides via config file
- Pros: Best of both worlds
- Cons: More complex implementation

**Recommended**: Start with Option A, add Option C later if needed

## Error Handling

### During Processing

```bash
# If any step fails, show clear error
❌ Error in pdf:translate (part-05)
   Translation failed: API timeout

   To retry:
   1. Fix the issue
   2. Re-run: pnpm run pdf:translate

   To start over:
   pnpm run pdf:clean && pnpm run pdf:all
```

### Data Validation

```bash
# pdf:verify catches issues
pnpm run pdf:verify

✓ All 272 images exist
✓ All 10 part JSON files valid
✗ Page 145 missing title
✗ Page 203 missing translation

Fix these issues in data/translations/ then re-run verify.
```

## Performance Considerations

### Parallel Processing

```javascript
// pdf-translate.js
// Process 4 parts in parallel
const PARALLEL_AGENTS = 4;

for (let i = 0; i < parts.length; i += PARALLEL_AGENTS) {
  const batch = parts.slice(i, i + PARALLEL_AGENTS);
  await Promise.all(
    batch.map(part => translatePart(part))
  );
}
```

### Caching

- Keep intermediate files (extracted/, translations-draft/)
- Only re-run failed steps
- Allow partial regeneration

```bash
# Only re-translate part-05
pnpm run pdf:translate -- --part=05

# Only re-render images
pnpm run pdf:render
```

## Configuration

### pdf-config.json

Central configuration for all processing:

```json
{
  "settings": {
    "imageDPI": 300,
    "parallelAgents": 4,
    "translationModel": "claude-sonnet-4-5-20250929"
  }
}
```

## Summary

### Key Architectural Decisions

1. **Two-Phase Processing**
   - Phase 1: PDF → Intermediate data
   - Phase 2: Intermediate → Next.js data

2. **Global Page Numbering**
   - Images: `page_001.png` to `page_272.png`
   - Consistent across entire manual

3. **Part-Based Organization**
   - Data split into manageable parts
   - Each part = 30 pages
   - Easy to lazy-load in Next.js

4. **Manifest-Driven**
   - manifest.json is source of truth
   - Next.js reads manifest at build time
   - Client navigates using manifest data

5. **Clean Rebuild**
   - `pdf:clean` removes all generated files
   - `pdf:all` regenerates everything
   - Ensures consistency on updates

### Benefits

- ✅ **Simple Updates**: One command rebuilds everything
- ✅ **Clean Separation**: PDF processing ↔ Next.js consumption
- ✅ **Verifiable**: Built-in validation
- ✅ **Scalable**: Works for any PDF size
- ✅ **Maintainable**: Clear data flow
- ✅ **Type-Safe**: JSON schema validates at build time
