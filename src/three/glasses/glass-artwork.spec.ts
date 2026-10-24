import * as THREE from 'three';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { continents } from './continents';
import { createArtworkGeometry } from './glass-artwork';
import { glassDimensions, glassParameters } from './glass-parameters';
import { getGlassTint } from './glass-material';

describe('continent plating and amber glass', () => {
  it('has seven unique continent identifiers, names and local artwork assets', () => {
    expect(new Set(continents.map((item) => item.id)).size).toBe(7);
    expect(new Set(continents.map((item) => item.name)).size).toBe(7);
    expect(new Set(continents.map((item) => item.artwork)).size).toBe(7);
  });

  it('ships sized SVG masks with the correct names so WebGL can upload the lettering', () => {
    continents.forEach((continent) => {
      const svg = readFileSync(new URL(`./assets/${continent.id}.svg`, import.meta.url), 'utf8');
      expect(svg).toContain('width="1024" height="1024"');
      expect(svg).toContain(continent.name.toUpperCase());
      expect(svg).toContain('<path fill="white"');
      expect(svg).toContain('font-family="Farro, Arial, sans-serif"');
    });
  });

  it('conforms the plating to the outside wall without intersecting the glass', () => {
    const geometry = createArtworkGeometry();
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      expect(Math.hypot(positions.getX(index), positions.getZ(index))).toBeCloseTo(
        glassDimensions.outerRadius + glassParameters.artwork.surfaceOffset,
      );
    }
    geometry.dispose();
  });

  it('fades from amber at the base to clear by 45% height and remains clear above', () => {
    const base = new THREE.Color(glassParameters.gradient.bottomColor);
    const clear = new THREE.Color(glassParameters.gradient.clearColor);
    expect(getGlassTint(0).equals(base)).toBe(true);
    expect(getGlassTint(glassDimensions.outerHeight * 0.45).equals(clear)).toBe(true);
    expect(getGlassTint(glassDimensions.outerHeight).equals(clear)).toBe(true);
    const middle = getGlassTint(glassDimensions.outerHeight * 0.225);
    expect(middle.equals(base)).toBe(false);
    expect(middle.equals(clear)).toBe(false);
  });
});
