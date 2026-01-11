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
│  pdf:render   → public/oxi-one-mk2/pages/page-*.png │
│  pdf:extract  → public/oxi-one-mk2/processing/      │
│                 extracted/page-*.txt                         │
│  pdf:translate→ public/oxi-one-mk2/processing/      │
│                 translations-draft/page-*.json               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Build for Next.js (Final Data)                     │
│                                                              │
│  pdf:build    → public/oxi-one-mk2/data/part-*.json│
│               → Combines pages, adds metadata               │
│                                                              │
│  pdf:manifest → public/oxi-one-mk2/data/           │
│                 manifest.json                                │
│               → Master index with all parts                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Application (Data Consumer)                         │
│                                                              │
│  • Imports JSON at build time (ES modules)                  │
│  • Data bundled into HTML (static export)                   │
│  • Serves images from /manuals/oxi-one-mk2/pages/          │
│  • Renders pages at /manuals/oxi-one-mk2/page/[1-272]      │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── manual-pdf/                             # Source PDFs
│   ├── OXI-ONE-MKII-Manual.pdf             # Original PDF (272 pages)
│   ├── pages/                              # Split page PDFs (gitignored)
│   └── parts/                              # Split part PDFs (gitignored)
│
├── public/                         # Multi-manual structure
│   └── oxi-one-mk2/                        # OXI ONE MKII manual
│       ├── data/                           # Final: Next.js consumable data
│       │   ├── manifest.json               # Master index
│       │   ├── part-01.json                # Pages 1-28 with full metadata
│       │   ├── part-02.json                # Pages 29-56 with full metadata
│       │   └── ... (part-10.json)          # Pages 245-272
│       │
│       ├── pages/                          # Page images (150 DPI, PNG)
│       │   ├── page-001.png                # Global page numbering
│       │   ├── page-002.png
│       │   └── ... (page-272.png)
│       │
│       └── processing/                     # Intermediate files (gitignored)
│           ├── extracted/                  # Raw text from PDF
│           │   ├── page-001.txt
│           │   └── ... (page-272.txt)
│           │
│           └── translations-draft/         # Raw translations
│               ├── page-001.json
│               └── ... (page-272.json)
│
└── scripts/
    ├── pdf-split.js
    ├── pdf-render-pages.js
    ├── pdf-extract-text.js
    ├── pdf-translate-page-by-page.js
    ├── pdf-build.js                        # Build final JSON from drafts
    ├── pdf-manifest.js                     # Generate manifest
    ├── pdf-clean.js                        # Clean generated files
    └── migrate-to-multi-manual.js          # Migration script
```

**Multi-Manual Architecture:**

- Each manual is self-contained under `/public/{manual-id}/`
- Final data (JSON + images) committed to repository
- Processing files are gitignored (can delete after deploy)
- Ready for adding more manuals with same structure

**Page-by-Page Processing:**

- Extract text per page (not per part) → `page-001.txt`
- Translate each page individually → `page-001.json`
- Build combines pages into parts → `part-01.json` (28 pages each)

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
  "pageRange": [1, 28],
  "totalPages": 28,
  "metadata": {
    "processedAt": "2025-01-05T00:00:00Z",
    "translationMethod": "claude-code-subagent-page-by-page",
    "imageFormat": "png",
    "imageDPI": 150
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/manuals/oxi-one-mk2/pages/page-001.png",
      "title": "Page 1",
      "sectionName": null,
      "translation": "# OXI ONE MKII Manual\n\n## 表紙\n\n...",
      "hasContent": true,
      "tags": []
    },
    {
      "pageNum": 2,
      "image": "/manuals/oxi-one-mk2/pages/page-002.png",
      "title": "Page 2",
      "sectionName": null,
      "translation": "## ワークフロー 2\n\n...",
      "hasContent": true,
      "tags": []
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
# - public/oxi-one-mk2/pages/*
# - public/oxi-one-mk2/processing/extracted/*
# - public/oxi-one-mk2/processing/translations-draft/*
# - public/oxi-one-mk2/data/*
# - manual-pdf/pages/*
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

#### 1. Build-Time Data Import (Static Export Compatible)

```typescript
// lib/manual-data.ts
import manifestDataRaw from '@/public/oxi-one-mk2/data/manifest.json';
import part01DataRaw from '@/public/oxi-one-mk2/data/part-01.json';
import part02DataRaw from '@/public/oxi-one-mk2/data/part-02.json';
// ... part-03 through part-10

// Type-safe wrappers
const manifestData = manifestDataRaw as unknown as ManualManifest;
const part01Data = part01DataRaw as unknown as ManualPart;
// ... part-02 through part-10

// Part data mapping
const partDataMap: Record<string, ManualPart> = {
  '01': part01Data,
  '02': part02Data,
  // ... 03 through 10
};

export function getManifest(): ManualManifest {
  return manifestData;
}

export function getManualPart(partNum: string): ManualPart {
  const partData = partDataMap[partNum];
  if (!partData) {
    throw new Error(`Manual part ${partNum} not found`);
  }
  return partData;
}

