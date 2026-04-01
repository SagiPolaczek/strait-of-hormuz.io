// Run with: npx playwright-core test is not what we need
// Use npx to resolve playwright-core dynamically
const { chromium } = await import('/Users/sagipolaczek/.npm/_npx/e058441c325e062a/node_modules/playwright-core/index.mjs');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const logs = [];

page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  logs.push(`[${type}] ${text}`);
  if (type === 'error') {
    console.log(`🔴 ERROR: ${text}`);
  }
});

page.on('pageerror', error => {
  errors.push(error.message);
  console.log(`💥 PAGE ERROR: ${error.message}`);
  console.log(`   ${error.stack?.split('\n').slice(1, 4).join('\n   ')}`);
});

console.log('⏳ Loading game...');
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

// Wait for boot sequence + 4 seconds of gameplay
console.log('⏳ Waiting 10s (boot ~4s + gameplay ~6s)...');
await page.waitForTimeout(10000);

console.log(`\n=== RESULTS ===`);
console.log(`Page errors: ${errors.length}`);
errors.forEach(e => console.log(`  💥 ${e}`));

const relevantLogs = logs.filter(l => l.includes('CRASH') || l.includes('Error') || l.includes('error') || l.includes('[Click]'));
console.log(`\nRelevant console logs (${relevantLogs.length}):`);
relevantLogs.forEach(l => console.log(`  ${l}`));

console.log(`\nAll console logs (${logs.length}):`);
logs.forEach(l => console.log(`  ${l}`));

const canvasInfo = await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  return {
    canvasExists: !!canvas,
    canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'none',
  };
});
console.log(`\nCanvas:`, canvasInfo);

await browser.close();
console.log('✅ Done');
