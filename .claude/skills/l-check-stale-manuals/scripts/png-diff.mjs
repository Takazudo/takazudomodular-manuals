#!/usr/bin/env node
// Pixel-diff two PNGs. Prints "<ratio> <maxDelta>" — ratio of pixels differing by
// >8/255 in any RGB channel, and the max channel delta seen. Prints DIMS-DIFFER on size mismatch.
// Used to separate real page-image changes from PDF re-export rendering noise:
// ratio <= 0.0005 is noise (restore the old PNG), above is a real visual change (keep the new one).
import { repoRequire } from './_lib.mjs';

const sharp = repoRequire('sharp');
const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: node png-diff.mjs <fileA.png> <fileB.png>');
  process.exit(1);
}
const [da, db] = await Promise.all([
  sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
]);
if (da.info.width !== db.info.width || da.info.height !== db.info.height) {
  console.log('DIMS-DIFFER');
  process.exit(0);
}
let diff = 0;
let maxDelta = 0;
const n = da.data.length;
for (let i = 0; i < n; i += 4) {
  let d = 0;
  for (let c = 0; c < 3; c++) {
    const delta = Math.abs(da.data[i + c] - db.data[i + c]);
    if (delta > d) d = delta;
  }
  if (d > maxDelta) maxDelta = d;
  if (d > 8) diff++;
}
console.log(`${(diff / (n / 4)).toFixed(6)} ${maxDelta}`);
