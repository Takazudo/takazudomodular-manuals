---
allowed-tools: Bash, Read
argument-hint:
  - all|split|render|extract|translate|build|manifest
description: >-
  Execute PDF processing pipeline steps. Use 'all' for full pipeline or specify individual step
  (split, render, extract, translate, build, manifest).
---

# PDF Processing Command

Execute individual steps or the full PDF processing pipeline.

## Usage

Run the requested step:

```bash
pnpm run pdf:{{ARGUMENTS}}
```

## Available Steps

- `all` - Run complete pipeline (split → render → extract → translate → build → manifest)
- `split` - Split PDF into parts (30 pages each)
- `render` - Render pages to PNG images (150 DPI)
- `extract` - Extract text from PDFs
- `translate` - Translate to Japanese (requires ANTHROPIC_API_KEY)
- `build` - Build final JSON files
- `manifest` - Create manifest.json

## Examples

- `/pdf-process all` - Full pipeline
- `/pdf-process split` - Just split the PDF
- `/pdf-process translate` - Just run translation

This will execute the selected step and show progress in the terminal.
