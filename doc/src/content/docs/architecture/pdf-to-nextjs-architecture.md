---
title: PDF Processing Architecture
sidebar_position: 1
---

# PDF Processing Architecture

> **Note**: This document was originally titled "PDF Processing to Next.js Architecture". The app was migrated from Next.js to zfb (Preact islands) in #126, and later to Cloudflare Workers with a root base path (`/`) in issue #211. The PDF processing pipeline is unchanged; the "Application" section reflects the historical zfb migration. URL examples below that use `/manuals/{slug}/...` reflect the former base path — the current paths are `/{slug}/...` served from `manuals.takazudomodular.com`.

## Overview

This document describes the architecture for processing PDF manuals and integrating them with the zfb application. The system supports **multiple manuals** with independent processing pipelines, producing self-contained data for each manual.

## Design Goals

1. **Multi-Manual Support**: Process any number of PDF manuals with identical workflows
2. **Slug-Based Architecture**: All paths computed dynamically from manual slug
3. **Clean Separation**: Clear boundary between PDF processing and zfb app data consumption
4. **Build-Time Bundling**: JSON data imported as ES modules (static generation compatible)
5. **Simple Workflow**: Single command to process entire PDF (`/l-pdf-process {slug}`)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Source PDF                                                   │
│ manual-pdf/{slug}/*.pdf (any filename)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: PDF Processing (Temporary Data)                    │
│                                                              │
│  pdf:split    → temp-processing/{slug}/split-pdf/           │
│                 page-*.pdf                                   │
│  pdf:render   → public/{slug}/pages/page-*.png              │
│  pdf:extract  → temp-processing/{slug}/extracted/           │
│                 page-*.txt                                   │
│  pdf:translate→ temp-processing/{slug}/translations-draft/  │
│                 page-*.json                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Build for zfb app (Final Data)                     │
│                                                              │
│  pdf:build    → public/{slug}/data/pages-ja.json            │
│               → public/{slug}/data/pages-en.json            │
│                                                              │
│  pdf:manifest → public/{slug}/data/manifest.json            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ zfb Application (Data Consumer)                             │
│                                                              │
│  • Imports JSON via manual-registry.ts (ES modules)         │
│  • User selects language (ja/en), loads only that file      │
│  • Serves images from /{slug}/pages/                        │
│  • Renders pages at /{slug}/page/[1-N]                      │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── manual-pdf/                             # SOURCE PDFs only
│   └── {slug}/                             # Per-manual directory
│       └── *.pdf                           # Original PDF file (any filename)
│
├── public/                                 # WEB APP OUTPUT (served to users)
│   └── {slug}/                             # Per-manual data
│       ├── data/                           # JSON data files (COMMITTED)
│       │   ├── manifest.json               # Manual metadata
│       │   ├── pages-ja.json               # Japanese translation (default)
│       │   └── pages-en.json               # Original English text
│       │
│       └── pages/                          # Page images (300 DPI, PNG) (COMMITTED)
│           ├── page-001.png
│           └── ... (page-XXX.png)
│
├── temp-processing/                        # ALL TEMPORARY FILES (GITIGNORED)
│   └── {slug}/                             # Per-manual processing
│       ├── split-pdf/                      # Split page PDFs
│       │   ├── page-001.pdf
│       │   └── ... (page-XXX.pdf)
│       │
│       ├── extracted/                      # Raw English text from PDF
│       │   ├── page-001.txt                #   → pages-en.json
│       │   └── ... (page-XXX.txt)
│       │
│       └── translations-draft/             # Translation drafts
│           ├── page-001.json               #   → pages-ja.json
│           └── ... (page-XXX.json)
│
├── lib/                                    # zfb app data access layer
│   ├── manual-registry.ts                  # Central registry of all manuals
│   ├── manual-data.ts                      # Data access functions
│   ├── manual-config.ts                    # Route/asset path helpers
│   └── types/
│       └── manual.ts                       # TypeScript interfaces
│
└── scripts/
    ├── pdf-split.js                        # Split PDF into pages
    ├── pdf-render-pages.js                 # Render pages to PNG
    ├── pdf-extract-text.js                 # Extract text per page
    ├── pdf-build.js                        # Build pages-ja.json & pages-en.json
    ├── pdf-manifest.js                     # Generate manifest.json
    ├── pdf-clean.js                        # Clean generated files
    └── lib/
        └── pdf-config-resolver.js          # Slug-based path resolution
```

### Directory Purpose Summary

| Directory | Purpose | Git Status |
|-----------|---------|------------|
| `manual-pdf/{slug}/` | Source PDF only | Committed (or gitignored if large) |
| `public/{slug}/` | Final web app output | **Committed** |
| `temp-processing/{slug}/` | All intermediate files | **Gitignored** |

## Currently Supported Manuals

The system currently supports **8 manuals**:

| Slug | Manual | Pages |
|------|--------|-------|
| `oxi-one-mk2` | OXI ONE MKII Manual | 272 |
| `oxi-coral` | OXI Coral Manual | - |
| `oxi-e16-manual` | OXI E16 Manual | - |
| `oxi-e16-quick-start` | OXI E16 Quick Start | - |
| `addac104-tnetw` | ADDAC104 VC T-Networks | 5 |
| `addac106-tnoise` | ADDAC106 T-Noise | - |
| `addac107-acids` | ADDAC107 Acids | - |
| `addac112-looper` | ADDAC112 Looper | - |

## Data Formats

### manifest.json

Metadata file describing the manual.

```json
{
  "title": "OXI ONE MKII: Manual",
  "brand": "OXI Instruments",
  "version": "1.0.0",
  "totalPages": 272,
  "contentPages": 260,
  "lastUpdated": "2026-01-03T16:35:35.555Z",
  "updatedAt": "20260112",
  "source": {
    "filename": "OXI-ONE-MKII-Manual.pdf",
    "processedAt": "2026-01-03T16:35:30.894Z",
    "imageDPI": 300,
    "imageFormat": "png"
  }
}
```

### pages-ja.json (Default)

Japanese translation file. This is what most users need.

```json
{
  "metadata": {
    "processedAt": "2026-01-03T16:55:27.791Z",
    "language": "ja",
    "imageFormat": "png",
    "imageDPI": 300
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/oxi-one-mk2/pages/page-001.png",
      "title": "Page 1",
      "sectionName": null,
      "content": "OXI ONE MKII公式ユーザーマニュアル v1.0",
      "hasContent": true,
      "tags": []
    }
  ]
}
```

### pages-en.json (Optional)

Original English text file. For users who prefer English or want to reference original text.

```json
{
  "metadata": {
    "processedAt": "2026-01-03T16:55:27.791Z",
    "language": "en",
    "imageFormat": "png",
    "imageDPI": 300
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/oxi-one-mk2/pages/page-001.png",
      "title": "Page 1",
      "sectionName": null,
      "content": "OXI ONE MKII Official User Manual v1.0...",
      "hasContent": true,
      "tags": []
    }
  ]
}
```

### Language File Strategy

| File | Purpose | Loaded When |
|------|---------|-------------|
| `pages-ja.json` | Japanese translation (default) | User selects Japanese or no preference |
| `pages-en.json` | Original English text | User explicitly selects English |

**Benefits:**

- **Smaller payload**: Users only load the language they need
- **Faster initial load**: Japanese users don't download English data
- **Clear separation**: Each file is self-contained
- **Easy to add languages**: Future languages follow same pattern

### translations-draft/page-XXX.json (Intermediate)

Per-page translation output from Claude Code subagents. This intermediate format already contains both texts.

```json
{
  "pageNum": 1,
  "originalText": "OXI ONE MKII Official User Manual v1.0...",
  "translation": "OXI ONE MKII公式ユーザーマニュアル v1.0...",
  "metadata": {
    "translatedAt": "2026-01-03T16:35:30.894Z",
    "method": "claude-code-subagent",
    "agent": "manual-translator"
  }
}
```

## Processing Pipeline

### Phase 1: PDF Processing (Temporary Data)

```bash
# 1. Split PDF into individual page PDFs
pnpm run pdf:split --slug oxi-one-mk2
# Output: temp-processing/oxi-one-mk2/split-pdf/page-001.pdf, ...

# 2. Render pages to PNG images at 300 DPI
pnpm run pdf:render --slug oxi-one-mk2
# Output: public/oxi-one-mk2/pages/page-001.png, page-002.png, ...

# 3. Extract text from each page
pnpm run pdf:extract --slug oxi-one-mk2
# Output: temp-processing/oxi-one-mk2/extracted/page-001.txt, ...

# 4. Translate pages to Japanese using Claude Code subagents
pnpm run pdf:translate --slug oxi-one-mk2
# Output: temp-processing/oxi-one-mk2/translations-draft/page-001.json, ...
# Uses 5 parallel workers
# Cost: ~$5-10 per 280-page manual
# Time: 15-30 minutes
```

### Phase 2: Build for zfb app (Final Data)

```bash
# 5. Build pages-ja.json and pages-en.json
pnpm run pdf:build --slug oxi-one-mk2
# Input:  temp-processing/oxi-one-mk2/extracted/page-*.txt
#         temp-processing/oxi-one-mk2/translations-draft/page-*.json
# Output: public/oxi-one-mk2/data/pages-ja.json
#         public/oxi-one-mk2/data/pages-en.json

# 6. Generate manifest.json
pnpm run pdf:manifest --slug oxi-one-mk2
# Output: public/oxi-one-mk2/data/manifest.json
```

### Cleanup (Optional)

After successful build and deploy, temporary files can be deleted:

```bash
# Clean temp files for a specific manual
rm -rf ./temp-processing/oxi-one-mk2/

# Clean ALL temp files
rm -rf ./temp-processing/
```

### Complete Pipeline

```bash
# Process entire manual (all 6 steps)
pnpm run pdf:all --slug oxi-one-mk2

# Or use Claude Code skill (recommended)
/l-pdf-process oxi-one-mk2
```

## Command Reference

### Main Workflow

```bash
# Complete PDF processing (all steps)
pnpm run pdf:all --slug {slug}

# Claude Code skill (same as above but with progress tracking)
/l-pdf-process {slug}

# Clean all generated files
pnpm run pdf:clean --slug {slug}
```

### Individual Steps

All scripts accept `--slug` parameter:

```bash
pnpm run pdf:split --slug {slug}       # Step 1: Split PDF
pnpm run pdf:render --slug {slug}      # Step 2: Render images
pnpm run pdf:extract --slug {slug}     # Step 3: Extract text
pnpm run pdf:translate --slug {slug}   # Step 4: Translate
pnpm run pdf:build --slug {slug}       # Step 5: Build pages.json
pnpm run pdf:manifest --slug {slug}    # Step 6: Generate manifest
```

## Configuration

### pdf-config.json

Global settings for all manuals:

```json
{
  "settings": {
    "imageFormat": "png",
    "imageDPI": 300,
    "translationModel": "claude-sonnet-4-5-20250929",
    "maxRetries": 3,
    "parallelProcessing": false
  }
}
```

### pdf-config-resolver.js

Dynamically computes all paths from slug:

```javascript
// Example resolved config for slug "oxi-one-mk2"
{
  slug: 'oxi-one-mk2',
  sourcePdf: '/root/manual-pdf/oxi-one-mk2/OXI ONE MKII Manual.pdf',
  input: {
    pdfDirectory: 'manual-pdf/oxi-one-mk2',
    pdfPattern: '*.pdf'
  },
  output: {
    // Final output (committed)
    images: 'public/oxi-one-mk2/pages',
    data: 'public/oxi-one-mk2/data',
    // Temporary files (gitignored)
    splitPdf: 'temp-processing/oxi-one-mk2/split-pdf',
    extracted: 'temp-processing/oxi-one-mk2/extracted',
    translationsDraft: 'temp-processing/oxi-one-mk2/translations-draft'
  },
  settings: { /* from pdf-config.json */ }
}
```

**Key features:**

- No hardcoded paths in scripts
- Validates slug format (alphanumeric + hyphens only)
- Finds first PDF file in source directory
- All paths computed from slug

## zfb App Integration

### Manual Registry (lib/manual-registry.ts)

Central hub that imports all manual data at build time:

```typescript
// Explicit imports for each manual
import oxiOneMk2Manifest from '@/public/oxi-one-mk2/data/manifest.json';
import oxiOneMk2Pages from '@/public/oxi-one-mk2/data/pages.json';
import addac104Manifest from '@/public/addac104-tnetw/data/manifest.json';
import addac104Pages from '@/public/addac104-tnetw/data/pages.json';
// ... more manuals

