# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based manual viewer for the OXI ONE MKII hardware synthesizer manual. The site provides a bilingual viewing experience (original English PDF pages + Japanese translations) with continuous page numbering.

**Project Goal**: Create a web-based manual viewer that displays PDF page images alongside Japanese translations in a user-friendly, searchable interface.

**URL Structure**:

- Base path: `/manuals/oxi-one-mk2/`
- Pages: `/manuals/oxi-one-mk2/page/[1-280]`
- Example: `/manuals/oxi-one-mk2/page/1` (page 1)

**Deployed Website**: https://manual-oxi-one-mk2.netlify.app/

- This is the live production website that corresponds to the content in this repository
- Full URL: `https://manual-oxi-one-mk2.netlify.app/manuals/oxi-one-mk2/`
- When referencing URLs like https://manual-oxi-one-mk2.netlify.app/manuals/oxi-one-mk2/*, the content exists in this repository
- The deployed site reflects the current state of the main branch
- Preview URLs: `https://*--manual-oxi-one-mk2.netlify.app/manuals/oxi-one-mk2/`
- We use preview URLs for previewing PRs before merging to main

## basePath Configuration (Critical Architecture Decision)

**This site uses `basePath: '/manuals'` in `next.config.js`.**

### Why basePath is Required

This site is proxied through `takazudomodular.com/manuals/*` via a Netlify redirect:

```
# From takazudomodular.com/_redirects
/manuals/*  https://manual-oxi-one-mk2.netlify.app/manuals/:splat  200
```

This means:

- All requests to `takazudomodular.com/manuals/*` are proxied to this site
- **Only paths under `/manuals/` are proxied** - paths like `/_next/static/*` are NOT proxied
- Without basePath, CSS/JS assets at `/_next/static/*` would return 404

### Impact on Development

**Route paths (for `<Link>`, `router.push()`):**

- Don't include `/manuals` prefix - basePath adds it automatically
- Example: `<Link href="/oxi-one-mk2/page/1">` → URL becomes `/manuals/oxi-one-mk2/page/1`

**Static asset paths (for `<img>`, `<a href>` to files):**

- Don't include `/manuals` prefix - basePath adds it automatically
- Files are served from `/public/{manualId}/`
- Example: `<img src="/oxi-one-mk2/pages/page-001.png">` → URL becomes `/manuals/oxi-one-mk2/pages/page-001.png`

**App directory structure:**

- Routes are defined WITHOUT the `/manuals` prefix
- `/app/page.tsx` → served at `/manuals/`
- `/app/[manualId]/page.tsx` → served at `/manuals/[manualId]`
- `/app/[manualId]/page/[pageNum]/page.tsx` → served at `/manuals/[manualId]/page/[pageNum]`

**usePathname() returns paths WITHOUT basePath:**

- URL `/manuals/oxi-one-mk2/page/1` → `usePathname()` returns `/oxi-one-mk2/page/1`

### Configuration References

- `next.config.js`: Contains `basePath: '/manuals'`
- `lib/manual-config.ts`: Helper functions for route and asset paths

## Language Guidelines

**Development Language: English**

- All communication with Claude Code should be in **English**
- GitHub issues, PRs, commit messages, and code comments: **English**
- Documentation (CLAUDE.md, README.md, code documentation): **English**
- Technical discussions and planning: **English**

**Application Language: Japanese**

- The app itself is for Japanese users
- HTML lang attribute: `lang="ja"`
- UI text, translations, and user-facing content: **Japanese**
- Manual translations: **Japanese**

**Rationale:** This project may collaborate with international developers or be referenced globally. Using English for development ensures accessibility while keeping the end-user experience fully localized for Japanese users.

## Security Notes

- **NEVER use `rm -rf` with absolute paths** - Always use relative paths like `rm -rf ./foo/bar`
- Using `rm -rf /foo/bar/` will be denied by security systems
- Always verify paths before deletion operations

## Temporary Files and Reports (`__inbox/` directory)

The `__inbox/` directory serves as a temporary stash for:

- Processing reports and logs
- Translation work-in-progress files
- Screenshots and test outputs
- Any generated reports that shouldn't be committed to Git
- Error reports from processing
- Temporary analysis files

**Key points:**

- This directory is in `.gitignore` - files here won't be committed
- Safe place for temporary work files and reports
- **ALWAYS use `__inbox/` for temporary files** - Do NOT save temporary files (screenshots, test outputs, etc.) to the repository root
- Processing errors are saved here with timestamps
- Claude can freely create temporary files here for analysis

