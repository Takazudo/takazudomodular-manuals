#!/usr/bin/env node
/**
 * Generate doc-titles.json mapping doc IDs to display titles.
 * Reads all markdown files in docs/ and extracts titles from
 * frontmatter or first h1 heading.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../src/data/doc-titles.json');

/**
 * Recursively find all .md and .mdx files
 */
function findMarkdownFiles(dirPath) {
  const results = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract title from a markdown file (frontmatter > h1 > filename)
 */
function extractTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Try frontmatter first
  try {
    const { data } = matter(content);
    if (data.title) {
      return data.title;
    }
  } catch (e) {
    // Ignore frontmatter parse errors
  }

  // Fall back to first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fall back to filename
  const basename = path.basename(filePath, path.extname(filePath));
  if (basename === 'index') {
    return path.basename(path.dirname(filePath));
  }
  return basename;
}

/**
 * Get doc ID from file path (relative to docs dir, without extension)
 */
function getDocId(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  return relativePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
}

function main() {
  console.log('Generating doc-titles.json...');

  const files = findMarkdownFiles(DOCS_DIR);
  const docTitles = {};

  for (const file of files) {
    const docId = getDocId(file);
    const title = extractTitle(file);
    docTitles[docId] = title;
  }

  // Sort by key for consistent output
  const sorted = {};
  for (const key of Object.keys(docTitles).sort()) {
    sorted[key] = docTitles[key];
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2) + '\n');

  console.log(`  Generated ${Object.keys(sorted).length} entries`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

main();
