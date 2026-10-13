import { GlassShape } from '../glasses/glass-definitions';
import type { IGlassDefinition } from '../glasses/glass-definitions';
import { glassParameters } from '../glasses/glass-parameters';
import { jellyParameters } from './jelly-parameters';

const columns = [1, 0, 2];
const rows = [1, 2, 0, 3];
const slotsPerLayer = columns.length * rows.length;

// The saved collection starts as a compact, supported stack rather than a queue
// of falling bodies. Adjacent volumes touch so removing one can wake its neighbours.
export const getInitialJellyPosition = (index: number, glass?: IGlassDefinition) => {
  if (glass && glass.shape !== GlassShape.Cylinder) {
    const slots = glass.capacity > 40 ? 8 : 6;
    const layers = Math.ceil(glass.capacity / slots);
    const layer = Math.floor(index / slots);
    const height = (glass.ceiling - glass.floor) / layers;
    const y = glass.floor + (layer + 0.5) * height;
    const columns = 3;
    const row = Math.floor((index % slots) / columns);
    const column = index % columns;
    const width = jellyParameters.surface.width * glassParameters.jellyScale;
    const depth = jellyParameters.surface.depth * glassParameters.jellyScale;
    const x = (column - 1) * width;
    const z = (row - (Math.ceil(slots / columns) - 1) / 2) * depth;
    const wallRadius = glass.wallAt?.(y).radius ?? glass.innerRadius;
    const inset = Math.max(0, wallRadius - 0.03);
    const scale = Math.min(1, inset / Math.max(Math.hypot(x, z), 0.001));
    return { x: x * scale, y, z: z * scale };
  }
  const slot = index % slotsPerLayer;
  const layer = Math.floor(index / slotsPerLayer);
  const width = jellyParameters.surface.width * glassParameters.jellyScale;
  const height = jellyParameters.surface.height * glassParameters.jellyScale;
  const depth = jellyParameters.surface.depth * glassParameters.jellyScale;
  return {
    x: (columns[slot % columns.length] - 1) * width,
    y: (glass?.floor ?? glassParameters.baseThickness) + (layer + 0.5) * height,
    z: (rows[Math.floor(slot / columns.length)] - 1.5) * depth,
  };
};
