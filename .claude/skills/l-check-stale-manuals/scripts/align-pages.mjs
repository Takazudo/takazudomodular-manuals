#!/usr/bin/env node
// Align new-revision pages to old-revision pages by normalized text (page-count-change triage).
// Greedy in-order matching; standalone <=3-digit tokens stripped so shifted page-number
// footers don't break the match. Aligned pages can reuse existing translations verbatim.
// Usage: node align-pages.mjs <old.pdf> <new.pdf>
// Output JSON: { oldTotal, newTotal, map: {"<newPage>": oldPage|null}, unmatched: [newPage...] }
import { normForAlign, pdfPages } from './_lib.mjs';

const [oldFile, newFile] = process.argv.slice(2);
if (!oldFile || !newFile) {
  console.error('usage: node align-pages.mjs <old.pdf> <new.pdf>');
  process.exit(1);
}

const oldPages = (await pdfPages(oldFile)).pages.map((p) => normForAlign(p.text));
const newPages = (await pdfPages(newFile)).pages.map((p) => normForAlign(p.text));

const map = {};
const unmatched = [];
let oldPtr = 0;
for (let i = 0; i < newPages.length; i++) {
  let found = -1;
  for (let j = oldPtr; j < oldPages.length; j++) {
    if (newPages[i] === oldPages[j]) {
      found = j;
      break;
    }
  }
  if (found >= 0) {
    map[i + 1] = found + 1;
    oldPtr = found + 1;
  } else {
    map[i + 1] = null;
    unmatched.push(i + 1);
  }
}
console.log(
  JSON.stringify({ oldTotal: oldPages.length, newTotal: newPages.length, map, unmatched }, null, 1),
);
