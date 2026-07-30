#!/usr/bin/env node
// Per-page normalized-text diff between two PDFs (same-page-count triage).
// Usage: node pdf-page-diff.mjs <old.pdf> <new.pdf>
// Prints page counts, the list of changed page numbers, and old/new text excerpts per changed page.
import { normWhitespace, pdfPages } from './_lib.mjs';

const [oldFile, newFile] = process.argv.slice(2);
if (!oldFile || !newFile) {
  console.error('usage: node pdf-page-diff.mjs <old.pdf> <new.pdf>');
  process.exit(1);
}

const a = (await pdfPages(oldFile)).pages.map((p) => normWhitespace(p.text));
const b = (await pdfPages(newFile)).pages.map((p) => normWhitespace(p.text));
console.log(`old pages: ${a.length}, new pages: ${b.length}`);
const n = Math.max(a.length, b.length);
const changed = [];
for (let i = 0; i < n; i++) {
  if (a[i] !== b[i]) changed.push(i + 1);
}
if (!changed.length) {
  console.log('no per-page text differences');
} else {
  console.log(`changed pages (${changed.length}): ${changed.join(', ')}`);
  for (const p of changed) {
    console.log(`\n===== page ${p} =====`);
    console.log(`--- old: ${(a[p - 1] || '').slice(0, 2000)}`);
    console.log(`+++ new: ${(b[p - 1] || '').slice(0, 2000)}`);
  }
}
