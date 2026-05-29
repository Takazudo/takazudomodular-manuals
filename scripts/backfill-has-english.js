#!/usr/bin/env node

// One-off backfill: add `hasEnglish` field to every committed manifest.json.
//
// For each public/{slug}/data/manifest.json, reads the JSON, checks whether
// the sibling pages-en.json exists, sets `hasEnglish` accordingly, and writes
// the file back IN PLACE. Every pre-existing key is preserved (read -> mutate
// one key -> write; the object is never reconstructed).
//
// Safe to re-run: a manifest that already carries `hasEnglish` is updated to
// reflect the current filesystem state (idempotent).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '..', 'public');

const slugDirs = readdirSync(PUBLIC_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let updated = 0;
let skipped = 0;

for (const slug of slugDirs) {
  const dataDir = join(PUBLIC_DIR, slug, 'data');
  const manifestPath = join(dataDir, 'manifest.json');

  if (!existsSync(manifestPath)) {
    skipped += 1;
    continue;
  }

  const raw = readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);

  const pagesEnPath = join(dataDir, 'pages-en.json');
  const hasEnglish = existsSync(pagesEnPath);

  manifest.hasEnglish = hasEnglish;

  // Write back with 2-space indent + trailing newline (matches prettier config)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  console.log(`updated ${slug}: hasEnglish=${hasEnglish}`);
  updated += 1;
}

console.log('');
console.log(`Updated ${updated} manifest(s), skipped ${skipped} (no manifest.json).`);
