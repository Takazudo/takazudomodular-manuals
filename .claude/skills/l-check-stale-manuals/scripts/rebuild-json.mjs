#!/usr/bin/env node
// Full refresh (page count CHANGED): rebuild public/<slug>/data/pages-ja.json / pages-en.json.
// Aligned pages (align-pages.mjs map[newPage]=oldPage) reuse the old page's content verbatim;
// unmatched pages read temp-processing/<slug>/translations-draft/page-NNN.json.
// contentHtml for fresh pages is left empty — run pdf:md-to-html afterwards (plus
// pdf:search-index + pdf:manifest).
// Usage: node rebuild-json.mjs <slug> <alignJsonPath>
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ROOT } from './_lib.mjs';

const [slug, alignPath] = process.argv.slice(2);
if (!slug || !alignPath) {
  console.error('usage: node rebuild-json.mjs <slug> <align.json>');
  process.exit(1);
}
const align = JSON.parse(readFileSync(alignPath, 'utf-8'));

const jaPath = join(ROOT, 'public', slug, 'data', 'pages-ja.json');
const enPath = join(ROOT, 'public', slug, 'data', 'pages-en.json');
const oldJa = JSON.parse(readFileSync(jaPath, 'utf-8'));
const oldEn = JSON.parse(readFileSync(enPath, 'utf-8'));

const now = new Date().toISOString();
const pad = (n) => String(n).padStart(3, '0');

const newJaPages = [];
const newEnPages = [];
let reused = 0;
let fresh = 0;

for (let n = 1; n <= align.newTotal; n++) {
  const image = `/${slug}/pages/page-${pad(n)}.png`;
  const base = { pageNum: n, image, title: `Page ${n}`, sectionName: null, tags: [] };
  const oldNum = align.map[String(n)];
  if (oldNum != null) {
    const oj = oldJa.pages.find((p) => p.pageNum === oldNum);
    const oe = oldEn.pages.find((p) => p.pageNum === oldNum);
    if (!oj || !oe) throw new Error(`old page ${oldNum} missing in JSONs`);
    newJaPages.push({
      ...base,
      content: oj.content,
      hasContent: oj.hasContent,
      contentHtml: oj.contentHtml ?? '',
    });
    newEnPages.push({
      ...base,
      content: oe.content,
      hasContent: oe.hasContent,
      contentHtml: oe.contentHtml ?? '',
    });
    reused++;
  } else {
    const draft = JSON.parse(
      readFileSync(
        join(ROOT, 'temp-processing', slug, 'translations-draft', `page-${pad(n)}.json`),
        'utf-8',
      ),
    );
    if (typeof draft.translation !== 'string' || typeof draft.en_clean !== 'string')
      throw new Error(`draft for page ${n} missing translation/en_clean`);
    newJaPages.push({
      ...base,
      content: draft.translation,
      hasContent: draft.translation.trim() !== '',
      contentHtml: '',
    });
    newEnPages.push({
      ...base,
      content: draft.en_clean,
      hasContent: draft.en_clean.trim() !== '',
      contentHtml: '',
    });
    fresh++;
  }
}

oldJa.pages = newJaPages;
oldEn.pages = newEnPages;
oldJa.metadata.processedAt = now;
oldEn.metadata.processedAt = now;
if (oldEn.metadata.cleanedAt) oldEn.metadata.cleanedAt = now;

writeFileSync(jaPath, JSON.stringify(oldJa, null, 2), 'utf-8');
writeFileSync(enPath, JSON.stringify(oldEn, null, 2), 'utf-8');
console.log(`${slug}: rebuilt ${align.newTotal} pages (${reused} reused, ${fresh} fresh)`);
