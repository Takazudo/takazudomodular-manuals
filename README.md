# zmanuals

A Next.js-based manual viewer for hardware synthesizer manuals. Provides a bilingual viewing experience with original PDF page images alongside Japanese translations, supporting 40+ manuals.

## Features

- **Multi-Manual Support**: 40+ PDF manuals with unique slugs and automatic registry
- **Bilingual Display**: Original PDF images + Japanese translations side by side
- **Language Toggle**: Header `JA | EN` segmented control switches the translation column between Japanese (default) and English; selection persists via URL (`?lang=en`) and `localStorage` (`zmanuals:lang`)
- **Dual View Modes**: Page mode (single page) and scroll mode (continuous scrolling)
- **Scroll Mode**: Lazy image loading, IntersectionObserver-based page detection, debounced jump navigation
- **Thumbnail Navigation**: Sidebar thumbnails and full-page thumbnail grid modal
- **Keyboard Navigation**: Arrow keys for page-by-page browsing
- **Keyword Search**: Full-text search across manual pages (header icon / Cmd+K / Ctrl+K)
- **Static Export**: Pre-rendered pages for fast loading
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Custom Zudo Design System

## Live Site

- **Production**: [https://zmanuals.pages.dev/](https://zmanuals.pages.dev/)
- **OXI ONE MK2 Manual**: [https://zmanuals.pages.dev/manuals/oxi-one-mk2/](https://zmanuals.pages.dev/manuals/oxi-one-mk2/)

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **UI**: React 19
- **Styling**: Tailwind CSS v4 (Zudo Design System)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Deployment**: Cloudflare Pages
- **Documentation**: Docusaurus 3
- **Unit Tests**: Vitest
- **E2E Tests**: Playwright

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (port 3100)
pnpm dev

# Build for production
pnpm build

# Serve production build locally
pnpm serve
```

## Search

Each manual has a full-text keyword search across its pages.

### Using the search dialog

- Click the search icon in the header, or press **Cmd+K** (macOS) / **Ctrl+K** (Windows/Linux).
- Type a term (e.g. _tempo_, _sequencer_). Results update as you type.
- Click a result (or press Enter on the selected row) to jump to that page.

### Regenerating the search index

Each manual ships with a committed `public/{slug}/data/search-index.json` — a compact, MiniSearch-ready index generated from `pages-ja.json`. To regenerate it after translations change:

```bash
pnpm run pdf:search-index --slug {slug}    # single manual
pnpm run pdf:search-index:all              # every manual at once (runs automatically on pnpm build)
```

This is also wired into `pnpm run pdf:all` as the 6th pipeline step, so a full run regenerates the index automatically. See `scripts/CLAUDE.md` for the full pipeline.

### Cache busting

The index generator writes a SHA-1 content hash of `search-index.json` into the sibling `manifest.json` as `searchIndexVersion`. The search dialog reads it via the build-time registry import and appends `?v=<hash>` to the fetch URL, so CDNs (Cloudflare Pages includes the query string in its cache key by default) serve the fresh index as soon as a deploy changes the content.

## Adding a New Manual

This system supports multiple PDF manuals. Follow these steps to add a new manual:

### 1. Create Source Directory

```bash
mkdir manual-pdf/new-manual-slug
```

Use a descriptive slug (lowercase, hyphens for spaces). Examples:

- `oxi-one-mk2`
- `oxi-coral`
- `beatstep-pro`

### 2. Add PDF File

```bash
cp ~/path/to/manual.pdf manual-pdf/new-manual-slug/
```

The filename doesn't matter - the first PDF found in the directory will be used.

### 3. Process the PDF

```bash
/l-pdf-process new-manual-slug
```

This runs the full pipeline:

1. **Split**: Divides PDF into parts (30 pages each)
2. **Render**: Converts pages to PNG images at 150 DPI
3. **Extract**: Extracts text from each part
4. **Translate**: Translates to Japanese using Claude AI (requires `ANTHROPIC_API_KEY`)
5. **Build**: Combines data into JSON files
6. **Manifest**: Creates manifest.json with metadata

**Time estimate**: 15-30 minutes (depending on manual size)
**Cost estimate**: $5-10 per 280-page manual (Claude Sonnet 4.5)

### 4. Update Manual Registry

Edit `lib/manual-registry.ts` to import the new manual's data:

```typescript
// Add imports for new manual
import newManualManifest from '@/public/new-manual-slug/data/manifest.json';
import newManualPages from '@/public/new-manual-slug/data/pages-ja.json';

// Add to registry
const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    // ... existing manual
  },
  'new-manual-slug': {
    manifest: newManualManifest as unknown as ManualManifest,
    pages: newManualPages as unknown as ManualPagesData,
  },
};
```

**Why explicit imports?**

- Type safety with TypeScript
- Build-time bundling (no runtime fetch)
- Compatible with Next.js static export

### 5. Build and Deploy

```bash
# Run quality checks
pnpm check

# Build for production
pnpm build

# Test locally
pnpm serve

