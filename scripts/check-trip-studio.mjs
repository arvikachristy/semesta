import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'semesta.upcoming-trips',
      JSON.stringify({
        version: 1,
        trips: [
          {
            id: 'studio',
            name: 'A little French escape',
            countryIds: ['FR'],
            startDate: '2027-05-12',
            endDate: '2027-05-19',
            notes: '',
          },
        ],
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open A little French escape' }).click();
  const studio = page.getByRole('region', { name: 'Trip Studio', exact: true });
  assert.equal(await page.locator('canvas').isVisible(), false);
  assert.equal(
    await studio.getByRole('heading', { level: 1 }).textContent(),
    'A little French escape',
  );
  await studio.locator('summary').filter({ hasText: 'Flights' }).click();
  assert.equal(await studio.getByText('The way there', { exact: true }).isVisible(), true);
  await studio.getByText('＋ Choose optional categories', { exact: true }).click();
  await studio.getByRole('checkbox', { name: 'Activities', exact: true }).check();
  assert.match(await studio.textContent(), /40% ready/);
  await studio.locator('summary').filter({ hasText: 'Activities' }).click();
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await studio.boundingBox();
  assert.ok(bounds && bounds.width <= 390);
  assert.equal(
    await studio.evaluate((element) => element.scrollWidth <= element.clientWidth),
    true,
  );
  await studio.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-mobile.png') });
  await studio.getByRole('button', { name: '‹ Back to collection' }).click();
  assert.equal(await page.locator('canvas').isVisible(), true);
  await page.getByRole('button', { name: 'Trips', exact: true }).click();
  await page.getByRole('button', { name: 'Open Trip Studio', exact: true }).click();
  assert.equal(await studio.isVisible(), true);
  assert.match(await studio.textContent(), /67% ready/);
  assert.deepEqual(errors, []);
  console.log(
    'Passed: trip entry, mock progress, optional categories, expansion, desktop/mobile layout, back navigation and preview reset.',
  );
} finally {
  await browser.close();
}
