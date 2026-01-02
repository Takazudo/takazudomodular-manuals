# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based manual viewer for the OXI ONE MKII hardware synthesizer manual. The site provides a bilingual viewing experience (original English PDF pages + Japanese translations) for the 272-page manual.

**Project Goal**: Create a web-based manual viewer that displays PDF page images alongside Japanese translations in a user-friendly, searchable interface.

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

**Key points:**

- This directory is in `.gitignore` - files here won't be committed
- Safe place for temporary work files and reports
- **ALWAYS use `__inbox/` for temporary files** - Do NOT save temporary files (screenshots, test outputs, etc.) to the repository root
- Claude can freely create temporary files here for analysis

## Directory Structure

```
/
├── manuals/                 # Main application root
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utilities and libraries
│   ├── public/             # Static assets
│   │   └── manual/         # Manual page images
│   ├── data/               # Translation JSON data
│   ├── scripts/            # Build and migration scripts
│   └── doc/                # Docusaurus documentation
├── worktrees/              # Git worktrees (gitignored)
├── __inbox/                # Temporary files (gitignored)
└── scripts/                # Root-level scripts
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

### 🚨 CRITICAL WARNING: NEVER Edit Files in Worktree Directories

**ABSOLUTE RULE: Do NOT perform any git operations (commit, push, checkout, etc.) inside `/worktrees/` directory.**

- **Location**: All git worktrees are under `/worktrees/` directory
- **Each worktree = Different branch**: Files under `/worktrees/` are checked out to DIFFERENT branches than the main repo
- **Git operations apply to that branch**: Any git commit/push in a worktree affects THAT branch, not your intended branch
- **Hard to debug**: Changes made in worktrees can break things unexpectedly and are very hard to trace

**When user says "refer to old implementation in git worktree":**
- ✅ **DO**: Read files from worktree for reference (using Read tool)
- ❌ **DON'T**: Edit, commit, or push any changes there
- ✅ **DO**: Copy the implementation to the main repo and apply changes there

**How to detect you're in a worktree:**
- Check if current path contains `/worktrees/`
- Run `pwd` - if it shows `/Users/takazudo/repos/personal/manual-oxi-one-mk2/worktrees/*`, you're in a worktree
- **If you're in a worktree, navigate back to repo root before any git operations**

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

See `/manuals/doc/docs/inbox/design-system.md` for comprehensive documentation.

## Data Structure

### Translation JSON Format

```json
{
  "part": "01",
  "totalPages": 30,
  "metadata": {
    "title": "OXI ONE MKII Manual - Part 01",
    "sections": [
      {
        "name": "概要 (Overview)",
        "pageRange": [9, 18]
      }
    ]
  },
  "pages": [
    {
      "pageNum": 1,
      "image": "/manual/part-01/pages/page_001.png",
      "title": "表紙",
      "sectionName": null,
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

Comprehensive project documentation is maintained in `/manuals/doc/` using Docusaurus.

- **INBOX category**: Main development documentation
- **Japanese locale**: All documentation in Japanese
- **Dark mode**: Forced dark theme for consistency

## Contact & Support

For questions or issues related to this project, refer to the GitHub issues or project documentation.
