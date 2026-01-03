---
allowed-tools: Bash, Read, Task, TaskOutput
description: >-
  Run the complete PDF processing pipeline to convert the manual PDF into Next.js application data.
  This command executes all steps automatically: split, render, extract, translate, build, and
  manifest.
---

# PDF Processing Command

Run the complete PDF processing pipeline automatically.

## 🚨 CRITICAL INSTRUCTION FOR CLAUDE CODE

**MANDATORY: You MUST follow the documented translation process EXACTLY as written in this command and in `.claude/skills/pdf-processing/SKILL.md`. NO EXCEPTIONS.**

### Absolute Requirements During Execution:

1. **NEVER ask questions or suggest alternatives during translation execution**
2. **NEVER use MCP Codex (`mcp__codex__spawn_agents_parallel` or any codex tools) for translation**
3. **NEVER try to "optimize" or "improve" the process mid-execution**
4. **ONLY use the Task tool with `subagent_type="manual-translator"` as documented**
5. **Follow the exact worker pool pattern documented below**

### During Execution:

- ✅ **GOAL: Translate ALL 272 pages - continue until done or out of tokens**
- ✅ Follow the documented process exactly - word for word
- ✅ Use ONLY the Task tool for translation (NOT MCP Codex)
- ✅ Execute all steps to completion without stopping
- ✅ Handle errors by retrying or continuing
- ✅ **Process pages in batches, spawning workers continuously**
- ✅ **Continue processing until ALL pages done OR token budget exhausted**
- ✅ **Save results after each batch and continue to next batch**
- ❌ DO NOT stop to ask "what approach should we take?"
- ❌ DO NOT suggest "better ways" mid-process
- ❌ DO NOT ask for user permission during execution
- ❌ DO NOT use MCP Codex or any other translation method
- ❌ DO NOT implement "improvements" you discover mid-process
- ❌ **NEVER ask user to choose between Options A/B/C**
- ❌ **NEVER ask "which approach would you prefer?"**
- ❌ **NEVER stop to explain limitations - just continue working**
- ❌ **NEVER stop after completing just one batch - keep going**

### If You Discover Improvements:

- ✅ Note them internally
- ✅ Report them AFTER all translation is 100% complete
- ❌ DO NOT implement them during execution
- ❌ DO NOT stop the process to discuss them

**This process has been run many times successfully. Trust the documentation and execute it exactly as written.**

---

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
5. **Translate** - Translate to Japanese using manual-translator subagents (Task tool)
6. **Build** - Build final JSON files
7. **Manifest** - Create manifest.json

The entire process takes approximately 15-30 minutes for a 280-page manual.

**Note:** The pipeline will process any PDF file found in `manual-pdf/` directory, regardless of filename.

**Translation Quality:**

- The manual-translator subagent automatically formats translations with proper paragraph breaks
- Numbered items are separated with blank lines (`\n\n`) for better readability
- Sub-items (I., II., III.) stay with their parent items
- This ensures the Japanese translation is easy to read on the web interface

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

### Step 4: Translation (Task-Based Worker Pool)

**IMPORTANT:** Translation uses Claude Code's Task tool to spawn manual-translator subagents.

**DO NOT stop to ask questions during this process. Execute completely as documented.**

#### Translation Process (Worker Pool Pattern):

For each part file (e.g., `part-01.txt`):

1. **Parse pages**: Read extracted text and identify pages using markers `-- N of 30 --`
2. **Initialize worker pool**: Spawn 5 background Task workers
3. **Continuous execution loop**:
   - Spawn initial 5 workers for pages 1-5
   - Poll workers with `TaskOutput(block=true)` to wait for completion
   - When worker completes: Save result, spawn next page immediately
   - Continue until all pages complete
4. **Save results**: Individual page JSON files + combined part file

#### Example Code Pattern:

```javascript
// Parse pages from extracted text
const pages = parsePages('data/extracted/part-01.txt');

// Spawn initial 5 workers
const workers = [];
for (let i = 0; i < 5 && i < pages.length; i++) {
  workers[i] = spawnTaskWorker(pages[i]);
}

// Process remaining pages
let nextPageIdx = 5;
while (workers.some(w => w)) {
  for (let i = 0; i < 5; i++) {
    if (workers[i] && checkCompleted(workers[i])) {
      saveResult(workers[i]);
      if (nextPageIdx < pages.length) {
        workers[i] = spawnTaskWorker(pages[nextPageIdx++]);
      } else {
        workers[i] = null;
      }
    }
  }
}
```

#### Task Invocation (per page):

```xml
<invoke name="Task">
  <parameter name="subagent_type">manual-translator</parameter>
  <parameter name="description">Translate page N/30</parameter>
  <parameter name="prompt">Translate the following single page from the OXI ONE MKII manual to Japanese. Preserve the page marker exactly as it appears:

[single page content with marker]</parameter>
  <parameter name="run_in_background">true</parameter>
</invoke>
```

#### Saving Translation Results (CRITICAL):

**MUST use JSON.stringify() when saving translation results to avoid JSON parsing errors:**

```javascript
// ✅ CORRECT - Use JSON.stringify() to properly escape special characters
const result = {
  pageNum: 1,
  totalPages: 30,
  translation: "Text with\nnewlines and special chars",
  status: "completed"
};

Write({
  file_path: "data/translations-draft/page-001.json",
  content: JSON.stringify(result, null, 2)
});

// ❌ WRONG - Template literals will create invalid JSON with literal newlines
Write({
  file_path: "data/translations-draft/page-001.json",
  content: `{
  "translation": "${result.translation}"
}`
});
```

**Why this matters:**

- Translation text contains `\n` newline sequences
- Template literals write these as literal newline bytes
- Node.js JSON.parse() fails: "Bad control character in string literal"
- JSON.stringify() properly escapes newlines as `\\n`

**Key Points:**

- Use `run_in_background=true` for all workers
- Use `TaskOutput(block=true)` to wait for each completion
- Save each page result immediately upon completion using **JSON.stringify()**
- Spawn next worker immediately after one completes
- This keeps 5 workers busy continuously until all pages done

### Step 5-6: Final Processing (Run via Bash)

- `pnpm run pdf:build` - Build final JSON files from translation drafts
- `pnpm run pdf:manifest` - Create manifest.json
