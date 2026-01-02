#!/usr/bin/env node

/**
 * Generate placeholder images for manual pages
 * This creates simple SVG placeholders until actual PDF page images are available
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public/manual/part-01/pages');
const TOTAL_PAGES = 5; // For MVP, we have 5 sample pages

// Ensure directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Generate SVG placeholder for each page
for (let i = 1; i <= TOTAL_PAGES; i++) {
  const pageNum = i.toString().padStart(3, '0');
  const filename = `page_${pageNum}.svg`;
  const filepath = path.join(PUBLIC_DIR, filename);

  // Create a simple SVG placeholder
  const svg = `<svg width="1200" height="1600" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="1600" fill="#1a1a1a"/>
  <rect x="50" y="50" width="1100" height="1500" fill="#2a2a2a" stroke="#3a3a3a" stroke-width="2"/>
  <text x="600" y="800" font-family="Arial, sans-serif" font-size="48" fill="#666" text-anchor="middle">
    OXI ONE MKII Manual
  </text>
  <text x="600" y="870" font-family="Arial, sans-serif" font-size="36" fill="#555" text-anchor="middle">
    Part 01 - Page ${i}
  </text>
  <text x="600" y="950" font-family="Arial, sans-serif" font-size="24" fill="#444" text-anchor="middle">
    [Placeholder - Actual PDF page image will be placed here]
  </text>
</svg>`;

  fs.writeFileSync(filepath, svg, 'utf8');
  console.log(`Created: ${filename}`);
}

console.log(`\nGenerated ${TOTAL_PAGES} placeholder images in ${PUBLIC_DIR}`);
console.log(
  '\nNote: These are SVG placeholders. Replace with actual PNG images from PDF conversion.',
);
