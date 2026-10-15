import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs/promises';
const errors = [];
const output = process.env.BROWSER_OUTPUT ?? join(tmpdir(), 'semesta-country-journey');
const url = process.env.BROWSER_URL ?? 'http://127.0.0.1:5173/';
await fs.mkdir(output, { recursive: true });
for (const [name, viewport] of [
  ['small-mobile', { width: 320, height: 740 }],
  ['mobile', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 1000 }],
]) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: process.env.BROWSER_ARGS
      ? JSON.parse(process.env.BROWSER_ARGS)
      : ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    headless: true,
  });
  const context = await browser.newContext({
    viewport,
    isMobile: name !== 'desktop',
    hasTouch: name !== 'desktop',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(name + ': ' + error.message));
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('semesta.journey-fixture')) {
      window.localStorage.clear();
      window.localStorage.setItem(
        'semesta.country-selection',
        JSON.stringify({ version: 1, selectedCountryIds: ['BR', 'AR', 'CL', 'ID', 'FR'] }),
      );
      window.sessionStorage.setItem('semesta.journey-fixture', 'ready');
    }
  });
  await page.goto(url);
  await page
    .getByRole('button', { name: name !== 'desktop' ? 'Countries' : /All countries/ })
    .waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${output}/${name}-world.png` });
  await page
    .getByRole('button', {
      name: name !== 'desktop' ? 'Countries' : /All countries/,
      exact: name !== 'desktop',
    })
    .click();
  await page.screenshot({ path: `${output}/${name}-opened.png` });
  assert.equal(await page.getByRole('button', { name: /^Explore / }).count(), 199);
  for (const [query, country] of [
    ['HK', 'Hong Kong'],
    ['holy see', 'Vatican City'],
    ['england', 'England'],
  ]) {
    await page.getByRole('searchbox').fill(query);
    await page.getByRole('button', { name: `Explore ${country}`, exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Explore / }).count(), 1);
  }
  await page.getByRole('searchbox').fill('united kingdom');
  assert.equal(await page.getByRole('button', { name: /^Explore / }).count(), 0);
  await page.getByRole('searchbox').fill('');
  await page
    .getByRole('combobox', { name: 'Continent', exact: true })
    .selectOption('south-america');
  await page.screenshot({ path: `${output}/${name}-continent.png` });
  await page.getByRole('button', { name: 'Explore Peru', exact: true }).click();
  await page.getByRole('button', { name: 'Save to bucket list', exact: true }).click();
  await page.screenshot({ path: `${output}/${name}-country.png` });
  const visited = JSON.parse(
    await page.evaluate(() => window.localStorage.getItem('semesta.country-selection')),
  ).selectedCountryIds;
  if (visited.includes('PE')) {
    throw new Error('Saving a wish changed visited countries');
  }
  await page.getByRole('button', { name: 'Plan a trip', exact: true }).click();
  await page.getByRole('heading', { name: 'Peru trip', exact: true }).waitFor();
  await page.screenshot({ path: `${output}/${name}-studio.png` });
  await page.getByRole('button', { name: 'Add activities', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Activities name', exact: true })
    .fill('Walk through Cusco');
  await page.getByRole('button', { name: 'Add activities', exact: true }).last().click();
  await page.getByText('Walk through Cusco', { exact: true }).waitFor();
  await page.getByRole('button', { name: '‹ Back to South America', exact: true }).click();
  await page.getByRole('heading', { name: 'South America', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Peru trip ›', exact: true }).click();
  await page.getByRole('button', { name: 'Mark countries visited', exact: true }).click();
  await page.screenshot({ path: `${output}/${name}-confirm.png` });
  await page.getByRole('button', { name: 'Confirm visits', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Your world has grown' }).waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${output}/${name}-returned.png` });
  const stored = await page.evaluate(() => ({
    visited: JSON.parse(window.localStorage.getItem('semesta.country-selection')),
    wishes: JSON.parse(window.localStorage.getItem('semesta.country-wishlist')),
    trips: JSON.parse(window.localStorage.getItem('semesta.upcoming-trips')),
  }));
  if (
    !stored.visited.selectedCountryIds.includes('PE') ||
    stored.wishes.countryIds.includes('PE') ||
    stored.trips.trips.length !== 1
  ) {
    throw new Error('Return journey persistence is wrong');
  }
  await page.reload();
  const trigger = page.getByRole('button', {
    name: name !== 'desktop' ? 'Countries' : /All countries/,
    exact: name !== 'desktop',
  });
  await trigger.click();
  await page.getByRole('button', { name: 'Been to', exact: true }).click();
  await page.getByRole('button', { name: 'Explore Peru', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: /^Explore / }).count(), 6);
  await page.keyboard.press('Escape');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.ok(await trigger.evaluate((element) => element === document.activeElement));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  console.log(name + ' journey passed');
  await browser.close();
}
console.log(JSON.stringify({ errors }));
if (errors.length) {
  process.exitCode = 1;
}