Example files saved here:

- `translation-errors-YYYY-MM-DD-HH-mm-ss.json` - Error reports from translation processing
- `test-screenshot.png` - Temporary test screenshots
- Analysis reports and temporary documentation
- Any other temporary files needed during development

## Directory Structure

```
/
├── app/                        # Next.js app directory
│   ├── page/                   # Continuous page viewer (/page/[1-280])
│   └── part-01/                # Legacy redirect
├── components/                 # React components
├── lib/                        # Utilities and libraries
│   ├── manual-data.ts          # Data loading logic
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
│   └── manuals/                # Multi-manual structure
│       └── oxi-one-mk2/        # OXI ONE MKII manual
│           ├── data/           # Final JSON files (imported at build time)
│           │   ├── manifest.json
│           │   ├── part-01.json
│           │   └── ... (part-10.json)
│           ├── pages/          # Rendered PNG images (150 DPI)
│           │   ├── page-001.png
│           │   └── ... (page-272.png)
│           └── processing/     # Intermediate files (gitignored)
│               ├── extracted/  # Extracted text from PDF
│               └── translations-draft/  # Translation drafts
├── manual-pdf/                 # Source PDFs
│   ├── pages/                  # Split page PDFs (gitignored)
│   └── parts/                  # Split part PDFs (gitignored)
├── scripts/                    # Build and migration scripts
├── doc/                        # Docusaurus documentation
├── worktrees/                  # Git worktrees (gitignored)
└── __inbox/                    # Temporary files (gitignored)
```

**Multi-Manual Architecture:**

- Each manual is self-contained under `/public/{manual-id}/`
- Final data (JSON + images) committed to repository
- Processing files are gitignored (can delete after successful deploy)
- Ready for adding more manuals with same structure

## Command Restrictions

### rm -rf

Never use `rm -rf` from the root directory. Always use relative paths.

**❌ WRONG:**

```bash
rm -rf /Users/takazudo/repos/path/to/file.md
```

**✅ CORRECT:**

```bash
rm -rf ./path/to/file.md
```

### Git Related

- **Never use force push** - Force push can destroy commit history and cause data loss
- **Don't use `git commit --amend`** - Only use with explicit user permission for special cases
- **Don't create the same branch name PR** - Always make new branch names for each PR to avoid confusion

#### Merge Strategy

**Default: Regular Merge (NOT Squash)**

Use regular merge for PRs unless explicitly requested otherwise:

```bash
# ✅ CORRECT (default)
gh pr merge <PR_NUMBER>

# ❌ ONLY use squash when specifically requested
gh pr merge <PR_NUMBER> --squash
```

## Git Worktree Workflow

We use git worktrees under the `worktrees/{tree-name}/` directory for topic-based development.

### 🚨 CRITICAL WARNING: Always Check Your Current Directory Before Git Operations

**MANDATORY CHECK BEFORE ANY GIT OPERATION:**

```bash
# ALWAYS run this before ANY git operation (commit, push, checkout, branch, etc.)
pwd
```

**If the output contains `/worktrees/`:**

- ❌ **STOP! You are in a git worktree!**
- ❌ **Any git operation will affect the WORKTREE BRANCH, not main!**
- ✅ **Navigate back to repo root first:** `cd /Users/takazudo/repos/personal/manual-oxi-one-mk2`

### 🔴 Two Different Session Contexts

#### Context 1: Root Session (Manager Role)

**Started from:** `/Users/takazudo/repos/personal/manual-oxi-one-mk2/` (repo root)
**Purpose:** Manage project, review work, merge PRs
**Git operations:** Affect `main` branch
**RULE:** Never cd into `/worktrees/{slug}/` and do git operations

#### Context 2: Worktree Session (Worker Role)

**Started from:** `/Users/takazudo/repos/personal/manual-oxi-one-mk2/worktrees/{slug}/`
**Purpose:** Work on specific issue/task
**Git operations:** Affect the worktree's feature branch (e.g., `issue-3--docusaurus-...`)
**RULE:** All work happens here, commits go to feature branch

### 🚨 CRITICAL WARNING: NEVER Mix Contexts

**If you started in ROOT (manager session):**

- ❌ **NEVER** cd into `/worktrees/{slug}/` and do git operations
- ✅ **DO** read files from worktrees for reference
- ✅ **DO** review PRs, merge branches, manage the project

**If you started in WORKTREE (worker session):**

