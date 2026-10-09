import { describe, expect, it } from 'vitest';
import { getFlagAtlasLayout, getFlagAtlasUv } from './flag-atlas';

describe('flag atlas', () => {
  it('keeps every tile inside its own texels, including the final row of a full glass', () => {
    const layout = getFlagAtlasLayout(60);
    for (let slot = 0; slot < 60; slot++) {
      const uv = getFlagAtlasUv(layout, slot);
      expect(uv.x).toBeGreaterThan(0);
      expect(uv.y).toBeGreaterThan(0);
      expect(uv.x + uv.width).toBeLessThan(1);
      expect(uv.y + uv.height).toBeLessThan(1);
      if (slot % layout.columns !== layout.columns - 1) {
        expect(uv.x + uv.width).toBeLessThan(getFlagAtlasUv(layout, slot + 1).x);
      }
    }
  });
  it('allocates a small initial atlas and keeps all six populated atlases below 32 MiB', () => {
    const initial = getFlagAtlasLayout(1);
    expect(initial.atlasWidth * initial.atlasHeight * 4).toBeLessThan(128 * 1024);
    const bytes = [54, 48, 44, 23, 14, 12].reduce((total, count) => {
      const layout = getFlagAtlasLayout(count);
      return total + layout.atlasWidth * layout.atlasHeight * 4;
    }, 0);
    expect(bytes).toBeLessThan(32 * 1024 * 1024);
  });
});
