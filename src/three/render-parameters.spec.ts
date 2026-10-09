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
    expect(getRenderPixelRatio(2, quality.getScale())).toBe(renderParameters.minResolutionScale);
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
