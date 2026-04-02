import { test, expect } from '@playwright/test';

test('game boots without crashes', async ({ page }) => {
  const errors = [];
  const crashes = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  page.on('console', (msg) => {
    if (msg.text().includes('CRASH')) {
      crashes.push(msg.text());
    }
  });

  // Set callsign in localStorage BEFORE navigating so the modal is skipped
  await page.goto('http://localhost:4173');
  await page.evaluate(() => {
    localStorage.setItem('hormuz_callsign', 'TESTPILOT');
  });
  await page.reload();

  // Wait for boot sequence + early gameplay (12 seconds)
  await page.waitForTimeout(12000);

  // Canvas should exist
  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Canvas should have non-zero dimensions
  const box = await canvas.boundingBox();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  // No page errors (uncaught exceptions)
  expect(errors).toEqual([]);

  // No CRASH messages in console
  expect(crashes).toEqual([]);
});
