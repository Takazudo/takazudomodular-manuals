# PDF Processing to Next.js Architecture

## Overview

This document describes the architecture for processing PDF manuals and integrating them with the Next.js application. The system supports **multiple manuals** with independent processing pipelines, producing self-contained data for each manual.

## Design Goals

1. **Multi-Manual Support**: Process any number of PDF manuals with identical workflows
2. **Slug-Based Architecture**: All paths computed dynamically from manual slug
3. **Clean Separation**: Clear boundary between PDF processing and Next.js data consumption
4. **Build-Time Bundling**: JSON data imported as ES modules (static export compatible)
5. **Simple Workflow**: Single command to process entire PDF (`/pdf-process {slug}`)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Source PDF                                                   │
│ manual-pdf/{slug}/*.pdf (any filename)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: PDF Processing (Intermediate Data)                 │
│                                                              │
│  pdf:split    → manual-pdf/{slug}/pages/page-*.pdf          │
│  pdf:render   → public/{slug}/pages/page-*.png              │
│  pdf:extract  → public/{slug}/processing/extracted/         │
│                 page-*.txt                                   │
│  pdf:translate→ public/{slug}/processing/translations-draft/│
│                 page-*.json                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Build for Next.js (Final Data)                     │
│                                                              │
│  pdf:build    → public/{slug}/data/pages.json               │
│               → Combines all pages with translations        │
│                                                              │
│  pdf:manifest → public/{slug}/data/manifest.json            │
│               → Metadata about the manual                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Application (Data Consumer)                         │
│                                                              │
│  • Imports JSON via manual-registry.ts (ES modules)         │
│  • Data bundled into HTML at build time                     │
│  • Serves images from /manuals/{slug}/pages/                │
│  • Renders pages at /manuals/{slug}/page/[1-N]              │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── manual-pdf/                             # Source PDFs
│   └── {slug}/                             # Per-manual directory
│       ├── *.pdf                           # Source PDF (any filename)
│       └── pages/                          # Split page PDFs (gitignored)
│           ├── page-001.pdf
│           └── ... (page-XXX.pdf)
│
├── public/                                 # Output directory
│   └── {slug}/                             # Per-manual data
│       ├── data/                           # Final: Next.js consumable data
│       │   ├── manifest.json               # Manual metadata
│       │   └── pages.json                  # All pages with translations
│       │
│       ├── pages/                          # Page images (300 DPI, PNG)
│       │   ├── page-001.png
│       │   └── ... (page-XXX.png)
│       │
│       └── processing/                     # Intermediate files (gitignored)
│           ├── extracted/                  # Raw text from PDF
│           │   ├── page-001.txt
│           │   └── ... (page-XXX.txt)
│           │
│           └── translations-draft/         # Translation drafts
│               ├── page-001.json
│               └── ... (page-XXX.json)
│
├── lib/                                    # Next.js data access layer
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
    ├── pdf-build.js                        # Build pages.json
    ├── pdf-manifest.js                     # Generate manifest.json
    ├── pdf-clean.js                        # Clean generated files
    └── lib/
        └── pdf-config-resolver.js          # Slug-based path resolution
```

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

### pages.json

Single file containing all pages with translations.

```json
{
  "metadata": {
    "processedAt": "2026-01-03T16:55:27.791Z",
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
      "translation": "OXI ONE MKII公式ユーザーマニュアル v1.0",
      "hasContent": true,
      "tags": []
    },
    {
      "pageNum": 2,
      "image": "/oxi-one-mk2/pages/page-002.png",
      "title": "Page 2",
      "sectionName": null,
      "translation": "",
      "hasContent": false,
      "tags": []
    }
  ]
}
```

### translations-draft/page-XXX.json (Intermediate)

Per-page translation output from Claude Code subagents.

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

### Phase 1: PDF Processing (Intermediate Data)

```bash
# 1. Split PDF into individual page PDFs
pnpm run pdf:split --slug oxi-one-mk2
# Output: manual-pdf/oxi-one-mk2/pages/page-001.pdf, page-002.pdf, ...

# 2. Render pages to PNG images at 300 DPI
pnpm run pdf:render --slug oxi-one-mk2
# Output: public/oxi-one-mk2/pages/page-001.png, page-002.png, ...

# 3. Extract text from each page
pnpm run pdf:extract --slug oxi-one-mk2
# Output: public/oxi-one-mk2/processing/extracted/page-001.txt, ...

# 4. Translate pages to Japanese using Claude Code subagents
pnpm run pdf:translate --slug oxi-one-mk2
# Output: public/oxi-one-mk2/processing/translations-draft/page-001.json, ...
# Uses 5 parallel workers
# Cost: ~$5-10 per 280-page manual
# Time: 15-30 minutes
```

### Phase 2: Build for Next.js (Final Data)

```bash
# 5. Build pages.json from translation drafts
pnpm run pdf:build --slug oxi-one-mk2
# Input:  public/oxi-one-mk2/processing/translations-draft/page-*.json
# Output: public/oxi-one-mk2/data/pages.json

# 6. Generate manifest.json
pnpm run pdf:manifest --slug oxi-one-mk2
# Input:  public/oxi-one-mk2/data/pages.json
# Output: public/oxi-one-mk2/data/manifest.json
```

### Complete Pipeline

```bash
# Process entire manual (all 6 steps)
pnpm run pdf:all --slug oxi-one-mk2

# Or use Claude Code skill (recommended)
/pdf-process oxi-one-mk2
```

## Command Reference

### Main Workflow

```bash
# Complete PDF processing (all steps)
pnpm run pdf:all --slug {slug}

# Claude Code skill (same as above but with progress tracking)
/pdf-process {slug}

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
    pages: 'manual-pdf/oxi-one-mk2/pages',
    images: 'public/oxi-one-mk2/pages',
    extracted: 'public/oxi-one-mk2/processing/extracted',
    translationsDraft: 'public/oxi-one-mk2/processing/translations-draft',
    translations: 'public/oxi-one-mk2/data'
  },
  settings: { /* from pdf-config.json */ }
}
```

**Key features:**

- No hardcoded paths in scripts
- Validates slug format (alphanumeric + hyphens only)
- Finds first PDF file in source directory
- All paths computed from slug

## Next.js Integration

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

// Exported functions
export function getManifest(manualId: string): ManualManifest;
export function getPagesData(manualId: string): ManualPagesData;
export function getAvailableManuals(): string[];
export function isValidManual(manualId: string): boolean;
```

