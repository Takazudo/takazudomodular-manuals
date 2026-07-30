#!/usr/bin/env node
// Build the committed-manual inventory: slug, brand, PDF path, sha256, page count, updatedAt.
// Usage: node build-inventory.mjs [slug ...]   (no args = all manuals)
// Output: TSV on stdout.
import { createHash } from 'crypto';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ROOT, pdfPages } from './_lib.mjs';

const args = process.argv.slice(2);
const allSlugs = readdirSync(join(ROOT, 'manual-pdf'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const slugs = args.length ? args : allSlugs;

console.log('slug\tbrand\tpdf\tsha256\tpages\tupdatedAt');
for (const slug of slugs) {
  const dir = join(ROOT, 'manual-pdf', slug);
  const pdf = readdirSync(dir).find((f) => f.toLowerCase().endsWith('.pdf'));
  if (!pdf) {
    console.error(`WARN: no PDF in manual-pdf/${slug}/`);
    continue;
  }
  const pdfPath = join(dir, pdf);
  const buf = readFileSync(pdfPath);
  const sha = createHash('sha256').update(buf).digest('hex');
  const manifestPath = join(ROOT, 'public', slug, 'data', 'manifest.json');
  let brand = '?';
  let updatedAt = '?';
  if (existsSync(manifestPath)) {
    const m = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    brand = m.brand ?? '?';
    updatedAt = m.updatedAt ?? '?';
  }
  const parsed = await pdfPages(pdfPath);
  console.log(
    `${slug}\t${brand}\tmanual-pdf/${slug}/${pdf}\t${sha}\t${parsed.total}\t${updatedAt}`,
  );
}
