#!/usr/bin/env node

/**
 * Lightweight Page Capture Script for Translation Verification
 *
 * Based on headless-browser skill pattern - uses direct Playwright scripting
 * instead of MCP Playwright for much lower token consumption.
 *
 * Usage:
 *   node .claude/skills/verify-translation/scripts/capture-pages.js --slug oxi-e16-manual --pages 74
 *   node .claude/skills/verify-translation/scripts/capture-pages.js --slug oxi-coral --pages 46 --port 8030
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Default configuration
const DEFAULT_CONFIG = {
  port: 8030, // Production build serve port
  baseUrl: 'http://localhost',
  basePath: '/manuals',
  viewport: { width: 2000, height: 1600 }, // High resolution for verification
  timeoutMs: 30000,
  waitAfterLoad: 2000,
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--slug' && nextArg) {
      config.slug = nextArg;
      i++;
    } else if (arg === '--pages' && nextArg) {
      config.totalPages = parseInt(nextArg, 10);
      i++;
    } else if (arg === '--port' && nextArg) {
      config.port = parseInt(nextArg, 10);
      i++;
    } else if (arg === '--output-dir' && nextArg) {
      config.outputDir = nextArg;
      i++;
    }
  }

  return config;
}

/**
 * Capture all pages
 */
async function captureAllPages(config) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  if (!mergedConfig.slug) {
    console.error('Error: --slug is required');
    console.error('Usage: node capture-pages.js --slug oxi-e16-manual --pages 74');
    process.exit(1);
  }

  if (!mergedConfig.totalPages) {
    console.error('Error: --pages is required');
    console.error('Usage: node capture-pages.js --slug oxi-e16-manual --pages 74');
    process.exit(1);
  }

  // Create output directory
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sessionId = Date.now().toString(36);
  const outputDir =
    mergedConfig.outputDir ||
    path.join(process.cwd(), `__inbox/verify-${mergedConfig.slug}-${timestamp}-${sessionId}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.error(`📸 Capturing ${mergedConfig.totalPages} pages`);
  console.error(`📁 Output: ${outputDir}`);
  console.error(`🌐 Base URL: ${mergedConfig.baseUrl}:${mergedConfig.port}`);
  console.error('');

  let browser = null;
  let context = null;
  let page = null;

  const results = {
    slug: mergedConfig.slug,
    totalPages: mergedConfig.totalPages,
    outputDir,
    captured: [],
    failed: [],
    startTime: new Date().toISOString(),
  };

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });

    context = await browser.newContext({
      viewport: mergedConfig.viewport,
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();

    // Block heavy resources for faster capture
    await page.route('**/*.{mp4,webm,woff,woff2,ttf,eot}', (route) => {
      route.abort();
    });

    // Capture each page
    for (let pageNum = 1; pageNum <= mergedConfig.totalPages; pageNum++) {
      const pageStr = String(pageNum).padStart(3, '0');
      const url = `${mergedConfig.baseUrl}:${mergedConfig.port}${mergedConfig.basePath}/${mergedConfig.slug}/page/${pageNum}`;
      const filename = `page-${pageStr}.png`;
      const filepath = path.join(outputDir, filename);

      try {
        // Navigate to page
        await page.goto(url, {
          timeout: mergedConfig.timeoutMs,
          waitUntil: 'networkidle',
        });

        // Wait for content to render
        await page.waitForTimeout(mergedConfig.waitAfterLoad);

        // Take screenshot
        await page.screenshot({
          path: filepath,
          fullPage: true,
          type: 'png',
        });

        results.captured.push({ pageNum, filename });
        process.stderr.write(`   ✅ Page ${pageNum}/${mergedConfig.totalPages}\r`);
      } catch (error) {
        results.failed.push({
          pageNum,
          error: error.message,
        });
        console.error(`\n   ❌ Page ${pageNum}: ${error.message}`);
      }
    }

    console.error(''); // New line after progress
  } finally {
    // Cleanup
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }

  results.endTime = new Date().toISOString();
  results.durationMs = new Date(results.endTime) - new Date(results.startTime);

  // Save summary
  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

  // Output results
  console.error('');
  console.error('='.repeat(50));
  console.error(`✨ Capture complete!`);
  console.error(`   Captured: ${results.captured.length}/${mergedConfig.totalPages}`);
  console.error(`   Failed: ${results.failed.length}`);
  console.error(`   Duration: ${(results.durationMs / 1000).toFixed(1)}s`);
  console.error(`   Output: ${outputDir}`);

  // Output JSON to stdout for parsing
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Execute
captureAllPages(parseArgs()).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
