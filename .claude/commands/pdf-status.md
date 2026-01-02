---
allowed-tools: Bash, Read, Glob
description: >-
  Check PDF processing pipeline status - verify which steps completed, count output files, and check
  for errors.
---

# PDF Processing Status

Check the current status of PDF processing and verify outputs.

## Status Check

### Input PDF

```bash
ls -lh manual-pdf/*.pdf 2>/dev/null || echo "❌ No PDF files found in manual-pdf/"
```

### Step 1: Split

```bash
echo "Split PDFs:"
ls -1 manual-pdf/parts/*.pdf 2>/dev/null | wc -l | xargs -I {} echo "  {} parts created"
```

### Step 2: Render

```bash
echo "Rendered images:"
find public/manual/pages -name "*.png" 2>/dev/null | wc -l | xargs -I {} echo "  {} PNG files"
```

### Step 3: Extract

```bash
echo "Extracted text:"
ls -1 data/extracted/*.txt 2>/dev/null | wc -l | xargs -I {} echo "  {} text files"
```

### Step 4: Translate

```bash
echo "Translation drafts:"
ls -1 data/translations-draft/*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} draft files"
```

### Step 5: Build

```bash
echo "Final JSON files:"
ls -1 data/translations/part-*.json 2>/dev/null | wc -l | xargs -I {} echo "  {} part files"
```

### Step 6: Manifest

```bash
echo "Manifest:"
if [ -f data/translations/manifest.json ]; then
  echo "  ✅ manifest.json exists"
else
  echo "  ❌ manifest.json not found"
fi
```

### Errors

```bash
echo "Recent errors:"
ls -1t __inbox/translation-error-*.json 2>/dev/null | head -3 || echo "  No error reports"
```

---

## Summary

Review the output above to see which processing steps have completed.

For detailed documentation, see `.claude/skills/pdf-processing/WORKFLOWS.md`
