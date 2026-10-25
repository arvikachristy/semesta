import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  headless: true,
});

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 760 },
    deviceScaleFactor: 1,
  });
  await page.goto(process.env.README_PREVIEW_URL ?? 'https://semesta-gamma.vercel.app/', {
    waitUntil: 'networkidle',
  });
  await page.locator('header').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'docs/assets/semesta-preview.png' });
} finally {
  await browser.close();
}
