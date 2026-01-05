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

Run with a manual slug:

```
/pdf-process <slug>
```

## Parameters

- `slug`: Manual slug (e.g., oxi-one-mk2, oxi-coral)

## Examples

```
/pdf-process oxi-one-mk2
/pdf-process oxi-coral
```

## What This Does

This will execute all pipeline steps in order:

1. **Validate** - Check slug parameter and source directory
2. **Clean** - Remove all existing generated files (images, data, split PDFs)
3. **Split** - Split PDF into parts (30 pages each)
4. **Render** - Render pages to PNG images (150 DPI)
5. **Extract** - Extract text from PDFs
6. **Translate** - Translate to Japanese using manual-translator subagents (Task tool)
7. **Build** - Build final JSON files
8. **Manifest** - Create manifest.json

The entire process takes approximately 15-30 minutes for a 280-page manual.

## Implementation Logic

**BEFORE starting the pipeline, Claude Code MUST perform these validation steps:**

```bash
# 1. Extract slug from command arguments
SLUG=$1

# 2. Validate slug is provided
if [ -z "$SLUG" ]; then
  echo "❌ Error: Manual slug required"
  echo "Usage: /pdf-process <slug>"
  echo ""
  echo "Examples:"
  echo "  /pdf-process oxi-one-mk2"
  echo "  /pdf-process oxi-coral"
  exit 1
fi

# 3. Validate slug format (only lowercase letters, numbers, and hyphens)
if ! [[ "$SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo "❌ Error: Invalid slug format: $SLUG"
  echo "Slug must contain only lowercase letters, numbers, and hyphens"
  echo ""
  echo "Valid examples:"
  echo "  oxi-one-mk2 ✅"
  echo "  oxi-coral ✅"
  echo "  My-Manual ❌ (contains uppercase)"
  echo "  ../etc/passwd ❌ (contains special characters)"
  exit 1
fi

# 4. Check source directory exists
if [ ! -d "manual-pdf/$SLUG" ]; then
  echo "❌ Error: Source directory not found: manual-pdf/$SLUG"
  echo ""
  echo "Please create the directory and add a PDF file:"
  echo "  mkdir -p manual-pdf/$SLUG"
  echo "  cp /path/to/manual.pdf manual-pdf/$SLUG/"
  exit 1
fi

# 5. Check if PDF file exists in source directory
PDF_COUNT=$(find "manual-pdf/$SLUG" -maxdepth 1 -name "*.pdf" | wc -l)
if [ "$PDF_COUNT" -eq 0 ]; then
  echo "❌ Error: No PDF file found in manual-pdf/$SLUG"
  echo ""
  echo "Please add a PDF file to the directory:"
  echo "  cp /path/to/manual.pdf manual-pdf/$SLUG/"
  exit 1
fi

# 6. All validations passed - proceed with pipeline
echo "✅ Validation successful"
echo "Processing manual: $SLUG"
echo ""
```

**THEN run the pipeline with the slug parameter:**

```bash
pnpm run pdf:all --slug "$SLUG"
```

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

- `pnpm run pdf:clean --slug <slug>` - Remove all generated files for the specified manual

This ensures no stale data from previous runs interferes with the new processing.

### Step 1-3: Basic Processing (Run via Bash)

These steps can be run directly using pnpm with the --slug parameter:

- `pnpm run pdf:split --slug <slug>` - Split PDF into parts (30 pages each)
- `pnpm run pdf:render --slug <slug>` - Render pages to PNG images (150 DPI)
- `pnpm run pdf:extract --slug <slug>` - Extract text from PDFs

**Note:** All commands now require the --slug parameter to specify which manual to process.

### Step 4: Translation (Optimized Worker Pool with Direct File Writing)

**IMPORTANT:** Translation uses Claude Code's Task tool to spawn manual-translator subagents.

**DO NOT stop to ask questions during this process. Execute completely as documented.**

#### Translation Process (Optimized Workflow):

**Key Optimization:** Subagents write translation files directly instead of returning full text to main agent. This significantly reduces token consumption in main agent context.

