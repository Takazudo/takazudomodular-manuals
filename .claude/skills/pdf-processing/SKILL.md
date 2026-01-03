---
name: pdf-processing
description: >-
  Automate PDF manual conversion to Next.js app data. Splits PDFs into parts, renders pages to PNG,
  extracts text, translates to Japanese, and builds JSON datasets for the manual viewer application.
allowed-tools: Bash, Read, Glob, Grep
---

# PDF Processing Skill

Automated workflow for converting the OXI ONE MKII PDF manual into Next.js application data.

## ⚠️ CRITICAL: Process Adherence

**When using this skill, Claude Code MUST follow the documented process EXACTLY as written in `.claude/commands/pdf-process.md`.**

### Mandatory Rules:

1. **NEVER deviate from the documented translation process**
2. **NEVER use MCP Codex for translation** - Only use Task tool with manual-translator
3. **NEVER implement "improvements" mid-process** - Report them after completion
4. **ALWAYS use the worker pool pattern** as documented in the command file

See `.claude/commands/pdf-process.md` for detailed execution instructions.

## Overview

This skill guides the complete PDF processing pipeline:

1. **Split** - Divide PDF into manageable parts (30 pages each)
2. **Render** - Convert pages to PNG images at 150 DPI
3. **Extract** - Extract text from PDFs
4. **Translate** - Translate English to Japanese using Claude API
5. **Build** - Combine data into Next.js JSON structure
6. **Manifest** - Generate manifest.json with metadata
7. **Verify** - Run dev server and confirm page 1 displays correctly

## Quick Reference

### Run Full Pipeline

```bash
# Run all steps
pnpm run pdf:all
```

### Run Individual Steps

```bash
pnpm run pdf:split       # Step 1: Split PDF
pnpm run pdf:render      # Step 2: Render pages
pnpm run pdf:extract     # Step 3: Extract text
pnpm run pdf:translate   # Step 4: Translate (requires API key)
pnpm run pdf:build       # Step 5: Build JSON
pnpm run pdf:manifest    # Step 6: Create manifest
pnpm dev                 # Step 7: Run dev server for verification
```

### Verification Step

After completing the pipeline, verify the output:

```bash
# Start dev server
pnpm dev

# Open browser and verify
# http://localhost:3100/manuals/oxi-one-mk2/page/1
# Confirm page 1 displays with translation
```

## Requirements

- PDF file in `manual-pdf/` directory
- Claude Code CLI installed (for translation subagents)
- pnpm package manager

## Output Structure

```
manual-pdf/parts/            # Split PDF files
public/manual/pages/         # Rendered PNG images (150 DPI)
data/extracted/              # Extracted text
data/translations-draft/     # Translation drafts
data/translations/           # Final JSON files
  ├── manifest.json
  ├── part-01.json
  └── ...
```

## Configuration

Edit `pdf-config.json` to customize:

- Pages per part (default: 30)
- Image DPI (default: 150)
- Translation model
- Max retry attempts

## Error Handling

- Error reports saved to `__inbox/`
- Scripts can resume from failed step
- Retry logic for API failures (3 attempts)

## Performance

**Estimated time (280-page manual):**

- Total: 15-30 minutes
- Translation: 10-20 minutes (most time-consuming)

**Estimated cost:**

- Translation: $5-10 per full manual (Claude Sonnet 4.5)

## Detailed Documentation

See [WORKFLOWS.md](WORKFLOWS.md) for step-by-step details.

See `scripts/README-PDF-PROCESSING.md` for comprehensive documentation.