- ✅ All your work happens here
- ✅ Commits and pushes go to the feature branch
- ✅ When done, create PR to merge into main

### Common Mistake Example

```bash
# ❌ WRONG - This is a disaster waiting to happen:
# (Started session in repo root)
pwd                           # /Users/.../manual-oxi-one-mk2
cd worktrees/issue-3-docusaurus/
git add .
git commit -m "fix"          # ❌ Commits to issue-3 branch, NOT main!
git push                     # ❌ Pushes to wrong branch!

# ✅ CORRECT - Always check where you are:
pwd                           # /Users/.../manual-oxi-one-mk2
# If you need to work on issue-3, start a NEW session in that worktree
# Don't cd there from root session!
```

### How to Detect You're in a Worktree

**Method 1: Check current path**
```bash
pwd
# If output contains '/worktrees/', you're in a worktree
```

**Method 2: Check git branch**
```bash
git branch --show-current
# If it shows 'issue-X--something', you're likely in a worktree
# If it shows 'main', you're in the main repo
```

**Method 3: Check worktree list**
```bash
git worktree list
# Shows all active worktrees and their branches
```

### 🛑 BEFORE ANY GIT COMMAND: Checklist

Before running ANY of these commands:

- `git add`
- `git commit`
- `git push`
- `git checkout`
- `git branch`
- `git merge`

**RUN THIS FIRST:**
```bash
pwd
# Confirm you're in the correct location!
# Repo root: /Users/takazudo/repos/personal/manual-oxi-one-mk2
# Worktree: /Users/takazudo/repos/personal/manual-oxi-one-mk2/worktrees/{slug}
```

**Then ask yourself:**

- "Am I in the right context for this operation?"
- "Is this what I intend to do?"
- "Will this affect the correct branch?"

### What Happens When You Make a Mistake

**Scenario:** You started in root, cd'd to worktree, and committed

- ✅ The commit goes to the worktree's feature branch
- ❌ The commit does NOT go to main
- ❌ You might have committed to the wrong issue's branch
- ❌ Very hard to debug and fix
- ❌ Wastes time and causes confusion

**Prevention:** ALWAYS check `pwd` before git operations!

### ⚠️ CRITICAL: Always Pull Before Creating Worktree

**MANDATORY**: Pull the latest base branch before creating a worktree to ensure it includes all merged changes.

```bash
# ✅ CORRECT - Pull first, then create worktree
git checkout main
git pull origin main
pnpm run init-worktree issue-3-docusaurus

# ❌ WRONG - Creating worktree from stale local branch
pnpm run init-worktree issue-3-docusaurus  # Missing merged PRs!
```

**Why this matters:**

- Worktrees created from stale branches are missing merged PRs
- Implementation sessions fail due to missing dependencies
- Wasted time reimplementing code that already exists
- Confusion about what files should exist

**Example of what goes wrong:**

1. PR #14 merged to remote `main` ✅
2. Local `main` not updated ❌
3. Worktree created from stale local branch ❌
4. Worktree missing all PR #14 files ❌
5. Implementation fails ❌

**Always follow this sequence:**

1. Merge any pending PRs
2. Pull latest base branch
3. Create worktree
4. Verify worktree has expected files

### init-worktree Command

We have an `init-worktree` command that will set up a git worktree automatically.

**Usage:**

```bash
pnpm run init-worktree <worktree-name>
```

**What it does:**

