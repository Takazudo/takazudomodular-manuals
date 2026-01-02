---
allowed-tools: Bash, Read, Task, TaskOutput
description: >-
  Run the complete PDF processing pipeline to convert the manual PDF into Next.js application data.
  This command executes all steps automatically: split, render, extract, translate, build, and
  manifest.
---

# PDF Processing Command

Run the complete PDF processing pipeline automatically.

## Usage

Simply run:

```
/pdf-process
```

This will execute all pipeline steps in order:

1. **Clean** - Remove all existing generated files (images, data, split PDFs)
2. **Split** - Split PDF into parts (30 pages each)
3. **Render** - Render pages to PNG images (150 DPI)
4. **Extract** - Extract text from PDFs
5. **Translate** - Translate to Japanese using manual-translator subagents
6. **Build** - Build final JSON files
7. **Manifest** - Create manifest.json

The entire process takes approximately 15-30 minutes for a 280-page manual.

**Note:** The pipeline will process any PDF file found in `manual-pdf/` directory, regardless of filename.

---

## Internal Steps (For Claude Code Reference Only)

The pipeline consists of the following steps. **Users should not invoke these individually** - they are documented here for Claude Code's internal use only.

### Step 0: Clean (Run via Bash)

**ALWAYS run this first to ensure clean state:**

- `pnpm run pdf:clean` - Remove all generated files (images, extracted text, translations, split PDFs)

This ensures no stale data from previous runs interferes with the new processing.

### Step 1-3: Basic Processing (Run via Bash)

These steps can be run directly using pnpm:

- `pnpm run pdf:split` - Split PDF into parts (30 pages each) - processes first PDF found alphabetically
- `pnpm run pdf:render` - Render pages to PNG images (150 DPI)
- `pnpm run pdf:extract` - Extract text from PDFs

### Step 4: Translation (Special Handling Required)

**IMPORTANT:** The translation step MUST use Claude Code's manual-translator subagents, NOT the script.

#### Translation Process:

1. Read all `data/extracted/part-*.txt` files
2. For each part file:
   - Spawn a `manual-translator` subagent using the Task tool
   - Pass the extracted text with proper formatting (include page markers "-- N of 30 --")
   - Run multiple translations in parallel (recommended: 4 at a time)
3. Save each translation result to `data/translations-draft/part-*.json` with structure:
   ```json
   {
     "part": "01",
     "pageRange": [1, 30],
     "translation": "translated text with page markers",
     "metadata": {
       "method": "claude-code-subagent",
       "translatedAt": "ISO timestamp"
     }
   }
   ```

#### Example Task invocation:

```xml
<invoke name="Task">
  <parameter name="subagent_type">manual-translator</parameter>
  <parameter name="description">Translate part-01 to Japanese</parameter>
  <parameter name="prompt">Translate the following English text from the OXI ONE MKII manual to Japanese. Preserve all page markers exactly as they appear (-- N of 30 --):

[extracted text from part-01.txt]</parameter>
  <parameter name="run_in_background">true</parameter>
</invoke>
```

### Step 5-6: Final Processing (Run via Bash)

- `pnpm run pdf:build` - Build final JSON files from translation drafts
- `pnpm run pdf:manifest` - Create manifest.json
