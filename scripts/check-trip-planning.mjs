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
  const planning = page.getByRole('region', { name: 'Trip Studio planning' });
  await planning.getByRole('button', { name: 'Choose optional categories', exact: true }).click();
  const choices = page.getByRole('dialog', { name: 'Choose optional categories', exact: true });
  for (const label of ['Transportation', 'Accommodation', 'Travel essentials']) {
    await choices.getByRole('checkbox', { name: label, exact: true }).check();
  }
  await choices.getByRole('button', { name: 'Done', exact: true }).click();
  const add = async (label, action, name, details = '') => {
    await planning.locator('summary').filter({ hasText: label }).click();
    await planning.getByRole('button', { name: action, exact: true }).click();
    const form = page.getByRole('dialog', { name: action, exact: true });
    await form.locator('input[name="name"]').fill(name);
    await form.getByLabel('Details', { exact: true }).fill(details);
    await form.getByRole('button', { name: action, exact: true }).click();
  };
  await add(
    'Flights & Transport',
    'Add transportation',
    'Train to Paris',
    '12 May · Booking ABC · €120',
  );
  await planning
    .locator('summary')
    .filter({ hasText: /Train to Paris/ })
    .click();
  await planning.getByRole('checkbox', { name: /Train to Paris/ }).check();
  await add('Accommodation', 'Add accommodation', 'Paris hotel');
  await add('Travel essentials', 'Add travel essentials', 'Insurance');
  await planning
    .locator('summary')
    .filter({ hasText: /Insurance/ })
    .click();
  await planning.getByRole('checkbox', { name: /Insurance/ }).check();
  assert.match(await planning.textContent(), /2 of 3.*67%/);
  await page.screenshot({ path: join(tmpdir(), 'semesta-planning-desktop.png') });
  await page.reload();
  await page.getByRole('button', { name: 'Open Planning preview' }).click();
  await planning
    .locator('summary')
    .filter({ hasText: /Flights & Transport/ })
    .click();
  await planning
    .locator('summary')
    .filter({ hasText: /Train to Paris/ })
    .click();
  assert.equal(await planning.getByRole('checkbox', { name: /Train to Paris/ }).isChecked(), true);
  await planning.getByRole('button', { name: 'Edit Train to Paris', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit Train to Paris', exact: true });
  await editor.getByLabel('Name', { exact: true }).fill('Eurostar');
  await editor.getByRole('button', { name: 'Save details', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await planning.getByRole('checkbox', { name: /Eurostar/ }).uncheck();
  assert.match(await planning.textContent(), /1 of 3.*33%/);
  const bounds = await planning.boundingBox();
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await page.screenshot({ path: join(tmpdir(), 'semesta-planning-mobile.png') });
  await planning
    .locator('summary')
    .filter({ hasText: /Accommodation/ })
    .click();
  await planning
    .locator('summary')
    .filter({ hasText: /Paris hotel/ })
    .click();
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
