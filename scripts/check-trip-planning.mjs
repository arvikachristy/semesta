import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
            id: 'qa',
            name: 'Planning preview',
            countryIds: ['FR'],
            startDate: '',
            endDate: '',
            notes: '',
          },
        ],
      }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open Planning preview' }).click();
  await page.getByRole('button', { name: '‹ Back to collection' }).click();
  const planning = page.getByRole('region', { name: 'Trip planning' });
  await planning.getByLabel('Transportation name').fill('Train to Paris');
  await planning.locator('form').first().getByLabel('Details').fill('12 May · Booking ABC · €120');
  await planning.getByRole('button', { name: 'Add transportation', exact: true }).click();
  await planning.getByRole('checkbox', { name: /Train to Paris/ }).check();
  await planning.getByLabel('Accommodation name').fill('Paris hotel');
  await planning.getByRole('button', { name: 'Add accommodation', exact: true }).click();
  await planning.getByLabel('Travel essentials name').fill('Insurance');
  await planning.getByRole('button', { name: 'Add travel essentials', exact: true }).click();
  await planning.getByRole('checkbox', { name: /Insurance/ }).check();
  assert.match(await planning.textContent(), /2 of 3.*67%/);
  await page.screenshot({ path: join(tmpdir(), 'semesta-planning-desktop.png') });
  await page.reload();
  await page.getByRole('button', { name: 'Open Planning preview' }).click();
  await page.getByRole('button', { name: '‹ Back to collection' }).click();
  assert.equal(await planning.getByRole('checkbox', { name: /Train to Paris/ }).isChecked(), true);
  await planning.getByRole('button', { name: 'Edit Train to Paris', exact: true }).click();
  await planning.getByLabel('Name', { exact: true }).fill('Eurostar');
  await planning.getByRole('button', { name: 'Save details', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Trips', exact: true }).click();
  await planning.getByRole('checkbox', { name: /Eurostar/ }).uncheck();
  assert.match(await planning.textContent(), /1 of 3.*33%/);
  const bounds = await planning.boundingBox();
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await page.screenshot({ path: join(tmpdir(), 'semesta-planning-mobile.png') });
  await planning.getByRole('button', { name: 'Remove Paris hotel', exact: true }).click();
  assert.match(await planning.textContent(), /1 of 2.*50%/);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log(
    'Passed: add, edit, book/unbook, remove, progress, reload persistence and mobile layout.',
  );
} finally {
  await browser.close();
}