export function getManualPage(pageNum: number): ManualPage | null {
  // Find which part contains this page
  const partInfo = getPartInfoForPage(pageNum);
  if (!partInfo) return null;

  // Load the part data
  const part = getManualPart(partInfo.part);

  // Find the page within the part
  const page = part.pages.find(p => p.pageNum === pageNum);
  return page || null;
}
```

**Why Build-Time Imports:**

- ✅ Compatible with Next.js static export (`output: 'export'`)
- ✅ Data bundled into HTML at build time (no runtime fetch)
- ✅ Fast page loads (no network requests)
- ✅ Works offline after initial load

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

### 1. pdf:build script ✅ IMPLEMENTED

**Purpose**: Combine page-by-page translations into part JSON files

**Location**: `scripts/pdf-build.js`

**Input**: `public/oxi-one-mk2/processing/translations-draft/page-*.json`

**Output**: `public/oxi-one-mk2/data/part-*.json`

**Responsibilities**:

- Read all page translation drafts (page-001.json to page-272.json)
- Group pages into parts (28 pages per part)
- Add metadata fields for each page
- Build part JSON structure with all pages
- Handle missing translations gracefully

**Status**: ✅ Fully implemented, page-by-page processing

### 2. pdf:manifest script ✅ IMPLEMENTED

**Purpose**: Generate master manifest.json

**Location**: `scripts/pdf-manifest.js`

**Input**: `public/oxi-one-mk2/data/part-*.json`

**Output**: `public/oxi-one-mk2/data/manifest.json`

**Responsibilities**:

- Scan all part JSON files
- Extract page ranges and metadata
- Calculate total pages
- Generate master index with part information

**Status**: ✅ Fully implemented

### 3. pdf:clean script ✅ IMPLEMENTED

**Purpose**: Remove all generated files before reprocessing

**Location**: `scripts/pdf-clean.js`

**Responsibilities**:

- Delete public/oxi-one-mk2/pages/*
- Delete public/oxi-one-mk2/processing/extracted/*
- Delete public/oxi-one-mk2/processing/translations-draft/*
- Delete public/oxi-one-mk2/data/*
- Delete manual-pdf/pages/*
- Delete manual-pdf/parts/*
- Keep source PDF in manual-pdf/
- Recreate empty directories for next processing

**Status**: ✅ Fully implemented, using paths from pdf-config.json

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
  "source": {
    "pdf": "manual-pdf/OXI-ONE-MKII-Manual.pdf",
    "totalPages": 272
  },
  "output": {
    "pages": "manual-pdf/pages",
    "images": "public/oxi-one-mk2/pages",
    "extracted": "public/oxi-one-mk2/processing/extracted",
    "translationsDraft": "public/oxi-one-mk2/processing/translations-draft",
    "translations": "public/oxi-one-mk2/data"
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

**Output paths are all relative to repository root**

## Summary

### Key Architectural Decisions

1. **Multi-Manual Architecture**
   - Each manual self-contained under `/public/{manual-id}/`
   - Organized by manual ID (e.g., `oxi-one-mk2`)
   - Ready for adding more manuals with same structure
   - Processing files gitignored (`processing/` subdirectory)

2. **Build-Time Data Import**
   - JSON files imported as ES modules at build time
   - Data bundled into HTML (no runtime fetch)
   - Compatible with Next.js static export (`output: 'export'`)
   - Fast page loads, works offline

3. **Page-by-Page Processing**
   - Extract text per page (`page-001.txt` to `page-272.txt`)
   - Translate each page individually (`page-001.json` to `page-272.json`)
   - Build combines pages into parts (28 pages per part)
   - Enables parallel translation with Claude Code subagents

4. **Global Page Numbering**
   - Images: `page-001.png` to `page-272.png`
   - Translations: `page-001.json` to `page-272.json`
   - Consistent across entire manual

5. **Part-Based Organization**
   - Data split into manageable parts (28 pages each)
   - Parts: `part-01.json` (pages 1-28) to `part-10.json` (pages 245-272)
   - Imported at build time, not lazy-loaded

6. **Manifest-Driven**
   - manifest.json is source of truth
   - Next.js imports manifest at build time
   - Contains metadata for all parts and pages

7. **Clean Rebuild**
   - `pdf:clean` removes all generated files
   - `pdf:all` regenerates everything
   - Ensures consistency on updates
   - Processing files can be deleted after successful deploy

### Benefits

- ✅ **Multi-Manual Ready**: Easy to add more manuals with same structure
- ✅ **Self-Contained**: All manual data in one location per manual
- ✅ **Simple Updates**: One command rebuilds everything
- ✅ **Clean Separation**: PDF processing ↔ Next.js consumption
- ✅ **Static Export Compatible**: Build-time imports work with static export
- ✅ **Fast Performance**: No runtime fetch, data bundled at build time
- ✅ **Scalable**: Works for any PDF size, page-by-page processing
- ✅ **Maintainable**: Clear data flow, centralized configuration
- ✅ **Type-Safe**: TypeScript types for all data structures
- ✅ **Parallel Processing**: Multiple Claude Code subagents for translation
- ✅ **Clean Deployment**: Processing files can be deleted after deploy
