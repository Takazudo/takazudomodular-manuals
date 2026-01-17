#!/usr/bin/env node

/**
 * Test if page images actually load (not just HTML)
 * Usage: node scripts/test-page-image.js [pageNum]
 */

const pageNum = process.argv[2] || 2;
const BASE_URL = process.env.BASE_URL || 'http://zmanuals.localhost:3100';

async function testPageImage(pageNum) {
  console.log(`Testing page ${pageNum} image load...\n`);

  // First, fetch the HTML page to get the image path
  const pageUrl = `${BASE_URL}/manuals/oxi-one-mk2/page/${pageNum}`;
  console.log(`1. Fetching HTML: ${pageUrl}`);

  const pageResponse = await fetch(pageUrl);
  console.log(`   Status: ${pageResponse.status}`);

  if (pageResponse.status !== 200) {
    console.error(`❌ HTML page failed: ${pageResponse.status}`);
    process.exit(1);
  }

  const html = await pageResponse.text();

  // Extract image path from HTML (look for /manuals/oxi-one-mk2/pages/page-XXX.png)
  const imageMatch = html.match(/\/manuals\/oxi-one-mk2\/pages\/page-\d{3}\.png/);

  if (!imageMatch) {
    console.error('❌ Could not find image path in HTML');
    process.exit(1);
  }

  const imagePath = imageMatch[0];
  console.log(`   Found image path: ${imagePath}`);

  // Now test if the image actually loads
  const imageUrl = `${BASE_URL}${imagePath}`;
  console.log(`\n2. Fetching image: ${imageUrl}`);

  const imageResponse = await fetch(imageUrl);
  console.log(`   Status: ${imageResponse.status}`);
  console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);

  if (imageResponse.status !== 200) {
    console.error(`\n❌ IMAGE LOAD FAILED: ${imageResponse.status}`);
    process.exit(1);
  }

  const contentType = imageResponse.headers.get('content-type');
  if (!contentType || !contentType.includes('image')) {
    console.error(`\n❌ IMAGE WRONG CONTENT-TYPE: ${contentType}`);
    process.exit(1);
  }

  console.log(`\n✅ Page ${pageNum} image loaded successfully!`);
  process.exit(0);
}

testPageImage(pageNum).catch((error) => {
  console.error(`\n❌ ERROR: ${error.message}`);
  process.exit(1);
});