**Why explicit imports:**

- Required for Next.js static export (`output: 'export'`)
- Type-safe with TypeScript
- Data bundled into HTML at build time
- No runtime fetch needed

### Data Access Layer (lib/manual-data.ts)

Wrapper around registry with utility functions:

```typescript
// Get manifest for a manual
export function getManifest(manualId: string): ManualManifest;

// Get all pages (cached per manual)
export function getAllPages(manualId: string): ManualPage[];

// Get single page
export function getManualPage(manualId: string, pageNum: number): ManualPage | null;

// Get total page count
export function getTotalPages(manualId: string): number;

// Check if page exists
export function pageExists(manualId: string, pageNum: number): boolean;

// For generateStaticParams()
export function getAllPageNumbers(manualId: string): number[];
```

### TypeScript Interfaces (lib/types/manual.ts)

```typescript
export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  translation: string;
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

### Page Component

```typescript
// app/[manualId]/page/[pageNum]/page.tsx

export async function generateStaticParams() {
  const manuals = getAvailableManuals();
  const params = [];

  for (const manualId of manuals) {
    const totalPages = getTotalPages(manualId);
    for (let i = 1; i <= totalPages; i++) {
      params.push({ manualId, pageNum: String(i) });
    }
  }

  return params;
}

export default async function ManualPage({
  params
}: {
  params: Promise<{ manualId: string; pageNum: string }>
}) {
  const { manualId, pageNum: pageNumStr } = await params;
  const pageNum = parseInt(pageNumStr);

  if (!isValidManual(manualId)) {
    notFound();
  }

  const pageData = getManualPage(manualId, pageNum);
  if (!pageData) {
    notFound();
  }

  return (
    <div className="manual-page">
      <img src={pageData.image} alt={`Page ${pageNum}`} />
      <div className="translation">
        <MarkdownRenderer content={pageData.translation} />
      </div>
    </div>
  );
}
```

## Adding a New Manual

### Step-by-Step Workflow

1. **Create source directory:**

   ```bash
   mkdir manual-pdf/{new-slug}
   ```

2. **Add PDF file** (any filename):

   ```bash
   cp ~/path/to/manual.pdf manual-pdf/{new-slug}/
   ```

3. **Process the PDF:**

   ```bash
   /pdf-process {new-slug}
   ```

4. **Update manual registry** (`lib/manual-registry.ts`):

   ```typescript
   // Add imports
   import newManualManifest from '@/public/new-slug/data/manifest.json';
   import newManualPages from '@/public/new-slug/data/pages.json';

   // Add to registry
   const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
     // ... existing manuals
     'new-slug': {
       manifest: newManualManifest as unknown as ManualManifest,
       pages: newManualPages as unknown as ManualPagesData,
     },
   };
   ```

5. **Build and deploy:**

   ```bash
   pnpm build
   ```

**Time estimate:** ~30 minutes (translation: 15-30 min, other steps: ~5 min)

## Update Workflow

### When New PDF Version is Released

```bash
# 1. Place new PDF (overwrites old one)
cp ~/Downloads/Manual-v2.0.pdf manual-pdf/{slug}/

