import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  let releaseArtwork = () => {};
  let artworkRequests = 0;
  const artworkReady = new Promise((resolve) => {
    releaseArtwork = resolve;
  });
  page.on('pageerror', (error) => errors.push(error.message));
  // Instrument served dev code only; production exposes no renderer globals.
  await page.route('**/src/three/playground.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'scene.add(ambientLight, directionalLight, floor, glasses.object);',
      `scene.add(ambientLight, directionalLight, floor, glasses.object);
      const probe = window.__idleProbe = { renderer, collection, camera, glasses, renders: 0 };
      const draw = renderer.render.bind(renderer);
      renderer.render = (...args) => { probe.renders++; return draw(...args); };`,
    );
    await route.fulfill({ response, body });
  });
  await page.route(/\/glasses\/assets\/.*\.svg/, async (route) => {
    if (route.request().resourceType() === 'image') {
      artworkRequests++;
      await artworkReady;
    }
    await route.continue();
  });
  await page.goto(process.env.BROWSER_URL ?? 'http://127.0.0.1:5173/', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(() => window.__idleProbe?.collection.blocks.length === 1);
  // Let the final throttled shadow update finish while holding back continent textures.
  await page.waitForTimeout(200);
  const rendered = () => page.evaluate(() => window.__idleProbe.renders);
  const assertIdle = async () => {
    // Resizing can enqueue another ResizeObserver callback after the first frame.
    await page.evaluate(() => {
      window.__idleProbe.lastCount = -1;
      window.__idleProbe.stableSince = performance.now();
    });
    await page.waitForFunction(() => {
      const probe = window.__idleProbe;
      if (probe.lastCount !== probe.renders) {
        probe.lastCount = probe.renders;
        probe.stableSince = performance.now();
      }
      return performance.now() - probe.stableSince >= 500;
    });
    const before = await rendered();
    await page.waitForTimeout(2000);
    assert.equal(await rendered(), before, 'A settled scene must not redraw');
  };
  await assertIdle();
  assert.ok(artworkRequests > 0, 'Expected delayed continent artwork');
  const beforeArtwork = await rendered();
  releaseArtwork();
  await page.waitForFunction((count) => window.__idleProbe.renders > count, beforeArtwork);
  await page.waitForTimeout(200);
  await assertIdle();
  const pixels = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas.width * canvas.height;
  });
  assert.ok(pixels <= 1_000_000, `Canvas exceeded pixel budget: ${pixels}`);

  let before = await rendered();
  await page.getByRole('button', { name: 'Switch to Midnight Navy' }).click();
  await page.waitForFunction((count) => window.__idleProbe.renders > count, before);
  await page.waitForTimeout(200);
  await assertIdle();

  before = await rendered();
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.waitForFunction((count) => window.__idleProbe.renders > count, before);
  const largePixels = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return canvas.width * canvas.height;
  });
  assert.ok(largePixels <= 1_000_000, `4K canvas exceeded pixel budget: ${largePixels}`);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  await assertIdle();

  before = await rendered();
  const canvas = page.locator('canvas');
  await canvas.hover();
  await page.mouse.wheel(0, -200);
  await page.waitForFunction((count) => window.__idleProbe.renders > count, before);

  before = await rendered();
  await page.evaluate(() => window.__idleProbe.glasses.rotateBy(0.2));
  await page.waitForFunction((count) => window.__idleProbe.renders > count, before);
  const target = await page.evaluate(() => {
    const { collection, camera, renderer } = window.__idleProbe;
    const mesh = collection.blocks[0].object.children[0];
    mesh.geometry.computeBoundingSphere();
    mesh.updateWorldMatrix(true, false);
    const screen = mesh.geometry.boundingSphere.center
      .clone()
      .applyMatrix4(mesh.matrixWorld)
      .project(camera);
    const bounds = renderer.domElement.getBoundingClientRect();
    return {
      x: bounds.left + ((screen.x + 1) * bounds.width) / 2,
      y: bounds.top + ((1 - screen.y) * bounds.height) / 2,
    };
  });
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.move(target.x + 24, target.y - 24, { steps: 6 });
  assert.ok(
    await page.evaluate(() => window.__idleProbe.collection.blocks[0].getBody().isGrabbed()),
  );
  await page.mouse.up();

  await page.evaluate(async () => {
    const { CountryList } = await import('/src/types/country.ts');
    await window.__idleProbe.collection.setCountries([CountryList.Indonesia, CountryList.France]);
  });
  await page.waitForFunction(() => window.__idleProbe.collection.blocks.length === 2);
  await page.waitForFunction(() =>
    window.__idleProbe.collection.blocks.every((block) => block.getBody().isSleeping()),
  );
  await page.waitForTimeout(200);
  await assertIdle();
  before = await rendered();
  await page.evaluate(async () => {
    const { CountryList } = await import('/src/types/country.ts');
    await window.__idleProbe.collection.setCountries([CountryList.Indonesia]);
  });
  await page.waitForFunction((count) => window.__idleProbe.renders > count, before);
  await page.waitForTimeout(200);
  await assertIdle();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 740 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(200);
    await assertIdle();
    await page.getByRole('button', { name: 'Countries', exact: true }).click();
    await page.getByRole('searchbox').fill('Japan');
    const visit = page.getByRole('button', { name: 'Mark Japan visited', exact: true });
    await visit.click();
    await page.waitForFunction(() => window.__idleProbe.collection.blocks.length === 2);
    await page.getByRole('button', { name: 'Close countries', exact: true }).click();
    await page.waitForFunction(() =>
      window.__idleProbe.collection.blocks.every((block) => block.getBody().isSleeping()),
    );
    await assertIdle();
    // Restore through the real picker before checking the next mobile width.
    await page.getByRole('button', { name: 'Countries', exact: true }).click();
    await page.getByRole('searchbox').fill('Japan');
    await page.getByRole('button', { name: 'Remove Japan from Been to', exact: true }).click();
    await page.getByRole('button', { name: 'Close countries', exact: true }).click();
    await page.waitForFunction(() => window.__idleProbe.collection.blocks.length === 1);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ idleRedraws: 0, pixels, largePixels, errors }));
  console.log(
    'Passed: idle rendering, artwork/theme/resize/zoom/rotation invalidation, jelly grabbing, desktop/mobile insertion/removal, and 4K pixel budget.',
  );
} finally {
  await browser.close();
}
