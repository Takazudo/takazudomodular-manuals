// Generate the Open Graph preview image (public/img/ogp.png, 1200×630) from the
// site logo, matching the zudo-test-wisdom showcase approach: the monochrome
// `currentColor` logo recolored to the dark-theme foreground, centered on the
// dark-theme background with a subtle inset frame.
//
// Theme colors are the "Default Dark" scheme tokens (src/config/color-schemes.ts):
//   background = #181818, text/foreground = #e0e0e0.
//
// Run: node scripts/gen-ogp.mjs   (from doc/)
// Re-run whenever the logo or the dark-theme bg/fg tokens change.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docRoot = resolve(__dirname, '..');

const WIDTH = 1200;
const HEIGHT = 630;
const BG = '#181818'; // --zd-bg (Default Dark background)
const FG = '#e0e0e0'; // --zd-fg (Default Dark text/foreground)
const LOGO_BOX = 360; // logo render size (contained, preserves aspect)

const logoSrc = resolve(docRoot, 'public/img/logo.svg');
const outPath = resolve(docRoot, 'public/img/ogp.png');

// Recolor the currentColor silhouette to the foreground color so it renders
// standalone (outside the page where `color` would cascade).
const logoSvg = readFileSync(logoSrc, 'utf8').replace(/currentColor/g, FG);

const logoPng = await sharp(Buffer.from(logoSvg))
  .resize(LOGO_BOX, LOGO_BOX, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// Background + subtle inset frame, matching the showcase's framed look.
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
    <rect x="28" y="28" width="${WIDTH - 56}" height="${HEIGHT - 56}"
          fill="none" stroke="${FG}" stroke-opacity="0.5" stroke-width="2"/>
  </svg>`,
);

await sharp(bg)
  .composite([{ input: logoPng, gravity: 'centre' }])
  .png()
  .toFile(outPath);

console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT})`);
