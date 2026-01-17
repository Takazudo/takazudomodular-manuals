/**
 * PDF Config Resolver - Shared utility for multi-PDF support
 *
 * Parses CLI args, validates slug, finds source PDF, and computes all paths
 * from the slug to support multiple manuals in the same codebase.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

/**
 * Resolves manual configuration from CLI slug argument
 *
 * @param {string} rootDir - Root directory of the project
 * @returns {object} Configuration object with paths and settings
 * @throws {Error} If slug is missing, invalid, or PDF not found
 *
 * @example
 * const config = resolveManualConfig(process.cwd());
 * // Returns:
 * // {
 * //   slug: 'oxi-one-mk2',
 * //   sourcePdf: '/path/to/manual-pdf/oxi-one-mk2/OXI-ONE-MKII.pdf',
 * //   input: { pdfDirectory: 'manual-pdf/oxi-one-mk2', pdfPattern: '*.pdf' },
 * //   output: {
 * //     images: 'public/oxi-one-mk2/pages',           // Final (committed)
 * //     data: 'public/oxi-one-mk2/data',              // Final (committed)
 * //     splitPdf: 'temp-processing/oxi-one-mk2/split-pdf',        // Temp
 * //     extracted: 'temp-processing/oxi-one-mk2/extracted',       // Temp
 * //     translationsDraft: 'temp-processing/oxi-one-mk2/translations-draft' // Temp
 * //   },
 * //   legacy: { ... },  // Old paths for migration
 * //   settings: { ... }
 * // }
 */
export function resolveManualConfig(rootDir) {
  // Parse CLI args to find --slug argument
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf('--slug');

  if (slugIndex === -1 || !args[slugIndex + 1]) {
    throw new Error(
      '❌ Missing required --slug argument\n\n' +
        'Usage: node script.js --slug <manual-slug>\n' +
        'Example: node script.js --slug oxi-one-mk2',
    );
  }

  const slug = args[slugIndex + 1];

  // Validate slug format (prevent path traversal attacks)
  const slugPattern = /^[a-z0-9-]+$/i;

  if (!slugPattern.test(slug)) {
    throw new Error(
      `❌ Invalid slug format: "${slug}"\n\n` +
        'Slug must only contain:\n' +
        '  - Letters (a-z, A-Z)\n' +
        '  - Numbers (0-9)\n' +
        '  - Hyphens (-)\n\n' +
        'Path traversal patterns (../, ./, etc.) are not allowed.\n\n' +
        'Valid examples:\n' +
        '  ✅ oxi-one-mk2\n' +
        '  ✅ manual-v2\n' +
        '  ✅ ProductName-2024\n\n' +
        'Invalid examples:\n' +
        '  ❌ ../etc/passwd\n' +
        '  ❌ manual/v2\n' +
        '  ❌ .hidden',
    );
  }

  // Load settings from pdf-config.json
  const configPath = join(rootDir, 'pdf-config.json');

  if (!existsSync(configPath)) {
    throw new Error(
      `❌ Configuration file not found: ${configPath}\n\n` +
        'Please ensure pdf-config.json exists in the project root.',
    );
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    throw new Error(
      `❌ Failed to parse pdf-config.json: ${error.message}\n\n` +
        'Please ensure the file contains valid JSON.',
    );
  }

  // Validate that config has required settings
  if (!config.settings) {
    throw new Error(
      '❌ Invalid pdf-config.json: missing "settings" section\n\n' +
        'Please ensure pdf-config.json has a "settings" object.',
    );
  }

  // Find source PDF in manual-pdf/{slug}/
  const pdfDir = join(rootDir, 'manual-pdf', slug);
  const pdfPattern = join(pdfDir, '*.pdf');
  const pdfFiles = glob.sync(pdfPattern);

  if (pdfFiles.length === 0) {
    throw new Error(
      `❌ No PDF file found in: ${pdfDir}\n\n` +
        `Please ensure your PDF is located at:\n` +
        `  manual-pdf/${slug}/<filename>.pdf\n\n` +
        `Example:\n` +
        `  manual-pdf/${slug}/Manual.pdf`,
    );
  }

  const sourcePdf = pdfFiles[0];

  if (pdfFiles.length > 1) {
    console.warn(
      `⚠️  Multiple PDF files found in ${pdfDir}\n` +
        `   Using: ${sourcePdf}\n` +
        `   Other files: ${pdfFiles.slice(1).join(', ')}`,
    );
  }

  // Compute all paths from slug
  const paths = {
    slug,
    sourcePdf,
    input: {
      pdfDirectory: join('manual-pdf', slug),
      pdfPattern: '*.pdf',
    },
    output: {
      // Final output (committed to git)
      images: join('public', slug, 'pages'),
      data: join('public', slug, 'data'),
      // Temporary files (gitignored)
      splitPdf: join('temp-processing', slug, 'split-pdf'),
      extracted: join('temp-processing', slug, 'extracted'),
      translationsDraft: join('temp-processing', slug, 'translations-draft'),
    },
    // Legacy paths (for backward compatibility during migration)
    legacy: {
      pages: join('manual-pdf', slug, 'pages'),
      extracted: join('public', slug, 'processing', 'extracted'),
      translationsDraft: join('public', slug, 'processing', 'translations-draft'),
    },
  };

  // Return merged configuration
  return {
    ...paths,
    settings: config.settings,
    partConfig: config.partConfig,
  };
}
