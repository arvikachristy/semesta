import { jellyParameters } from '../jelly-flags/jelly-parameters';

export const glassParameters = {
  count: 7,
  circleRadius: 4.5,
  capacity: 60,
  jellyScale: 0.3,
  packingFraction: 0.5,
  topBufferFraction: 0.1,
  heightToDiameter: 1.55 / 0.96,
  wallThickness: 0.045,
  baseThickness: 0.07,
};

const { width, height, depth } = jellyParameters.surface;
const jellyVolume = width * height * depth * glassParameters.jellyScale ** 3;
const interiorDiameter = Math.cbrt(
  (glassParameters.capacity * jellyVolume) /
    (glassParameters.packingFraction *
      (1 - glassParameters.topBufferFraction) *
      (Math.PI / 4) *
      glassParameters.heightToDiameter),
);
const interiorHeight = interiorDiameter * glassParameters.heightToDiameter;

// Capacity is a loose-pile volume estimate; filling physics must validate it later.
export const glassDimensions = {
  interiorDiameter,
  interiorHeight,
  topBuffer: interiorHeight * glassParameters.topBufferFraction,
  outerRadius: interiorDiameter / 2 + glassParameters.wallThickness,
  outerHeight: interiorHeight + glassParameters.baseThickness,
};
