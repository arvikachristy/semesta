import { describe, expect, it } from 'vitest';
import { createJellyGeometry, JellyAttribute } from './jelly-geometry';
import { jellyParameters } from './jelly-parameters';

describe('shared rest geometry', () => {
  it('gives each body independent deformation buffers and preserves rest UVs', () => {
    const first = createJellyGeometry(1);
    const second = createJellyGeometry(0.3);
    const original = second.getAttribute(JellyAttribute.Position).getX(0);
    first.getAttribute(JellyAttribute.Position).setX(0, 100);
    expect(second.getAttribute(JellyAttribute.Position).getX(0)).toBe(original);
    expect(first.getAttribute(JellyAttribute.Uv).array).toEqual(
      second.getAttribute(JellyAttribute.Uv).array,
    );
    second.computeBoundingBox();
    const box = second.boundingBox;
    expect(box && box.max.x - box.min.x).toBeCloseTo(jellyParameters.surface.width * 0.3);
    first.dispose();
    second.dispose();
  });
});
