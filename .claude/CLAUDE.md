# Claude Code Configuration - CLAUDE.md

Claude Code-specific workflow details. For project-wide instructions, see the root `CLAUDE.md`.

## Git Worktree Workflow (Detailed)

We use git worktrees under `worktrees/{tree-name}/` for topic-based development.

### CRITICAL: Always Check Your Current Directory Before Git Operations

**MANDATORY CHECK BEFORE ANY GIT OPERATION:**

```bash
# ALWAYS run this before ANY git operation (commit, push, checkout, branch, etc.)
pwd
```

**If the output contains `/worktrees/`:**

- STOP - You are in a git worktree
- Any git operation will affect the WORKTREE BRANCH, not main
- Navigate back to repo root first if you need to work on main

### Two Different Session Contexts

#### Context 1: Root Session (Manager Role)

**Started from:** Repository root
**Purpose:** Manage project, review work, merge PRs
**Git operations:** Affect `main` branch
**RULE:** Never cd into `/worktrees/{slug}/` and do git operations

#### Context 2: Worktree Session (Worker Role)

**Started from:** `worktrees/{slug}/`
**Purpose:** Work on specific issue/task
**Git operations:** Affect the worktree's feature branch
**RULE:** All work happens here, commits go to feature branch

### NEVER Mix Contexts

**If you started in ROOT (manager session):**

- NEVER cd into `/worktrees/{slug}/` and do git operations
- DO read files from worktrees for reference
- DO review PRs, merge branches, manage the project

**If you started in WORKTREE (worker session):**

- All your work happens here
- Commits and pushes go to the feature branch
- When done, create PR to merge into main

### Common Mistake Example

```bash
# WRONG - This is a disaster waiting to happen:
# (Started session in repo root)
pwd                           # /Users/.../manual-oxi-one-mk2
cd worktrees/issue-3-docusaurus/
git add .
git commit -m "fix"          # Commits to issue-3 branch, NOT main!
git push                     # Pushes to wrong branch!

# CORRECT - Always check where you are:
pwd                           # /Users/.../manual-oxi-one-mk2
# If you need to work on issue-3, start a NEW session in that worktree
# Don't cd there from root session!
```

### How to Detect You're in a Worktree

```bash
# Method 1: Check current path
pwd
# If output contains '/worktrees/', you're in a worktree

# Method 2: Check git branch
git branch --show-current
# If it shows 'issue-X--something', you're likely in a worktree

# Method 3: Check worktree list
git worktree list
# Shows all active worktrees and their branches
```

### Before Any Git Command: Checklist

Before running `git add`, `git commit`, `git push`, `git checkout`, `git branch`, or `git merge`:

1. Run `pwd` to confirm your location
2. Ask: "Am I in the right context for this operation?"
3. Ask: "Will this affect the correct branch?"

### Always Pull Before Creating Worktree

**MANDATORY**: Pull the latest base branch before creating a worktree to ensure it includes all merged changes.

```bash
# CORRECT - Pull first, then create worktree
git checkout main
git pull origin main
pnpm run init-worktree issue-3-docusaurus

# WRONG - Creating worktree from stale local branch
pnpm run init-worktree issue-3-docusaurus  # Missing merged PRs!
```

**Why this matters:**

- Worktrees created from stale branches are missing merged PRs
- Implementation sessions fail due to missing dependencies
- Wasted time reimplementing code that already exists

**Always follow this sequence:**

1. Merge any pending PRs
2. Pull latest base branch
3. Create worktree
4. Verify worktree has expected files

### init-worktree Command

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

## Claude Code Skills & Agents

### Skills

- **`/l-pdf-process`** - Run the complete PDF processing pipeline (see `scripts/CLAUDE.md`)
- **`/l-check-stale-manuals`** - Verify committed manuals against manufacturer-published current releases; propose/run refreshes for stale ones (per-manual source URL registry in `references/manual-sources.md`)
- **`/l-verify-translation`** - Capture and verify translations against page images
- **`capture-all-pages`** - Capture screenshots of all manual pages at high resolution
- **`/l-b4push`** - Run pre-push checks

### Agents

- **`manual-translator`** (`.claude/agents/manual-translator.md`) - Translates PDF manual pages from English to Japanese

### Skills Directory Structure

```
.claude/
├── CLAUDE.md               # This file
├── agents/
│   └── manual-translator.md    # Translation agent prompt
├── commands/
│   └── l-b4push.md            # Pre-push check command
└── skills/
    ├── capture-all-pages/      # Page screenshot capture
    │   ├── SKILL.md
    │   └── scripts/capture.js
    ├── l-check-stale-manuals/  # Manual staleness sweep vs manufacturer releases
    │   ├── SKILL.md
    │   ├── references/         # manual-sources.md (source URL registry), refresh-procedure.md
    │   └── scripts/            # inventory, pdf/png diff, page alignment, JSON rebuild helpers
    ├── pdf-process/            # PDF processing pipeline
    │   └── SKILL.md
    └── verify-translation/     # Translation verification
        ├── SKILL.md
        └── scripts/capture-pages.js
```

## zfb Framework Reference

This project uses `@takazudo/zfb` — a custom static site generator built on Preact islands.

- **`/zfb-wisdom`** skill is NOT installed in this project (as of the zfb migration in #126). Use the on-disk docs instead:
  - Framework docs: `/home/takazudo/repos/zp/zfb/docs/src/content/docs/` (getting-started/\*, concepts/routing.mdx, concepts/islands.mdx, concepts/styling.mdx)
  - Example project: `/home/takazudo/repos/zfb-ex/zfb-example-blog/README.md`
- Key config: `zfb.config.ts` in the project root (base path, plugins, output directory)
- Pages live in `pages/`, layouts in `layouts/`, interactive islands in `components/zfb/`
- JSX resolves to Preact: `jsxImportSource: "preact"` in tsconfig.json
- `react`/`react-dom` path aliases in tsconfig.json and vitest.config.ts map to `preact/compat` for library compatibility
