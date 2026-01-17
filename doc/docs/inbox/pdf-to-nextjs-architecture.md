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
│ Phase 2: Build for Next.js (Final Data)                     │
│                                                              │
│  pdf:build    → public/{slug}/data/pages-ja.json            │
│               → public/{slug}/data/pages-en.json            │
│                                                              │
│  pdf:manifest → public/{slug}/data/manifest.json            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Application (Data Consumer)                         │
│                                                              │
│  • Imports JSON via manual-registry.ts (ES modules)         │
│  • User selects language (ja/en), loads only that file      │
│  • Serves images from /manuals/{slug}/pages/                │
│  • Renders pages at /manuals/{slug}/page/[1-N]              │
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

### Phase 2: Build for Next.js (Final Data)

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
# Navigate to http://zmanuals.localhost:3100/manuals/{slug}/page/1

# 5. Commit and deploy
git add .
git commit -m "docs: update {slug} manual to version 2.0"
git push origin main
```

## Git Ignore Strategy

**Committed to Git:**

- `/manual-pdf/{slug}/` - Source PDF files
- `/public/{slug}/data/` - Final JSON files
  - `manifest.json` - Manual metadata
  - `pages-ja.json` - Japanese translations
  - `pages-en.json` - Original English text
- `/public/{slug}/pages/` - Rendered PNG images
- `/lib/` - Data loading code
- `/scripts/` - Processing scripts

**Gitignored (Temporary):**

- `/temp-processing/` - All intermediate processing files
  - `{slug}/split-pdf/` - Split page PDFs
  - `{slug}/extracted/` - Extracted English text
  - `{slug}/translations-draft/` - Translation drafts
- `/__inbox/` - Temporary reports and screenshots
- `/.next/`, `/out/` - Build outputs

**Key Principle:**

- `public/` = Web app output only (served to users)
- `temp-processing/` = All temporary files (never served, safe to delete)

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

## Language Selection (UI)

The application supports multiple languages with **separate data files per language**. Users choose their preferred language, and only that language's data is loaded.

### Why Separate Files?

| Approach | Pros | Cons |
|----------|------|------|
| ~~Single file with both languages~~ | Simple code | Larger download for everyone |
| **Separate files per language** | Optimal payload size | Slightly more complex loading |

Most users only need Japanese. They shouldn't download English data they'll never use.

### Available Languages

| Language | File | Description |
|----------|------|-------------|
| **Japanese** (default) | `pages-ja.json` | Translated content for Japanese users |
| **English** | `pages-en.json` | Original PDF text for reference/learning |

### Implementation Notes

```typescript
// Language type
type Language = 'ja' | 'en';

// Load language-specific data
function getPagesByLanguage(manualId: string, lang: Language): ManualPagesData {
  // Implementation loads pages-ja.json or pages-en.json
  // based on user preference
}

// Example: Page component
interface PageViewerProps {
  page: ManualPage;  // Contains `content` field (language-specific)
}

function PageViewer({ page }: PageViewerProps) {
  return (
    <div className="page-content">
      <MarkdownRenderer content={page.content} />
    </div>
  );
}
```

### User Language Preference

Language preference handling:

- Stored in localStorage for persistence
- Selectable via UI dropdown/toggle
- Can be set via URL parameter (e.g., `?lang=en`)
- Default: Japanese (`ja`)

### Loading Strategy Options

**Option A: Build-time (Static)**

- Generate separate HTML pages per language
- URL: `/manuals/{slug}/page/1` (ja) vs `/manuals/{slug}/en/page/1` (en)
- Pros: Fast, SEO-friendly
- Cons: Doubles build output

**Option B: Runtime (Dynamic)**

- Single page structure, fetch language data on demand
- URL: `/manuals/{slug}/page/1?lang=en`
- Pros: Smaller build, flexible
- Cons: Requires client-side data fetching

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

6. **Multi-Language Support**
   - Separate files per language (`pages-ja.json`, `pages-en.json`)
   - Users only download the language they need
   - English text committed to Git (not gitignored)
   - Easy to add more languages in the future

### Benefits

- **Multi-Manual Ready**: Easy to add more manuals
- **Self-Contained**: All manual data in one location per manual
- **Multi-Language**: Japanese and English available separately
- **Optimal Payload**: Users only load their chosen language
- **Simple Updates**: Single command rebuilds everything
- **Static Export Compatible**: Build-time imports
- **Fast Performance**: No runtime fetch
- **Scalable**: Works for any PDF size
- **Type-Safe**: Full TypeScript support
