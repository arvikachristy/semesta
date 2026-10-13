import { describe, expect, it } from 'vitest';
import { getGlassDefinition } from '../glasses/glass-definitions';
import { continentDefinitions } from '../../types/continent';
import { getInitialJellyPosition } from './initial-jelly-position';

describe('saved-country placement', () => {
  it('keeps every saved jelly center inside its current continent glass', () => {
    for (const { id } of continentDefinitions) {
      const glass = getGlassDefinition(id);
      for (let index = 0; index < glass.capacity; index++) {
        const position = getInitialJellyPosition(index, glass);
        const radius = glass.wallAt?.(position.y).radius ?? glass.innerRadius;
        expect(position.y).toBeGreaterThan(glass.floor);
        expect(position.y).toBeLessThan(glass.ceiling);
        expect(Math.hypot(position.x, position.z)).toBeLessThanOrEqual(radius);
      }
    }
  });
});