# Visit: http://localhost:8030/manuals/new-manual-slug/page/1
```

### 6. Verify the Manual

Test key pages:

- First page: `/manuals/new-manual-slug/page/1`
- Middle page: `/manuals/new-manual-slug/page/50`
- Last page: `/manuals/new-manual-slug/page/{lastPage}`

Check:

- ✅ Images load correctly
- ✅ Translations display
- ✅ Navigation works (Previous/Next buttons)
- ✅ Page selector shows all pages
- ✅ No console errors

### Output Structure

After processing, your manual will be structured as:

```
manual-pdf/new-manual-slug/     # Source (gitignored after processing)
  ├── pages/                    # Split page PDFs
  └── parts/                    # Split part PDFs

public/new-manual-slug/         # Output (committed to git)
  ├── data/                     # Final JSON files
  │   ├── manifest.json
  │   └── pages-ja.json
  ├── pages/                    # Rendered images
  │   ├── page-001.png
  │   └── ... (page-XXX.png)
  └── processing/               # Intermediate files (gitignored)
      ├── extracted/
      └── translations-draft/
```

**What to commit:**

- ✅ `public/{slug}/data/` - Final JSON files
- ✅ `public/{slug}/pages/` - Rendered images
- ✅ `lib/manual-registry.ts` - Updated registry
- ❌ `manual-pdf/{slug}/` - Source PDFs (gitignored)
- ❌ `public/{slug}/processing/` - Temp files (gitignored)

## Development

### Commands

```bash
# Development
pnpm dev                  # Start Next.js dev server (port 3100)
pnpm doc:dev              # Start Docusaurus docs (port 3110)

# Building
pnpm build                # Build for production
pnpm doc:build            # Build documentation

# Quality Checks
pnpm typecheck            # TypeScript type checking
pnpm lint                 # ESLint
pnpm format               # Prettier formatting
pnpm check                # Run all checks
pnpm check:fix            # Fix all auto-fixable issues

# Testing
pnpm test:unit            # Run Vitest unit tests
pnpm test:unit:watch      # Run unit tests in watch mode
pnpm test                 # Run Playwright e2e tests (requires dev server)

# PDF Processing
pnpm run pdf:all --slug {slug}        # Full pipeline
pnpm run pdf:split --slug {slug}      # Split PDF
pnpm run pdf:render --slug {slug}     # Render images
pnpm run pdf:extract --slug {slug}    # Extract text
pnpm run pdf:translate --slug {slug}  # Translate to Japanese
pnpm run pdf:build --slug {slug}      # Build JSON files
pnpm run pdf:search-index --slug {slug}  # Generate search-index.json
pnpm run pdf:manifest --slug {slug}   # Create manifest

# Utilities
pnpm clean                # Clean build outputs
pnpm serve                # Serve production build (port 8030)
```

### Git Worktree Workflow

This project uses git worktrees for feature development. See `CLAUDE.md` for detailed workflow.

```bash
# Create a new worktree for a feature
pnpm run init-worktree issue-X-feature-name

# Work in the worktree
cd worktrees/issue-X-feature-name

# When done, create PR and remove worktree
```

## Project Structure

```
/
├── app/                        # Next.js app directory
│   └── manuals/[manualId]/     # Dynamic manual routes
│       └── page/[pageNum]/     # Page viewer
├── components/                 # React components
│   └── viewer/                 # Viewer components (scroll mode, sidebar, modal)
├── lib/                        # Utilities and data loading
│   ├── manual-data.ts          # Data loading logic
│   ├── manual-registry.ts      # Manual registry (update for new manuals)
│   ├── asset-url.ts            # Base path utilities
│   └── types/                  # TypeScript types
├── e2e/                        # Playwright e2e tests
├── public/                     # Static manual assets
│   └── {slug}/                 # Per-manual directories
│       ├── data/               # JSON files (committed)
│       ├── pages/              # Images (committed)
│       └── processing/         # Temp files (gitignored)
├── manual-pdf/                 # Source PDFs (gitignored)
├── scripts/                    # Build and processing scripts
├── doc/                        # Docusaurus documentation
└── worktrees/                  # Git worktrees (gitignored)
```

## Documentation

Comprehensive documentation is available in the `/doc/` directory:

```bash
# Start documentation server
pnpm doc:dev

# Visit: http://doc-zmanuals.localhost:3100
```

Topics covered:

- PDF Processing Pipeline
- Multi-Manual Architecture
- Design System (Zudo)
- Development Workflow
- Translation Guidelines

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```bash
# Required for PDF translation
ANTHROPIC_API_KEY=your_api_key_here
```

### PDF Processing Config

Edit `pdf-config.json` to customize:

```json
{
  "pagesPerPart": 30,
  "imageDPI": 150,
  "imageFormat": "png",
  "translationModel": "claude-sonnet-4-5-20250929",
  "maxRetries": 3
}
```

## Contributing

1. Fork the repository
2. Create a feature branch or worktree
3. Make your changes
4. Run quality checks: `pnpm check`
5. Create a pull request

See `CLAUDE.md` for detailed development guidelines.

## License

MIT License

## Support

- **Issues**: [GitHub Issues](https://github.com/Takazudo/takazudomodular-manuals/issues)
- **Documentation**: [http://doc-zmanuals.localhost:3100](http://doc-zmanuals.localhost:3100) (when running locally)

---

**Note**: This project is optimized for Claude Code development workflow. See `CLAUDE.md` for AI-assisted development guidelines.