const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    manifest: oxiOneMk2Manifest as unknown as ManualManifest,
    pages: oxiOneMk2Pages as unknown as ManualPagesData,
  },
  'addac104-tnetw': {
    manifest: addac104Manifest as unknown as ManualManifest,
    pages: addac104Pages as unknown as ManualPagesData,
  },
  // ... more manuals
};
```

**Why explicit imports:**

- Required for zfb static site generation
- Type-safe with TypeScript
- Data bundled into HTML at build time
- No runtime fetch needed

### TypeScript Interfaces (lib/types/manual.ts)

```typescript
export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  content: string;         // Text content (language depends on loaded file)
  hasContent: boolean;
  tags?: string[];
}

export interface ManualPagesData {
  metadata: {
    processedAt: string;
    translationMethod: string;
    imageFormat: string;
    imageDPI: number;
  };
  pages: ManualPage[];
}

export interface ManualManifest {
  title: string;
  brand: string;
  version?: string;
  totalPages: number;
  contentPages?: number;
  lastUpdated?: string;
  updatedAt?: string;
  source?: {
    filename: string;
    processedAt: string;
    imageDPI: number;
    imageFormat: string;
  };
}
```

## URL Structure

> **Updated:** The base path changed to `/` in the CF Workers migration (issue #211).
> Current paths use `/{slug}/...` served from `manuals.takazudomodular.com`.

- **Base path:** `/` (configured in `lib/base-path.ts` → `zfb.config.ts`)
- **Manual index:** `/{slug}/`
- **Page viewer:** `/{slug}/page/{pageNum}`

**Examples:**

- `/oxi-one-mk2/` - Manual index
- `/oxi-one-mk2/page/1` - First page
- `/oxi-one-mk2/page/272` - Last page

## Adding a New Manual

1. Create source directory: `mkdir manual-pdf/{new-slug}`
2. Add PDF file (any filename)
3. Process the PDF: `/l-pdf-process {new-slug}`
4. Update `lib/manual-registry.ts` with the new manual's imports and registry entry
5. Build and deploy: `pnpm build`

**Time estimate:** ~30 minutes (translation: 15-30 min, other steps: ~5 min)

## Key Architectural Decisions

1. **Slug-Based Path Resolution** — No hardcoded paths; `pdf-config-resolver.js` computes all paths from slug
2. **Single pages.json File** — All pages in one file per manual; simpler than part-based organization
3. **Manual Registry** — Explicit imports in `lib/manual-registry.ts`; required for static export compatibility
4. **Page-by-Page Processing** — Extract, translate, then build combines into single pages.json
5. **Processing Files are Temporary** — Only `data/` and `pages/` committed to Git; `temp-processing/` is gitignored
6. **Multi-Language Support** — Separate files per language (`pages-ja.json`, `pages-en.json`); users only download what they need
