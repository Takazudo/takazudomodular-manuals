---
name: verify-translation
description: Capture all manual pages and verify translations match page images
invocable: user
---

# Translation Verification Command

Capture screenshots of all 30 manual pages and verify that translations match the page images.

## Purpose

Verify that each page's translation content matches its corresponding PDF image by:

1. Capturing high-resolution screenshots of all pages
2. Visually inspecting samples to confirm alignment
3. Checking for common issues (missing translations, page mismatches)

## Execution Steps

### 1. Ensure dev server is running

```bash
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/manuals/oxi-one-mk2/page/1 | grep -q "200"; then
  echo "⚠️  Dev server not running. Starting it now..."
  # Note: This is just a check. User should start manually if needed.
fi
```

### 2. Capture all pages using the skill

Use the `capture-all-pages` skill to take screenshots:

```
[Invoke Skill tool with skill="capture-all-pages"]
```

This will:

- Capture all 30 pages at 2000x1600 resolution
- Save to `__inbox/captures-{date}-{session}/`
- Report progress and completion

### 3. Verify sample pages

Read and analyze key pages to verify translation accuracy:

**Sample pages to check:**

- Page 1 (introduction)
- Page 10 (section divider)
- Page 15 (mid-section content)
- Page 21 (new section start)
- Page 30 (final page)

For each sample:

1. Read the screenshot image
2. Verify the left side (PDF image) matches the right side (translation)
3. Check for:
   - ✅ Translation is present
   - ✅ Page numbers match
   - ✅ Content corresponds (e.g., if image shows "3.5 Mute Behavior", translation should be about mute behavior)
   - ❌ No missing translations
   - ❌ No page number mismatches

### 4. Report findings

Create a verification report:

```markdown
## Translation Verification Report

**Date:** {current_date}
**Pages verified:** 30/30
**Capture directory:** __inbox/captures-{date}-{session}/

### Sample Verification Results

| Page | Image Content | Translation | Status |
|------|--------------|-------------|--------|
| 1    | Workflow 2.2 | ワークフロー 2.2 | ✅ Match |
| 10   | Section divider | セクション区切り | ✅ Match |
| 15   | Sequencer Grid | グリッド表示 | ✅ Match |
| 21   | Step Sequencing | ステップシーケンス | ✅ Match |
| 30   | Logic Conditions | ロジック条件 | ✅ Match |

### Issues Found

- None (or list any mismatches)

### Recommendations

- {Any recommendations for improvements}
```

### 5. Summary

Provide concise summary:

- Total pages verified
- Issues found (if any)
- Location of captures for manual review

## Expected Output

```
📸 Translation Verification
===========================

✅ Captured all 30 pages at 2000x1600
✅ Verified 5 sample pages - all match correctly
✅ No translation mismatches found

Capture directory: __inbox/captures-20260103-163245/

Sample verifications:
- Page 1: Workflow 2.2 ✅
- Page 10: Section divider ✅
- Page 15: Sequencer Grid ✅
- Page 21: Step Sequencing ✅
- Page 30: Logic Conditions ✅

All translations correctly match their page images.
```

## Notes

- This verification is visual, not automated
- Claude reads the images to verify content alignment
- High resolution (2000x1600) allows detailed inspection
- Captures saved to `__inbox/` (gitignored, won't be committed)
- Can be run after any translation pipeline updates
