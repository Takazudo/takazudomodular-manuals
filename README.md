# Manual OXI ONE MK2

A Next.js-based manual viewer for hardware synthesizer manuals, starting with the OXI ONE MKII. This site provides a bilingual viewing experience with original PDF page images alongside Japanese translations.

## Features

- **Multi-Manual Support**: Host multiple PDF manuals with unique slugs
- **Bilingual Display**: Original PDF images + Japanese translations
- **Continuous Page Navigation**: Browse all pages sequentially
- **Static Export**: Pre-rendered pages for fast loading
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Custom Zudo Design System with dark mode

## Live Site

- **Production**: [https://manual-oxi-one-mk2.netlify.app/](https://manual-oxi-one-mk2.netlify.app/)
- **OXI ONE MK2 Manual**: [/manuals/oxi-one-mk2/](https://manual-oxi-one-mk2.netlify.app/manuals/oxi-one-mk2/)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 19
- **Styling**: Tailwind CSS v4 (Zudo Design System)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Deployment**: Netlify
- **Documentation**: Docusaurus 3

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
/pdf-process new-manual-slug
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
import newManualPart01 from '@/public/new-manual-slug/data/part-01.json';
import newManualPart02 from '@/public/new-manual-slug/data/part-02.json';
// ... import all parts (check how many parts were created)

// Add to registry
const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
  'oxi-one-mk2': {
    // ... existing manual
  },
  'new-manual-slug': {
    manifest: newManualManifest as unknown as ManualManifest,
    parts: {
      '01': newManualPart01 as unknown as ManualPartData,
      '02': newManualPart02 as unknown as ManualPartData,
      // ... all parts
    },
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

public/new-manual-slug/ # Output (committed to git)
  ├── data/                     # Final JSON files
  │   ├── manifest.json
  │   ├── part-01.json
  │   └── ... (part-XX.json)
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

# PDF Processing
pnpm run pdf:all --slug {slug}        # Full pipeline
pnpm run pdf:split --slug {slug}      # Split PDF
pnpm run pdf:render --slug {slug}     # Render images
pnpm run pdf:extract --slug {slug}    # Extract text
pnpm run pdf:translate --slug {slug}  # Translate to Japanese
pnpm run pdf:build --slug {slug}      # Build JSON files
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
├── lib/                        # Utilities and data loading
│   ├── manual-data.ts          # Data loading logic
│   ├── manual-registry.ts      # Manual registry (update for new manuals)
│   └── types/                  # TypeScript types
├── public/             # Static manual assets
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

# Visit: http://localhost:3110
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
- **Documentation**: [http://localhost:3110](http://localhost:3110) (when running locally)

---

**Note**: This project is optimized for Claude Code development workflow. See `CLAUDE.md` for AI-assisted development guidelines.