**Workflow:**

1. **Prepare file paths**: For each page, determine source text file and output JSON file paths
2. **Spawn workers**: Create 5 concurrent background Task workers
3. **Workers execute autonomously**:
   - Each worker receives source file path and output file path
   - Worker reads source text using Read tool
   - Worker translates content following manual-translator guidelines
   - Worker writes JSON result directly to output file using Write tool
   - Worker returns only brief status message (not full translation text)
4. **Main agent verification**:
   - Wait for all workers to complete
   - Verify all output JSON files exist
   - Retry any failures with new workers

#### Example Implementation:

```javascript
// Prepare all page file paths
const slug = 'oxi-coral';
const totalPages = 46;
const workers = [];

// Spawn 5 concurrent workers
const MAX_CONCURRENT = 5;
for (let i = 0; i < Math.min(MAX_CONCURRENT, totalPages); i++) {
  const pageNum = i + 1;
  workers.push(spawnTranslationWorker(slug, pageNum, totalPages));
}

// Continue spawning workers as they complete
let nextPage = MAX_CONCURRENT + 1;
while (workers.some(w => w)) {
  for (let i = 0; i < workers.length; i++) {
    if (workers[i] && checkCompleted(workers[i])) {
      if (nextPage <= totalPages) {
        workers[i] = spawnTranslationWorker(slug, nextPage++, totalPages);
      } else {
        workers[i] = null;
      }
    }
  }
}

// Verify all files exist
const failures = verifyTranslationFiles(slug, totalPages);

// Retry failures
if (failures.length > 0) {
  retryFailedPages(failures);
}
```

#### Task Invocation (per page):

**CRITICAL:** Pass file paths to the subagent, NOT the page content.

```xml
<invoke name="Task">
  <parameter name="subagent_type">manual-translator</parameter>
  <parameter name="description">Translate page 1/46</parameter>
  <parameter name="prompt">Translate page 1 of the OXI CORAL manual.

Source text file:
/Users/takazudo/repos/personal/manual-oxi-one-mk2/public/manuals/oxi-coral/processing/extracted/page-001.txt

Output JSON file:
/Users/takazudo/repos/personal/manual-oxi-one-mk2/public/manuals/oxi-coral/processing/translations-draft/page-001.json

Page: 1
Total pages: 46

Read the source file, translate the content, and write the JSON result directly to the output file using JSON.stringify() for proper escaping. Return only a brief status message.</parameter>
  <parameter name="run_in_background">true</parameter>
</invoke>
```

#### Verification and Retry:

After all workers complete, verify and retry:

```javascript
function verifyTranslationFiles(slug, totalPages) {
  const failures = [];
  for (let i = 1; i <= totalPages; i++) {
    const pageStr = String(i).padStart(3, '0');
    const outputFile = `public/manuals/${slug}/processing/translations-draft/page-${pageStr}.json`;

    if (!fs.existsSync(outputFile)) {
      failures.push(i);
    }
  }
  return failures;
}

function retryFailedPages(failures) {
  for (const pageNum of failures) {
    // Spawn retry worker
    spawnTranslationWorker(slug, pageNum, totalPages);
  }
}
```

**Key Benefits:**

- ✅ **Token savings**: Workers return only status messages, not full translations
- ✅ **Autonomous execution**: Workers handle file I/O independently
- ✅ **Verification**: Main agent checks all files exist after completion
- ✅ **Retry logic**: Automatic retry for failed translations
- ✅ **Scalability**: Can process hundreds of pages without token overflow

**Key Points:**

- Use `run_in_background=true` for all workers
- Pass file paths, not content, to workers
- Workers use Read and Write tools directly
- Main agent verifies all files after completion
- Retry any missing files automatically

### Step 5-6: Final Processing (Run via Bash)

- `pnpm run pdf:build --slug <slug>` - Build final JSON files from translation drafts
- `pnpm run pdf:manifest --slug <slug>` - Create manifest.json

**Note:** Both commands require the --slug parameter to specify which manual to process.
