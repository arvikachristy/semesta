import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { cpus, platform, tmpdir } from 'node:os';
import { join } from 'node:path';

const settings = {
  url: process.env.BENCHMARK_URL ?? 'http://127.0.0.1:5173/',
  output: process.env.BENCHMARK_OUTPUT ?? join(tmpdir(), 'semesta-country-benchmark.json'),
  counts: (process.env.BENCHMARK_COUNTS ?? '1,7,25,60,198').split(',').map(Number),
  duration: 4000,
  settle: 10000,
  viewport: { width: 1280, height: 800 },
};
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: settings.viewport, deviceScaleFactor: 1 });
  await page.routeWebSocket('**', () => {});
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  // Instrument the served dev module only. Nothing is exposed by the production app.
  await page.route('**/src/three/playground.ts*', async (route) => {
    const response = await route.fetch();
    const source = (await response.text())
      .replace(
        'const surfacesChanged = collection.update(delta);',
        'const physicsStart = performance.now(); const surfacesChanged = collection.update(delta); const physicsMs = performance.now() - physicsStart;',
      )
      .replace(
        'renderer.render(scene, camera);',
        'const renderStart = performance.now(); renderer.render(scene, camera); if (window.__diagnostics?.recording) { window.__diagnostics.samples.push({frameMs: now - window.__diagnostics.previous, physicsMs, renderSubmitMs: performance.now() - renderStart}); } window.__diagnostics.previous = now;',
      )
      .replace(
        'animate();',
        'window.__diagnostics = {collection, renderer, scene, camera, samples: [], recording: false, previous: performance.now()}; animate();',
      );
    await route.fulfill({ response, body: source });
  });
  await page.goto(settings.url);
  await page.waitForFunction(() => window.__diagnostics?.collection.blocks.length === 1);
  const ids = await page.evaluate(async () => {
    const { countryGroups } = await import('/src/data/countries.ts');
    // Interleave continents so smaller cases exercise the complete composition.
    const groups = countryGroups.map((group) => group.countries.map((country) => country.code));
    const result = [];
    for (let index = 0; groups.some((group) => index < group.length); index++) {
      groups.forEach((group) => {
        if (group[index]) {
          result.push(group[index]);
        }
      });
    }
    return result;
  });
  const results = [];
  const measure = async (label) => {
    await page.evaluate(() => {
      window.__diagnostics.samples = [];
      window.__diagnostics.recording = true;
      window.__diagnostics.previous = performance.now();
    });
    await page.waitForTimeout(settings.duration);
    const reading = await page.evaluate((label) => {
      const diagnostic = window.__diagnostics;
      diagnostic.recording = false;
      const { samples, collection, renderer } = diagnostic;
      const average = (key) =>
        samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
      const sorted = samples.map((sample) => sample.frameMs).sort((a, b) => a - b);
      return {
        label,
        fps: 1000 / average('frameMs'),
        p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
        physicsMs: average('physicsMs'),
        renderSubmitMs: average('renderSubmitMs'),
        slowFrames: samples.filter((sample) => sample.frameMs > 50).length,
        jellies: collection.blocks.length,
        awake: collection.blocks.filter((block) => !block.getBody().isSleeping()).length,
        pixelRatio: renderer.getPixelRatio(),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      };
    }, label);
    results.push(reading);
    console.log(JSON.stringify(reading));
  };
  for (const count of settings.counts) {
    await page.evaluate(
      async (countries) => {
        const { createLocalCountrySelectionRepository } =
          await import('/src/storage/country-selection.ts');
        await createLocalCountrySelectionRepository().save(countries);
      },
      ids.slice(0, count),
    );
    await page.reload();
    await page.waitForFunction(() => window.__diagnostics);
    await measure(`${count}: loading`);
    for (let attempts = 0; attempts < 24; attempts++) {
      const progress = await page.evaluate(() => ({
        loaded: window.__diagnostics.collection.blocks.length,
        awake: window.__diagnostics.collection.blocks.filter(
          (block) => !block.getBody().isSleeping(),
        ).length,
      }));
      console.log(JSON.stringify({ count, ...progress }));
      if (progress.loaded === count) {
        break;
      }
      await page.waitForTimeout(5000);
      if (attempts === 23) {
        throw new Error(`Countries did not finish loading: ${JSON.stringify(progress)}`);
      }
    }
    await page.waitForTimeout(settings.settle);
    await measure(`${count}: resting`);
  }
  const target = await page.evaluate(async () => {
    const { Vector2, Raycaster } = await import('/node_modules/.vite/deps/three.js');
    const { collection, camera } = window.__diagnostics;
    const ray = new Raycaster();
    const objects = collection.blocks.map((block) => block.object);
    for (const block of collection.blocks) {
      const mesh = block.object.children[0];
      mesh.geometry.computeBoundingSphere();
      const screen = mesh.geometry.boundingSphere.center
        .clone()
        .applyMatrix4(mesh.matrixWorld)
        .project(camera);
      ray.setFromCamera(new Vector2(screen.x, screen.y), camera);
      const hit = ray.intersectObjects(objects, true)[0];
      if (hit?.object.parent === block.object) {
        return {
          x: ((screen.x + 1) * window.innerWidth) / 2,
          y: ((1 - screen.y) * window.innerHeight) / 2,
        };
      }
    }
    return null;
  });
  if (!target) {
    throw new Error('No visible jelly to grab');
  }
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.move(target.x + 32, target.y - 28, { steps: 12 });
  const grabbed = await page.evaluate(() =>
    window.__diagnostics.collection.blocks.some((block) => block.getBody().isGrabbed()),
  );
  if (!grabbed) {
    throw new Error('Pointer did not grab a jelly');
  }
  await measure('grab: held');
  await page.mouse.up();
  await measure('grab: released');
  await page.waitForTimeout(settings.settle);
  const containment = await page.evaluate(() => {
    let escaped = 0;
    for (const block of window.__diagnostics.collection.blocks) {
      const body = block.getBody();
      const { origin, floor, ceiling, radius } = body.container;
      for (const point of body.positions) {
        const x = point.x + origin.x,
          y = point.y + origin.y,
          z = point.z + origin.z;
        if (
          !Number.isFinite(x + y + z) ||
          y < floor - 0.001 ||
          y > ceiling + 0.001 ||
          Math.hypot(x, z) > radius + 0.001
        ) {
          escaped++;
        }
      }
    }
    return { escaped };
  });
  if (containment.escaped) {
    throw new Error('Particles escaped the glass bounds');
  }
  await page.screenshot({ path: join(tmpdir(), 'semesta-all-countries.png') });
  await page.evaluate(() => window.__diagnostics.collection.setCountries([]));
  await measure('removed: resources');
  await writeFile(
    settings.output,
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        browser: browser.version(),
        cpu: cpus()[0]?.model,
        platform: platform(),
        settings,
        results,
        errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
} finally {
  await browser.close();
}
