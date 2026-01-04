#!/usr/bin/env node

/**
 * Test page navigation buttons
 * Usage: node scripts/test-page-navigation.js [pageNum]
 */

const pageNum = parseInt(process.argv[2]) || 2;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

async function testPageNavigation(pageNum) {
  console.log(`Testing page ${pageNum} navigation...\n`);

  const pageUrl = `${BASE_URL}/manuals/oxi-one-mk2/page/${pageNum}`;
  console.log(`1. Fetching page: ${pageUrl}`);

  const pageResponse = await fetch(pageUrl);
  console.log(`   Status: ${pageResponse.status}`);

  if (pageResponse.status !== 200) {
    console.error(`❌ Page load failed: ${pageResponse.status}`);
    process.exit(1);
  }

  const html = await pageResponse.text();

  // Extract navigation links from HTML
  // Looking for navigation section, then extract links
  // Pattern: <nav>...<a href="...">← 前へ</a>...</nav>
  const navMatch = html.match(/<nav[^>]*>(.*?)<\/nav>/s);

  if (!navMatch) {
    console.error('❌ Could not find <nav> element in HTML');
    process.exit(1);
  }

  const navHtml = navMatch[1];

  // Extract prev and next links from nav section only
  // Use more specific regex that doesn't cross tag boundaries
  const prevMatch = navHtml.match(/<a[^>]*href="([^"]*)"[^>]*>[^<]*前へ[^<]*<\/a>/);
  const nextMatch = navHtml.match(/<a[^>]*href="([^"]*)"[^>]*>[^<]*次へ[^<]*<\/a>/);

  if (!prevMatch && pageNum > 1) {
    console.error('❌ Could not find 前へ (previous) link in HTML');
    process.exit(1);
  }

  if (!nextMatch && pageNum < 272) {
    console.error('❌ Could not find 次へ (next) link in HTML');
    process.exit(1);
  }

  let hasError = false;

  // Test Previous link (if exists)
  if (prevMatch && pageNum > 1) {
    const prevPath = prevMatch[1];
    console.log(`\n2. Testing 前へ (Previous) button`);
    console.log(`   Found link: ${prevPath}`);

    const expectedPrevPath = `/manuals/oxi-one-mk2/page/${pageNum - 1}`;
    if (prevPath !== expectedPrevPath) {
      console.error(`   ❌ WRONG PATH!`);
      console.error(`      Expected: ${expectedPrevPath}`);
      console.error(`      Got:      ${prevPath}`);
      hasError = true;
    } else {
      console.log(`   ✅ Path correct`);
    }

    const prevUrl = prevPath.startsWith('http') ? prevPath : `${BASE_URL}${prevPath}`;
    console.log(`   Testing URL: ${prevUrl}`);

    const prevResponse = await fetch(prevUrl);
    console.log(`   Status: ${prevResponse.status}`);

    if (prevResponse.status !== 200) {
      console.error(`   ❌ Previous page FAILED: ${prevResponse.status}`);
      hasError = true;
    } else {
      console.log(`   ✅ Previous page loads`);
    }
  }

  // Test Next link (if exists)
  if (nextMatch && pageNum < 272) {
    const nextPath = nextMatch[1];
    console.log(`\n3. Testing 次へ (Next) button`);
    console.log(`   Found link: ${nextPath}`);

    const expectedNextPath = `/manuals/oxi-one-mk2/page/${pageNum + 1}`;
    if (nextPath !== expectedNextPath) {
      console.error(`   ❌ WRONG PATH!`);
      console.error(`      Expected: ${expectedNextPath}`);
      console.error(`      Got:      ${nextPath}`);
      hasError = true;
    } else {
      console.log(`   ✅ Path correct`);
    }

    const nextUrl = nextPath.startsWith('http') ? nextPath : `${BASE_URL}${nextPath}`;
    console.log(`   Testing URL: ${nextUrl}`);

    const nextResponse = await fetch(nextUrl);
    console.log(`   Status: ${nextResponse.status}`);

    if (nextResponse.status !== 200) {
      console.error(`   ❌ Next page FAILED: ${nextResponse.status}`);
      hasError = true;
    } else {
      console.log(`   ✅ Next page loads`);
    }
  }

  if (hasError) {
    console.log(`\n❌ NAVIGATION TEST FAILED for page ${pageNum}`);
    process.exit(1);
  }

  console.log(`\n✅ All navigation tests passed for page ${pageNum}!`);
  process.exit(0);
}

testPageNavigation(pageNum).catch((error) => {
  console.error(`\n❌ ERROR: ${error.message}`);
  process.exit(1);
});