# 2. Clean old generated files
pnpm run pdf:clean --slug {slug}

# 3. Process entire PDF
/pdf-process {slug}

# 4. Test locally
pnpm dev
# Navigate to http://localhost:3100/manuals/{slug}/page/1

# 5. Commit and deploy
git add .
git commit -m "docs: update {slug} manual to version 2.0"
git push origin main
```

## Git Ignore Strategy

**Committed to Git:**

- `/public/{slug}/data/` - Final JSON files (manifest.json, pages.json)
- `/public/{slug}/pages/` - Rendered PNG images
- `/lib/` - Data loading code
- `/scripts/` - Processing scripts

**Gitignored (Temporary):**

- `/manual-pdf/{slug}/pages/` - Split page PDFs
- `/public/{slug}/processing/` - Intermediate files
- `/__inbox/` - Temporary reports
- `/.next/`, `/out/` - Build outputs

## File Naming Conventions

### Page Files

- **PDFs:** `page-001.pdf`, `page-002.pdf`, ... (zero-padded, 3 digits)
- **PNG Images:** `page-001.png`, `page-002.png`, ...
- **Text:** `page-001.txt`, `page-002.txt`, ...
- **Translations:** `page-001.json`, `page-002.json`, ...

### Manual Slugs

- **Format:** Lowercase with hyphens (e.g., `oxi-one-mk2`, `addac104-tnetw`)
- **Validation:** Alphanumeric + hyphens only
- **Used in:** Directory names, URLs, registry keys

## URL Structure

- **Base path:** `/manuals/` (configured in `next.config.js`)
- **Manual index:** `/manuals/{slug}/`
- **Page viewer:** `/manuals/{slug}/page/{pageNum}`

**Examples:**

- `/manuals/oxi-one-mk2/` - Manual index
- `/manuals/oxi-one-mk2/page/1` - First page
- `/manuals/oxi-one-mk2/page/272` - Last page

## Error Handling

### During Processing

```bash
# If translation fails
❌ Error in pdf:translate (page-145)
   Translation failed: API timeout

   To retry:
   1. Re-run: pnpm run pdf:translate --slug {slug}

   To start over:
   pnpm run pdf:clean --slug {slug} && /pdf-process {slug}
```

### Error Reports

Error reports are saved to `__inbox/` with timestamps:

- `__inbox/translation-errors-2026-01-12-14-30-00.json`

## Performance

### Translation Performance

- **Model:** Claude Sonnet 4.5
- **Workers:** 5 parallel subagents
- **Cost:** ~$5-10 per 280-page manual
- **Time:** 15-30 minutes total

### Image Rendering

- **DPI:** 300 (high quality)
- **Format:** PNG
- **Size:** ~200MB for 272 pages

## Summary

### Key Architectural Decisions

1. **Slug-Based Path Resolution**
   - No hardcoded paths in scripts
   - `pdf-config-resolver.js` computes all paths from slug
   - Supports any number of manuals

2. **Single pages.json File**
   - All pages in one file per manual
   - Simpler than part-based organization
   - Imported as ES module at build time

3. **Manual Registry**
   - Explicit imports in `lib/manual-registry.ts`
   - Required for static export compatibility
   - Type-safe with TypeScript

4. **Page-by-Page Processing**
   - Extract text per page
   - Translate each page individually
   - Build combines into single pages.json

5. **Processing Files are Temporary**
   - Only `data/` and `pages/` committed to Git
   - `processing/` directory gitignored
   - Can delete after successful deploy

### Benefits

- **Multi-Manual Ready**: Easy to add more manuals
- **Self-Contained**: All manual data in one location per manual
- **Simple Updates**: Single command rebuilds everything
- **Static Export Compatible**: Build-time imports
- **Fast Performance**: No runtime fetch
- **Scalable**: Works for any PDF size
- **Type-Safe**: Full TypeScript support
