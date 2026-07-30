// Shared helpers for the l-check-stale-manuals scripts.
// Resolves the repo root from this file's location so the scripts work from any cwd.
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// scripts/ -> l-check-stale-manuals/ -> skills/ -> .claude/ -> repo root
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

// pdf-parse and sharp come from the repo's node_modules
export const repoRequire = createRequire(join(ROOT, 'package.json'));

// Normalized per-page text of a PDF. pdf-parse v2: result.total = page count,
// result.pages[i].text = per-page text.
export async function pdfPages(file) {
  const { PDFParse } = repoRequire('pdf-parse');
  const parser = new PDFParse({ data: readFileSync(file) });
  const result = await parser.getText();
  await parser.destroy();
  return result;
}

export const normWhitespace = (s) => (s || '').replace(/\s+/g, ' ').trim();

// Normalization for cross-revision page alignment: additionally strips standalone
// numeric tokens up to 3 digits (page-number footers shift when pages are inserted).
export const normForAlign = (s) =>
  (s || '')
    .split(/\s+/)
    .filter((tok) => !/^\d{1,3}$/.test(tok))
    .join(' ')
    .trim();
