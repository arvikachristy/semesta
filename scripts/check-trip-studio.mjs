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
            planning: [
              {
                id: 'train',
                category: 'transportation',
                name: 'Night train',
                details: 'Window seat',
                completed: true,
              },
              {
                id: 'stay',
                category: 'accommodation',
                name: 'A place to settle in',
                details: 'Two nights',
                completed: false,
              },
            ],
          },
        ],
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open A little French escape' }).click();
  const studio = page.getByRole('region', { name: 'Trip Studio', exact: true });
  const planning = studio.getByRole('region', { name: 'Trip Studio planning' });
  assert.equal(await page.locator('canvas').isVisible(), false);
  assert.match(await planning.textContent(), /1 of 2.*50%/);
  await planning
    .locator('summary')
    .filter({ hasText: /^Choose optional categories$/ })
    .click();
  await planning.getByRole('checkbox', { name: 'Accommodation', exact: true }).uncheck();
  assert.match(await planning.textContent(), /1 of 1.*100%/);
  await planning.getByRole('checkbox', { name: 'Accommodation', exact: true }).check();
  await planning
    .locator('summary')
    .filter({ hasText: /Night train/ })
    .click();
  await planning.getByLabel('Status for Night train').selectOption('idea');
  assert.match(await planning.textContent(), /0 of 2.*0%/);
  await planning.getByRole('button', { name: 'Edit Night train', exact: true }).click();
  await planning.getByLabel('Date and time', { exact: true }).first().fill('2027-05-12T21:30');
  await planning
    .getByLabel('Booking reference (optional)', { exact: true })
    .first()
    .fill('TRAIN-123');
  await planning
    .getByLabel('Booking link (optional)', { exact: true })
    .first()
    .fill('https://example.com/train');
  await planning.getByRole('button', { name: 'Save details', exact: true }).click();
  await planning.getByLabel('Status for Night train').selectOption('booked');
  await studio.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await studio.evaluate((element) => element.scrollWidth <= element.clientWidth),
    true,
  );
  await studio.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-mobile.png') });
  await studio.getByRole('button', { name: '‹ Back to collection' }).click();
  await page.getByRole('button', { name: 'Trips', exact: true }).click();
  const returned = page.getByRole('region', { name: 'Trip Studio planning' });
  assert.match(await returned.textContent(), /1 of 2.*50%/);
  await page.getByRole('button', { name: 'Open Trip Studio', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Trips', exact: true }).click();
  await page.getByRole('button', { name: 'Open A little French escape' }).click();
  await planning
    .locator('summary')
    .filter({ hasText: /Night train/ })
    .click();
  assert.match(await planning.textContent(), /TRAIN-123/);
  assert.equal(
    await planning.getByRole('link', { name: /Open booking link/ }).getAttribute('href'),
    'https://example.com/train',
  );
  assert.equal(await planning.getByLabel('Status for Night train').inputValue(), 'booked');
  assert.deepEqual(errors, []);
  console.log(
    'Passed: legacy decoding, statuses, rich fields, optional categories, progress, shared navigation, persistence and desktop/mobile layout.',
  );
} finally {
  await browser.close();
}
