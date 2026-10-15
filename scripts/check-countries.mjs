import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { URL } from 'node:url';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const baseUrl = process.env.BROWSER_URL ?? 'http://127.0.0.1:5173/';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`${message.text()} (${message.location().url})`);
    }
  });
  await page.goto(baseUrl);
  const countries = await page.evaluate(
    async () => (await import('/src/types/country.ts')).CountryList,
  );
  const trigger = page.getByRole('button', { name: /Countries/ });
  const selected = async (count) => {
    await page.waitForFunction(
      (count) =>
        document
          .querySelector('.country-selector button')
          ?.textContent.includes(`${count} selected`),
      count,
    );
  };
  const checkbox = (country) => page.locator(`input[type="checkbox"][value="${country}"]`);
  await selected(1);
  await trigger.click();
  assert.equal(await page.getByRole('checkbox').count(), 199);
  assert.ok(
    (await page.locator('legend').allTextContents()).some((label) => label.includes('1/49')),
  );
  assert.ok(
    (await page.locator('legend').allTextContents()).some((label) => label.includes('0/0')),
  );
  assert.equal(await checkbox(countries.Indonesia).isChecked(), true);
  await searchFor(page, 'hong kong');
  assert.equal(await page.getByRole('checkbox').count(), 1);
  await checkbox(countries.HongKong).check();
  await selected(2);
  await page.reload();
  await selected(2);
  await trigger.click();
  await searchFor(page, countries.HongKong);
  assert.equal(await checkbox(countries.HongKong).isChecked(), true);
  await checkbox(countries.HongKong).uncheck();
  for (const query of ['vatican', 'holy see']) {
    await searchFor(page, query);
    assert.equal(await page.getByRole('checkbox').count(), 1);
    assert.equal(
      await page.getByRole('checkbox', { name: 'Vatican City', exact: true }).count(),
      1,
    );
  }
  await searchFor(page, 'england');
  assert.equal(await page.getByRole('checkbox').count(), 1);
  assert.equal(await checkbox(countries.England).isChecked(), false);
  await checkbox(countries.England).check();
  await selected(2);
  await searchFor(page, 'united kingdom');
  assert.equal(await page.getByRole('checkbox').count(), 0);
  assert.equal(await checkbox(countries.UnitedKingdom).count(), 0);
  await searchFor(page, '');
  await checkbox(countries.England).uncheck();
  await checkbox(countries.Kazakhstan).check();
  await selected(2);
  await page.reload();
  await selected(2);
  await trigger.click();
  assert.equal(await checkbox(countries.Kazakhstan).isChecked(), true);
  await searchFor(page, 'kaz');
  assert.equal(await page.getByRole('checkbox').count(), 1);
  await checkbox(countries.Kazakhstan).uncheck();
  await searchFor(page, '');
  await checkbox(countries.Indonesia).uncheck();
  await page.goto(new URL('countryjellies/', baseUrl).href);
  await selected(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await searchFor(page, 'indonesia');
  await checkbox(countries.Indonesia).check();
  await selected(1);
  const bounds = await page.locator('.country-checklist').boundingBox();
  assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await page.screenshot({ path: join(tmpdir(), 'semesta-country-selector-mobile.png') });
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.deepEqual(errors, []);
  console.log(
    'Passed: 199 options, Hong Kong selection/persistence, Vatican City naming/aliases, constituent flags, continent counts, mobile layout and Escape.',
  );
} finally {
  await browser.close();
}

async function searchFor(page, value) {
  await page.getByRole('searchbox').fill(value);
}
