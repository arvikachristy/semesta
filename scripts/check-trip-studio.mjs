import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
  assert.equal(
    await page.getByRole('button', { name: 'Open Trip Studio', exact: true }).count(),
    0,
  );
  assert.equal(await page.locator('section[aria-label="Trip details"]').count(), 0);
  assert.equal(
    await page.getByRole('complementary', { name: 'Upcoming trips' }).isVisible(),
    false,
  );
  const planning = studio.getByRole('region', { name: 'Trip Studio planning' });
  assert.equal(await page.locator('canvas').isVisible(), false);
  assert.equal(await studio.locator('form:visible').count(), 0);
  assert.equal(await planning.locator('details[open]').count(), 0);
  assert.equal(await studio.getByRole('heading', { level: 1 }).textContent(), 'France');
  assert.match(await planning.textContent(), /1 of 2.*50%/);
  assert.equal(
    await page.getByRole('button', { name: 'Collection', exact: true }).isVisible(),
    true,
  );
  const readiness = await studio.getByRole('region', { name: 'Trip readiness' }).boundingBox();
  assert.ok(readiness && readiness.y + readiness.height < 650);
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-desktop.png') });
  const navigation = page.getByRole('navigation', { name: 'Explore and plan' });
  await navigation.getByRole('button').nth(2).click();
  await page
    .getByRole('region', { name: 'Account backup' })
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  assert.equal(await studio.isVisible(), true);
  await planning.getByRole('button', { name: 'Choose optional categories' }).click();
  const categories = page.getByRole('dialog', { name: 'Choose optional categories' });
  await categories.getByRole('checkbox', { name: 'Accommodation', exact: true }).uncheck();
  assert.match(await planning.textContent(), /1 of 1.*100%/);
  await categories.getByRole('checkbox', { name: 'Accommodation', exact: true }).check();
  await categories.getByRole('button', { name: 'Done', exact: true }).click();
  await planning
    .locator('summary')
    .filter({ hasText: /Flights & Transport/ })
    .click();
  await planning
    .locator('summary')
    .filter({ hasText: /Night train/ })
    .click();
  await planning.getByLabel('Status for Night train').selectOption('idea');
  assert.match(await planning.textContent(), /0 of 2.*0%/);
  await planning.getByRole('button', { name: 'Edit Night train', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit Night train', exact: true });
  await editor.getByLabel('Date and time', { exact: true }).fill('2027-05-12T21:30');
  await editor.getByLabel('Booking reference (optional)').fill('TRAIN-123');
  await editor.getByLabel('Booking link (optional)').fill('https://example.com/train');
  await editor.getByRole('button', { name: 'Save details', exact: true }).click();
  await planning.getByLabel('Status for Night train').selectOption('booked');
  await studio.getByRole('button', { name: 'Add travellers', exact: true }).click();
  const travellers = page.getByRole('dialog', { name: 'Travellers', exact: true });
  await travellers.getByLabel('Traveller name').fill('Taylor Reed');
  await travellers.getByRole('button', { name: 'Add traveller', exact: true }).click();
  await travellers.getByRole('button', { name: 'Close Travellers', exact: true }).click();
  assert.equal(await studio.getByLabel('Taylor Reed', { exact: true }).textContent(), 'TR');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await studio.evaluate((element) => element.scrollWidth <= element.clientWidth),
    true,
  );
  await studio.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: join(tmpdir(), 'semesta-studio-mobile.png') });
  await studio.getByRole('button', { name: 'All trips', exact: true }).click();
  await page.getByRole('button', { name: 'Open A little French escape', exact: true }).click();
  assert.match(await planning.textContent(), /1 of 2.*50%/);
  await page.getByRole('button', { name: 'Collection', exact: true }).click();
  assert.equal(await page.locator('canvas').isVisible(), true);
  await page.reload();
  await page.getByRole('button', { name: 'Trips', exact: true }).click();
  await page.getByRole('button', { name: 'Open A little French escape' }).click();
  await planning
    .locator('summary')
    .filter({ hasText: /Flights & Transport/ })
    .click();
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
  assert.equal(await studio.getByLabel('Taylor Reed', { exact: true }).textContent(), 'TR');
  assert.deepEqual(errors, []);
  await studio
    .locator('summary')
    .filter({ hasText: /^More$/ })
    .click();
  await studio.getByRole('button', { name: 'Edit trip', exact: true }).click();
  const metadata = page.getByRole('dialog', { name: 'Edit trip', exact: true });
  await metadata.getByLabel('Trip name', { exact: true }).fill('Lisbon summer');
  await metadata.getByRole('button', { name: 'Save trip', exact: true }).click();
  assert.match(await studio.textContent(), /Lisbon summer/);
  assert.match(await planning.textContent(), /TRAIN-123/);
  await studio
    .locator('summary')
    .filter({ hasText: /^More$/ })
    .click();
  await studio.getByRole('button', { name: 'Delete trip', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete trip', exact: true })
    .getByRole('button', { name: 'Keep trip', exact: true })
    .click();
  assert.equal(await studio.isVisible(), true);
  await studio
    .locator('summary')
    .filter({ hasText: /^More$/ })
    .click();
  await studio.getByRole('button', { name: 'Delete trip', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Delete trip', exact: true })
    .getByRole('button', { name: 'Delete trip', exact: true })
    .click();
  assert.equal(await page.locator('canvas').isVisible(), true);
  assert.equal(
    await page
      .getByRole('complementary', { name: 'Upcoming trips' })
      .getByText('No trips yet.', { exact: true })
      .isVisible(),
    true,
  );
  await page.getByRole('button', { name: 'New trip', exact: true }).click();
  await page.getByLabel('Trip name', { exact: true }).fill('Lisbon');
  await page.getByRole('button', { name: 'Save trip', exact: true }).click();
  assert.equal(await studio.isVisible(), true);
  assert.equal(await studio.getByRole('heading', { level: 1 }).textContent(), 'Lisbon');
  assert.equal(await page.locator('section[aria-label="Trip details"]').count(), 0);
  await studio.getByRole('button', { name: '‹ Back to collection' }).click();
  assert.equal(
    await page.getByRole('button', { name: 'Open Lisbon', exact: true }).isVisible(),
    true,
  );
  assert.equal(
    await page.getByRole('button', { name: 'Open Trip Studio', exact: true }).count(),
    0,
  );
  await page.getByRole('button', { name: 'Open Lisbon', exact: true }).click();
  assert.equal(await studio.isVisible(), true);
  assert.deepEqual(errors, []);
  console.log(
    'Passed: real ticket model, initially collapsed categories/no forms, modal editing, confirmation, optional categories, participants, persistence, navigation and desktop/mobile layout.',
  );
} finally {
  await browser.close();
}
