import { describe, expect, it } from 'vitest';
import { jellyParameters } from '../jelly-flags/jelly-parameters';
import { glassDimensions, glassParameters } from './glass-parameters';

describe('glass capacity', () => {
  it('reserves 10% headroom while fitting the estimated volume of 60 miniature jellies', () => {
    const { interiorDiameter, interiorHeight, topBuffer } = glassDimensions;
    const { width, height, depth } = jellyParameters.surface;
    const jellyVolume = width * height * depth * 0.3 ** 3;
    const pileVolume = Math.PI * (interiorDiameter / 2) ** 2 * (interiorHeight - topBuffer);
    expect(glassParameters.capacity).toBe(60);
    expect(glassParameters.jellyScale).toBe(0.3);
    expect(topBuffer / interiorHeight).toBeCloseTo(0.1);
    expect((pileVolume * glassParameters.packingFraction) / jellyVolume).toBeCloseTo(93.75);
    expect(glassDimensions.estimatedPackingCapacity).toBeCloseTo(93.75);
    expect(interiorDiameter).toBeCloseTo(1.9504302557 * 1.25);
    expect(interiorHeight).toBeCloseTo(3.149, 3);
  });

  it('adds glass walls and a base outside the interior capacity', () => {
    expect(glassDimensions.outerRadius - glassDimensions.interiorDiameter / 2).toBeCloseTo(0.045);
    expect(glassDimensions.outerHeight - glassDimensions.interiorHeight).toBeCloseTo(0.07);
  });
});