1. Creates `worktrees/<worktree-name>` using `git worktree add` (if it doesn't exist)
2. Sets up symbolic links for environment files from the repo root
3. Ensures environment settings are shared across worktrees

**Example:**

```bash
# Create and initialize a worktree for a new feature
pnpm run init-worktree issue-2-project-setup

# This creates worktrees/issue-2-project-setup/ with all environment files linked
```

### ⚠️ CRITICAL: Always Pull Before Creating Worktree

**MANDATORY**: Pull the latest base branch before creating a worktree to ensure it includes all merged changes.

```bash
# ✅ CORRECT - Pull first, then create worktree
git checkout main
git pull origin main
pnpm run init-worktree issue-2-project-setup

# ❌ WRONG - Creating worktree from stale local branch
pnpm run init-worktree issue-2-project-setup  # Missing merged PRs!
```

## Localhost Port Mapping for Development

This port mapping is crucial for human-to-AI communication. When users reference localhost URLs (e.g., "check http://localhost:3100/"), use this mapping to understand which service and files are being referenced.

### Port Assignment Table

| Port | Service          | Directory | Purpose                     | Start Command    |
| ---- | ---------------- | --------- | --------------------------- | ---------------- |
| 3100 | Next.js App      | `/`       | Manual viewer app           | `pnpm dev`       |
| 3110 | Docusaurus Docs  | `/doc/`   | Technical documentation     | `pnpm doc:dev`   |
| 8030 | Production Build | `/out/`   | Production build test serve | `pnpm serve`     |

### URL to File Mapping Examples

- `http://localhost:3100/manuals/oxi-one-mk2/` → Next.js app in `/app/`
- `http://localhost:3100/manuals/oxi-one-mk2/page/1` → Manual page viewer
- `http://localhost:3110/doc/inbox/` → Documentation in `/doc/docs/inbox/`

### Port Management

**Automatic port cleanup:**

- Use `lsof -ti:[PORT] | xargs kill -9` for manual cleanup if needed
- Example: `lsof -ti:3100 | xargs kill -9`

## Development Commands

```bash
# Start development server (Next.js)
pnpm dev

# Start documentation server (Docusaurus)
pnpm doc:dev

# Build for production
pnpm build

# Build documentation
pnpm doc:build

# Serve production build locally
pnpm serve

# PDF Processing (Issue #21)
pnpm run pdf:split       # Split PDF into parts
pnpm run pdf:render      # Render pages to PNG images
pnpm run pdf:extract     # Extract text from PDFs
pnpm run pdf:translate   # Translate to Japanese (requires ANTHROPIC_API_KEY)
pnpm run pdf:build       # Build final JSON files
pnpm run pdf:manifest    # Create manifest.json
pnpm run pdf:all         # Run all PDF processing steps

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:fix

# Run all checks before committing
pnpm check
pnpm check:fix

# Clean build outputs
pnpm clean
```

## PDF Processing Automation

**Claude Code Skill:** `/pdf-process`

Automated workflow for converting the OXI ONE MKII PDF manual into Next.js application data using Claude Code Task subagents.

### ⚠️ Important: Maintain the System, Not the Output

**Critical Principle:** Translation output files (extracted text, translation drafts, final JSON) are **temporary generated files**. What we maintain and improve is the **system itself**:

✅ **Maintain:**

- Translator prompt (`.claude/agents/manual-translator.md`)
- Processing scripts (`scripts/pdf-*.js`)
- Command documentation (`.claude/commands/pdf-process.md`)
- Pipeline configuration (`pdf-config.json`)

❌ **Don't maintain (regenerate as needed):**

- `public/oxi-one-mk2/processing/extracted/` - Extracted text files
- `public/oxi-one-mk2/processing/translations-draft/` - Translation work-in-progress
- `public/oxi-one-mk2/data/` - Final JSON output
- `public/oxi-one-mk2/pages/` - Rendered images
- `manual-pdf/pages/` - Split page PDFs
- `manual-pdf/parts/` - Split part PDFs

**When improving translation quality:** Update the translator prompt in `.claude/agents/manual-translator.md`, then regenerate outputs by running the pipeline again. The outputs are disposable - the process is what matters.

### Quick Start

```bash
# 1. Place PDF in manual-pdf directory
cp /path/to/OXI-ONE-MKII-Manual.pdf manual-pdf/

# 2. Run full pipeline via Claude Code
# Type: /pdf-process
```

**Claude Code will execute the pipeline without asking questions during translation.**

### Pipeline Overview

The PDF processing pipeline consists of 6 fully automated steps:

1. **Split** - Divides the PDF into parts (30 pages each)
2. **Render** - Converts pages to PNG images at 150 DPI
3. **Extract** - Extracts text from each PDF part
4. **Translate** - Translates to Japanese using Claude Code Task subagents (5 concurrent workers)
5. **Build** - Combines data into JSON files for Next.js
6. **Manifest** - Creates manifest.json with metadata

**Total time:** ~15-30 minutes for a 280-page manual

### Output Structure

```
manual-pdf/
  ├── pages/                                    # Split page PDFs (gitignored)
  └── parts/                                    # Split part PDFs (gitignored)
public/oxi-one-mk2/
  ├── data/                                     # Final JSON files (for Next.js)
  │   ├── manifest.json
  │   ├── part-01.json
  │   └── ... (part-10.json)
  ├── pages/                                    # Rendered PNG images (150 DPI)
  │   ├── page-001.png
  │   └── ... (page-272.png)
  └── processing/                               # Intermediate files (gitignored)
      ├── extracted/                            # Extracted text
      └── translations-draft/                   # Translation drafts
```

### Configuration

Edit `pdf-config.json` to customize settings:

- Pages per part
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

**Claude Code Command:** `/verify-translation`

After running the PDF processing pipeline, use this command to verify that translations match the page images.

**What it does:**

1. Starts dev server on port 3100 (if not running)
2. Captures all 30 pages at high resolution (2000x1600) using `capture-all-pages` skill
3. Verifies sample pages (1, 10, 15, 21, 30) for translation accuracy
4. Checks for:
   - ✅ Translation is present
   - ✅ Page numbers match
   - ✅ Content corresponds to image
   - ❌ No missing translations
   - ❌ No page number mismatches
5. Generates verification report

**Usage:**

```bash
# Ensure dev server is running
pnpm dev

# Run verification command
/verify-translation
```

**Output location:** `__inbox/captures-{date}-{session}/`

**Project-Specific Skill:** `capture-all-pages`

This skill captures screenshots of all manual pages at high resolution for visual verification.

- **Resolution:** 2000x1600 (high detail for inspection)
- **Pages:** All 30 pages (or configured total)
- **Output:** `__inbox/captures-{YYYYMMDD}-{session}/`
- **Format:** PNG files named `page-001.png` to `page-030.png`

The skill embeds Playwright logic directly and saves captures to the project's `__inbox/` directory (gitignored).

**Full Documentation:** See `scripts/README-PDF-PROCESSING.md`

## Multi-Manual Support

The system supports multiple PDF manuals with unique slugs. Each manual is self-contained under `/public/{manual-id}/` with its own data, images, and processing files.

### Architecture

**Directory structure per manual:**

```
/manual-pdf/{slug}/              # Source PDF directory
  └── *.pdf                      # Any PDF file (first one found is used)

/public/{slug}/          # Output directory
  ├── data/                      # Final JSON files (committed)
  │   ├── manifest.json
  │   ├── part-01.json
  │   └── ... (part-XX.json)
  ├── pages/                     # Rendered images (committed)
  │   ├── page-001.png
  │   └── ... (page-XXX.png)
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

**Step-by-step workflow:**

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
   /pdf-process {slug}
   ```
   This runs all 6 pipeline steps: split, render, extract, translate, build, manifest.

4. **Update manual registry** (`lib/manual-registry.ts`):

   Add explicit imports for the new manual:
   ```typescript
   import newManualManifest from '@/public/new-manual/data/manifest.json';
   import newManualPart01 from '@/public/new-manual/data/part-01.json';
   import newManualPart02 from '@/public/new-manual/data/part-02.json';
   // ... import all parts

   const MANUAL_REGISTRY: Record<string, ManualRegistryEntry> = {
     'new-manual': {
       manifest: newManualManifest as unknown as ManualManifest,
       parts: {
         '01': newManualPart01 as unknown as ManualPartData,
         '02': newManualPart02 as unknown as ManualPartData,
         // ... all parts
       },
     },
   };
   ```

   **Why explicit imports?** This approach ensures:

   - Type safety with TypeScript
   - Build-time bundling (no runtime fetch)
   - Compatible with Next.js static export (`output: 'export'`)

5. **Build and deploy:**
   ```bash
   pnpm build
   ```

**Time estimate:** ~30 minutes (excluding translation time ~15-30 min)

### Processing Multiple Manuals

All PDF processing scripts accept a `--slug` parameter:

```bash
# Process specific manual
pnpm run pdf:all --slug oxi-one-mk2
pnpm run pdf:all --slug oxi-coral

# Individual steps
pnpm run pdf:split --slug oxi-coral
pnpm run pdf:render --slug oxi-coral
pnpm run pdf:extract --slug oxi-coral
pnpm run pdf:translate --slug oxi-coral
pnpm run pdf:build --slug oxi-coral
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

## Package Manager

This project uses **pnpm** for package management.

- All dependencies are managed via pnpm
- Workspace configuration in `pnpm-workspace.yaml`
- Sub-packages are defined in the workspace

## Technology Stack

### Core Technologies

- **Next.js 14+**: App Router for server-side rendering and static generation
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Styling with custom design system (Zudo Design System)
- **pnpm**: Package manager with workspace support

### Documentation

- **Docusaurus 3**: Technical documentation system
- **Japanese locale**: Default language for documentation

### Data & Content

- **JSON**: Translation data storage
- **Markdown/MDX**: Translation content format
- **PNG Images**: Rendered PDF pages (150 DPI)

## Design System (Zudo Design System)

This project uses the Zudo Design System, a custom Tailwind CSS v4 configuration with:

- **All Tailwind defaults disabled** - Only Zudo tokens available
- **CSS Variables**: Comprehensive token system in `:root`
- **Semantic naming**: `hgap` (horizontal) and `vgap` (vertical) spacing
- **Custom utilities**: Defined via `@utility` directive
- **Dark theme**: Default and enforced

See `/doc/docs/inbox/design-system.md` for comprehensive documentation.

## Data Structure

The manual data is split into multiple files for better performance:

### Directory Structure

```
/public/oxi-one-mk2/data/
├── manifest.json         # Master index with all parts
├── part-01.json          # Pages 1-28
├── part-02.json          # Pages 29-56
└── ... (part-10.json)    # Pages 245-272
```

### How Data is Loaded

**Build-time import (Current Approach):**

- JSON files imported as ES modules in `lib/manual-data.ts`
- Data bundled into HTML at build time
- Compatible with Next.js static export (`output: 'export'`)
- Fast page loads (no runtime fetch)

```typescript
// lib/manual-data.ts
import manifestDataRaw from '@/public/oxi-one-mk2/data/manifest.json';
import part01DataRaw from '@/public/oxi-one-mk2/data/part-01.json';
// ... part-02 through part-10
```

### Manifest Format (`manifest.json`)

```json
{
  "title": "OXI ONE MKII Manual",
  "totalPages": 272,
  "parts": [
    {
      "part": "01",
      "pageRange": [1, 28],
      "totalPages": 28
    }
    // ... parts 02-10
  ]
}
```

### Part JSON Format

```json
{
  "part": "01",
  "pageRange": [1, 28],
  "totalPages": 28,
  "metadata": {
    "processedAt": "2025-01-05T...",
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
      "translation": "# Markdown content here...",
      "hasContent": true,
      "tags": []
    }
  ]
}
```

## Important: Pre-Push Checklist

**ALWAYS run these commands before pushing to GitHub:**

1. **Run all quality checks:**

   ```bash
   pnpm check
   ```

2. **If there are issues, fix them:**

   ```bash
   pnpm check:fix
   ```

3. **Run tests (optional but recommended):**
   ```bash
   pnpm test
   ```

## Japanese Text Guidelines

- **Target audience**: Japanese users
- **Translation style**: Technical documentation style (です・ます調)
- **Terminology**: Preserve technical terms in English where appropriate (e.g., MIDI, CV, Sequencer)
- **Consistency**: Maintain consistent translation of terms across all parts

## GitHub Issues

All major features and tasks are tracked as GitHub issues:

- #1: Technical Documentation (page-by-page PDF translation system)
- #2: Project Setup & Infrastructure
- #3: Docusaurus Documentation System Setup
- #4: Tailwind CSS Design System Setup
- #5: Next.js App with Part 01 Viewer (MVP)
- #6: Data Migration: HTML to Next.js JSON Structure
- #7: Convert All Manual Parts (Parts 02-10)
- #8: Search Functionality
- #9: Bookmarking & Progress Tracking
- #10: Performance Optimizations
- #11: Deployment Setup

## Reference Project

This project is based on the architecture and design system from:
`/Users/takazudo/repos/personal/takazudomodular`

Key learnings and patterns are adapted from this reference project.

## Coding Standards

### TypeScript

- Use strict type checking
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary

### React Components

- Prefer functional components with hooks
- Use proper prop types or TypeScript interfaces
- Keep components focused and single-purpose

### Styling

- **NEVER use inline styles** - Always use Tailwind CSS classes
- Use Zudo design system tokens exclusively
- For long className strings, use `ctl` from `@netlify/classnames-template-literals`

### File Naming

- Use kebab-case for all file names
- Example: `page-viewer.tsx`, `translation-panel.tsx`

## Quality Assurance

### Pre-commit Checks

- ESLint on JavaScript/TypeScript files
- Prettier on all supported file types
- TypeScript type checking

### CI/CD

- Automated builds on every PR
- Type checking
- Linting and formatting checks
- Test execution
- Build verification

## Documentation

Comprehensive project documentation is maintained in `/doc/` using Docusaurus.

- **INBOX category**: Main development documentation
- **Japanese locale**: All documentation in Japanese
- **Dark mode**: Forced dark theme for consistency

## Contact & Support

For questions or issues related to this project, refer to the GitHub issues or project documentation.
