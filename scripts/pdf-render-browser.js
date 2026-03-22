#!/usr/bin/env node

/**
 * Re-render a manual's pages using Playwright (browser-based PDF rendering).
 * Handles complex PDFs that pdfjs-dist/node can't render correctly.
 *
 * Usage: node scripts/pdf-render-browser.js --slug ryk-algo
 */

import { existsSync, readdirSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const slugIdx = process.argv.indexOf('--slug');
const slug = slugIdx !== -1 ? process.argv[slugIdx + 1] : null;
if (!slug) {
  console.error('Usage: node scripts/pdf-render-browser.js --slug <slug>');
  process.exit(1);
}

const DPI = 300;
const SCALE = DPI / 96;

async function renderPages() {
  const pdfDir = join(ROOT_DIR, 'manual-pdf', slug);
  if (!existsSync(pdfDir)) {
    console.error(`PDF dir not found: ${pdfDir}`);
    process.exit(1);
  }

  const pdfFile = readdirSync(pdfDir).find((f) => f.endsWith('.pdf'));
  if (!pdfFile) {
    console.error(`No PDF found in ${pdfDir}`);
    process.exit(1);
  }

  const pdfPath = resolve(pdfDir, pdfFile);
  const outputDir = join(ROOT_DIR, 'public', slug, 'pages');
  mkdirSync(outputDir, { recursive: true });

  console.log(`Rendering: ${pdfPath}`);
  console.log(`Output: ${outputDir}`);
  console.log(`DPI: ${DPI} (scale: ${SCALE.toFixed(2)}x)`);

  // Serve PDF via local HTTP server
  const pdfData = readFileSync(pdfPath);
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfData.length,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(pdfData);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const pdfUrl = `http://127.0.0.1:${port}/manual.pdf`;
  console.log(`Serving PDF at ${pdfUrl}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: SCALE,
  });
  const page = await context.newPage();

  await page.setContent(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; }
  body { background: white; }
  canvas { display: block; }
</style></head>
<body><canvas id="canvas"></canvas>
<script type="module">
  const pdfjsVersion = '4.9.155';
  const cdnBase = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + pdfjsVersion;
  const pdfjsLib = await import(cdnBase + '/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = cdnBase + '/pdf.worker.min.mjs';
  window._pdfjsLib = pdfjsLib;
  window._ready = true;
</script></body></html>`);

  await page.waitForFunction(() => window._ready === true, null, {
    timeout: 15000,
  });

  // Load the PDF document once
  const totalPages = await page.evaluate(async (url) => {
    window._doc = await window._pdfjsLib.getDocument(url).promise;
    return window._doc.numPages;
  }, pdfUrl);

  console.log(`Pages: ${totalPages}`);

  for (let i = 1; i <= totalPages; i++) {
    await page.evaluate(async (pageNum) => {
      const pg = await window._doc.getPage(pageNum);
      const viewport = pg.getViewport({ scale: 1 });
      const canvas = document.getElementById('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pg.render({ canvasContext: ctx, viewport }).promise;
    }, i);

    const canvas = page.locator('#canvas');
    const pageNum = String(i).padStart(3, '0');
    const outPath = join(outputDir, `page-${pageNum}.png`);
    await canvas.screenshot({ path: outPath });
    process.stdout.write(`  Page ${i}/${totalPages}\r`);
  }

  await browser.close();
  server.close();
  console.log(`\nDone! Rendered ${totalPages} pages.`);
}

renderPages().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
