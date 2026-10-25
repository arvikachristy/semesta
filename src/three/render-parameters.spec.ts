import { describe, expect, it } from 'vitest';
import { createRenderQuality, getRenderPixelRatio, renderParameters } from './render-parameters';

describe('adaptive canvas resolution', () => {
  it('ignores isolated slow frames and stays within the configured quality range', () => {
    const quality = createRenderQuality();
    quality.sample(20);
    expect(quality.sample(60)).toBe(1);
    for (let sample = 0; sample < renderParameters.slowSamples * 10; sample++) {
      quality.sample(20);
    }
    expect(quality.getScale()).toBe(renderParameters.minResolutionScale);
    const pixels = 1_280 * 800;
    expect(pixels * getRenderPixelRatio(2, pixels, quality.getScale()) ** 2).toBeCloseTo(
      renderParameters.maxCanvasPixels * quality.getScale() ** 2,
    );
  });
  it('sharpens small high-density viewports without exceeding the canvas pixel budget', () => {
    const viewportPixels = 390 * 844;
    const ratio = getRenderPixelRatio(3, viewportPixels);
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(2);
    expect(viewportPixels * ratio ** 2).toBeCloseTo(renderParameters.maxCanvasPixels);
    expect(getRenderPixelRatio(3, 1_280 * 800)).toBeLessThan(1);
    expect(getRenderPixelRatio(1, viewportPixels)).toBe(1);
  });
  it('enforces the pixel budget on large desktop and 4K canvases, including reduced quality', () => {
    for (const pixels of [1440 * 900, 1920 * 1080, 3840 * 2160]) {
      for (const scale of [1, renderParameters.minResolutionScale]) {
        const ratio = getRenderPixelRatio(2, pixels, scale);
        expect(ratio).toBeLessThan(1);
        expect(pixels * ratio ** 2).toBeCloseTo(renderParameters.maxCanvasPixels * scale ** 2);
      }
    }
  });
  it('requires sustained headroom to restore sharpness and preserves quality in the middle band', () => {
    const quality = createRenderQuality();
    for (let sample = 0; sample < renderParameters.slowSamples; sample++) {
      quality.sample(30);
    }
    const reduced = quality.getScale();
    for (let sample = 0; sample < renderParameters.fastSamples * 2; sample++) {
      quality.sample(53);
    }
    expect(quality.getScale()).toBe(reduced);
    for (let sample = 0; sample < renderParameters.fastSamples; sample++) {
      quality.sample(60);
    }
    expect(quality.getScale()).toBe(1);
  });
});
