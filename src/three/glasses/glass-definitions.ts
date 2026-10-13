import { ContinentId } from '../../types/continent';
import type { TContinentId } from '../../types/continent';
import { glassDimensions, glassParameters } from './glass-parameters';
import { getCocktailBowlVolume, getCountryCapacity } from './glass-capacity';
import { coupeWallAt, oceaniaCoupe } from './oceania-coupe';

export enum GlassShape {
  Cylinder = 'cylinder',
  Highball = 'highball',
  Coupe = 'coupe',
}

export interface IGlassDefinition {
  shape: GlassShape;
  capacity: number;
  floor: number;
  ceiling: number;
  innerRadius: number;
  outerRadius: number;
  height: number;
  rimHeight: number;
  artworkOffset: number;
  bowlVolume: number;
  usableVolume: number;
  wallAt?: (height: number) => { radius: number; slope: number };
}

export const createHighballDefinition = (capacity: number): IGlassDefinition => {
  const heightToDiameter = 2.25;
  const bowlVolume = getCocktailBowlVolume(capacity);
  const innerRadius = Math.cbrt(bowlVolume / (Math.PI * 2 * heightToDiameter));
  const interiorHeight = innerRadius * 2 * heightToDiameter;
  const floor = glassParameters.baseThickness;
  return {
    shape: GlassShape.Highball,
    wallAt: () => ({ radius: innerRadius, slope: 0 }),
    capacity,
    floor,
    ceiling: floor + interiorHeight * (1 - glassParameters.topBufferFraction),
    innerRadius,
    outerRadius: innerRadius + glassParameters.wallThickness,
    height: floor + interiorHeight + glassParameters.wallThickness / 2,
    rimHeight: floor + interiorHeight,
    artworkOffset: glassParameters.artwork.surfaceOffset,
    bowlVolume,
    usableVolume: bowlVolume * (1 - glassParameters.topBufferFraction),
  };
};

const cylinder: IGlassDefinition = {
  shape: GlassShape.Cylinder,
  capacity: glassParameters.capacity,
  floor: glassParameters.baseThickness,
  ceiling:
    glassParameters.baseThickness + glassDimensions.interiorHeight - glassDimensions.topBuffer,
  innerRadius: glassDimensions.interiorDiameter / 2,
  outerRadius: glassDimensions.outerRadius,
  height: glassDimensions.outerHeight,
  rimHeight: glassDimensions.outerHeight - glassParameters.wallThickness / 2,
  artworkOffset: glassParameters.artwork.surfaceOffset,
  bowlVolume:
    Math.PI * (glassDimensions.interiorDiameter / 2) ** 2 * glassDimensions.interiorHeight,
  usableVolume:
    Math.PI *
    (glassDimensions.interiorDiameter / 2) ** 2 *
    (glassDimensions.interiorHeight - glassDimensions.topBuffer),
};
const coupe: IGlassDefinition = {
  ...oceaniaCoupe,
  shape: GlassShape.Coupe,
  height: oceaniaCoupe.height + glassParameters.wallThickness / 2,
  rimHeight: oceaniaCoupe.height + glassParameters.wallThickness / 2,
  wallAt: coupeWallAt,
};
const africaHighball = createHighballDefinition(getCountryCapacity(ContinentId.Africa));

// Continent assignment lives here; rendering and physics switch on shape or use these dimensions.
export const getGlassDefinition = (continent: TContinentId): IGlassDefinition => {
  switch (continent) {
    case ContinentId.Africa:
      return africaHighball;
    case ContinentId.Oceania:
      return coupe;
    default:
      return cylinder;
  }
};
