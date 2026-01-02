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
├── app/                 # Next.js app directory
│   ├── page/            # Continuous page viewer (/page/[1-280])
│   └── part-01/         # Legacy redirect
├── components/          # React components
├── lib/                 # Utilities and libraries
│   ├── manual-data.ts   # Data loading logic
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
│   └── manual/          # Manual page images
├── data/                # Translation JSON data
│   ├── translations/    # New structure with manifest
│   └── part-01/         # Legacy data (for reference)
├── scripts/             # Build and migration scripts
├── doc/                 # Docusaurus documentation
├── worktrees/           # Git worktrees (gitignored)
└── __inbox/             # Temporary files (gitignored)
```

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
/data/translations/
├── manifest.json         # Master index with all parts
├── part-01.json          # Pages 1-5 (currently available)
└── (future parts...)     # Additional parts as they become available
```

### Manifest Format (`manifest.json`)

```json
{
  "title": "OXI ONE MKII Manual",
  "totalPages": 5,
  "parts": [
    {
      "part": "01",
      "pageRange": [1, 5],
      "file": "/data/translations/part-01.json"
    }
  ]
}
```

### Part JSON Format

```json
{
  "part": "01",
  "pageRange": [1, 5],
  "pages": [
    {
      "pageNum": 1,
      "image": "/manual/part-01/pages/page_001.svg",
      "title": "表紙",
      "sectionName": "表紙・目次",
      "translation": "# Markdown content here...",
      "hasContent": true
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
