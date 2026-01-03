#!/usr/bin/env node

/**
 * Manual Page Screenshot Capture Script
 *
 * Captures all pages from the manual viewer at high resolution for visual verification.
 *
 * Usage:
 *   node scripts/capture.js
 *   node scripts/capture.js --pages 30
 *   node scripts/capture.js --base-url http://localhost:3100
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_CONFIG = {
  totalPages: 30,
  baseUrl: 'http://localhost:3100/manuals/oxi-one-mk2/page',
  viewport: { width: 2000, height: 1600 },
  timeout: 15000,
  waitAfterLoad: 2000,
  outputDir: null, // Will be set to __inbox/captures-{timestamp}
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--pages' && nextArg) {
      config.totalPages = parseInt(nextArg, 10);
      i++;
    } else if (arg === '--base-url' && nextArg) {
      config.baseUrl = nextArg;
      i++;
    } else if (arg === '--output-dir' && nextArg) {
      config.outputDir = nextArg;
      i++;
    }
  }

  return config;
}

/**
 * Create output directory
 */
function createOutputDir(baseDir = null) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const session = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  const dirname = `captures-${date}-${session}`;

  const outputDir = baseDir || path.join(process.cwd(), '__inbox', dirname);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

/**
 * Capture all manual pages
 */
async function captureAllPages(config) {
  const outputDir = createOutputDir(config.outputDir);

  console.log('📸 Capturing all manual pages...\n');
  console.log(`Configuration:`);
  console.log(`  Pages: ${config.totalPages}`);
  console.log(`  Viewport: ${config.viewport.width}x${config.viewport.height}`);
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Output: ${outputDir}\n`);

  let browser = null;
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: config.viewport,
    });
    const page = await context.newPage();

    for (let i = 1; i <= config.totalPages; i++) {
      const url = `${config.baseUrl}/${i}`;
      const filename = `page-${String(i).padStart(3, '0')}.png`;
      const filepath = path.join(outputDir, filename);

      try {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: config.timeout,
        });

        // Wait for content to render
        await page.waitForTimeout(config.waitAfterLoad);

        await page.screenshot({
          path: filepath,
          fullPage: false,
        });

        console.log(`✅ Page ${i}/${config.totalPages} captured: ${filename}`);
        results.success++;
      } catch (error) {
        console.error(`❌ Page ${i}/${config.totalPages} failed: ${error.message}`);
        results.failed++;
        results.errors.push({
          page: i,
          url,
          error: error.message,
        });
      }
    }

    await browser.close();
  } catch (error) {
    console.error('Fatal error:', error);
    if (browser) await browser.close();
    process.exit(1);
  }

  // Summary
  console.log('\n📊 Capture Summary');
  console.log('==================');
  console.log(`Total pages captured: ${results.success}/${config.totalPages}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Output directory: ${outputDir}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((err) => {
      console.log(`  - Page ${err.page}: ${err.error}`);
    });
  }

  // Write summary JSON
  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config,
        results,
        outputDir,
      },
      null,
      2,
    ),
  );

  return {
    outputDir,
    results,
  };
}

/**
 * Main execution
 */
async function main() {
  const config = parseArgs();

  try {
    const { outputDir: _outputDir, results } = await captureAllPages(config);

    if (results.failed > 0) {
      console.log('\n⚠️  Some captures failed. Check the summary above.');
      process.exit(1);
    } else {
      console.log('\n✅ All captures complete!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { captureAllPages };
