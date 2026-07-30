#!/usr/bin/env node
// Surgical refresh (page count UNCHANGED): merge translation drafts for specific pages
// into public/<slug>/data/pages-ja.json / pages-en.json in place.
// Drafts come from manual-translator agents at temp-processing/<slug>/translations-draft/page-NNN.json
// (fields: translation, en_clean). Run pdf:md-to-html + pdf:search-index + pdf:manifest afterwards.
// Usage: node merge-drafts.mjs <slug> <pageNum> [<pageNum>...]
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ROOT } from './_lib.mjs';

const [slug, ...nums] = process.argv.slice(2);
if (!slug || !nums.length) {
  console.error('usage: node merge-drafts.mjs <slug> <pageNum>...');
  process.exit(1);
}

const jaPath = join(ROOT, 'public', slug, 'data', 'pages-ja.json');
const enPath = join(ROOT, 'public', slug, 'data', 'pages-en.json');
const ja = JSON.parse(readFileSync(jaPath, 'utf-8'));
const en = JSON.parse(readFileSync(enPath, 'utf-8'));

const now = new Date().toISOString();
for (const numStr of nums) {
  const num = parseInt(numStr, 10);
  const pad = String(num).padStart(3, '0');
  const draft = JSON.parse(
    readFileSync(
      join(ROOT, 'temp-processing', slug, 'translations-draft', `page-${pad}.json`),
      'utf-8',
    ),
  );
  if (draft.pageNum !== num) throw new Error(`draft pageNum mismatch for page ${num}`);
  if (typeof draft.translation !== 'string' || typeof draft.en_clean !== 'string')
    throw new Error(`draft for page ${num} missing translation/en_clean strings`);

  const jaPage = ja.pages.find((p) => p.pageNum === num);
  const enPage = en.pages.find((p) => p.pageNum === num);
  if (!jaPage || !enPage) throw new Error(`page ${num} not found in JSONs`);

  jaPage.content = draft.translation;
  jaPage.hasContent = draft.translation.trim() !== '';
  enPage.content = draft.en_clean;
  enPage.hasContent = draft.en_clean.trim() !== '';
  console.log(
    `merged page ${num}: ja ${draft.translation.length} chars, en ${draft.en_clean.length} chars`,
  );
}

ja.metadata.processedAt = now;
en.metadata.processedAt = now;
if (en.metadata.cleanedAt) en.metadata.cleanedAt = now;

writeFileSync(jaPath, JSON.stringify(ja, null, 2), 'utf-8');
writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf-8');
console.log('written pages-ja.json and pages-en.json');
