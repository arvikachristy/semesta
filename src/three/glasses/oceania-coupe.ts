import * as THREE from 'three';
import { ContinentId } from '../../types/continent';
import { glassParameters } from './glass-parameters';
import { createStemmedGlassGeometry } from './stemmed-geometry';
import { createProfileArtworkGeometry } from './profile-artwork';
import {
  cocktailPackingFraction,
  getCocktailBowlVolume,
  getCountryCapacity,
} from './glass-capacity';

interface IProfilePoint {
  height: number;
  radius: number;
}

export const profileVolume = (profile: readonly IProfilePoint[]) =>
  profile.slice(1).reduce((volume, point, index) => {
    const previous = profile[index];
    return (
      volume +
      (Math.PI *
        (point.height - previous.height) *
        (previous.radius ** 2 + previous.radius * point.radius + point.radius ** 2)) /
        3
    );
  }, 0);

const capacity = getCountryCapacity(ContinentId.Oceania);
const packingFraction = cocktailPackingFraction;
const targetVolume = getCocktailBowlVolume(capacity);
const normalized = Array.from({ length: 33 }, (_, index) => {
  const t = index / 32;
  return { height: t * 1.05, radius: Math.sqrt(0.09 + 0.91 * (2 * t - t * t)) };
});
const scale = Math.cbrt(targetVolume / profileVolume(normalized));
const floor = 1.05;
const profile = normalized.map((point) => ({
  height: floor + point.height * scale,
  radius: point.radius * scale,
}));
const top = profile[profile.length - 1];

export const coupeWallAt = (height: number) => {
  const index = Math.max(
    1,
    profile.findIndex((point) => point.height >= height),
  );
  const end = height >= top.height ? top : profile[index];
  const start = height >= top.height ? profile[profile.length - 2] : profile[index - 1];
  const slope = (end.radius - start.radius) / (end.height - start.height);
  return {
    radius:
      start.radius + slope * (THREE.MathUtils.clamp(height, floor, top.height) - start.height),
    slope,
  };
};

// Headroom is a fraction of bowl volume, not its height; stems never count as capacity.
let low = floor;
let high = top.height;
for (let iteration = 0; iteration < 48; iteration++) {
  const height = (low + high) / 2;
  const partial = [
    ...profile.filter((point) => point.height < height),
    { height, radius: coupeWallAt(height).radius },
  ];
  if (profileVolume(partial) < targetVolume * (1 - glassParameters.topBufferFraction)) {
    low = height;
  } else {
    high = height;
  }
}

export const oceaniaCoupe = {
  capacity,
  packingFraction,
  artworkOffset: 0.006,
  footRadius: top.radius * 0.56,
  profile,
  floor,
  ceiling: (low + high) / 2,
  height: top.height,
  innerRadius: top.radius,
  outerRadius: top.radius + glassParameters.wallThickness,
  bowlVolume: profileVolume(profile),
  usableVolume: targetVolume * (1 - glassParameters.topBufferFraction),
};

export const createCoupeGeometry = () => createStemmedGlassGeometry(oceaniaCoupe);

export const createCoupeArtworkGeometry = () => {
  const centre = floor + (top.height - floor) * 0.65;
  const artworkHeight = (top.height - floor) * 0.58;
  return createProfileArtworkGeometry(
    artworkHeight * (665 / 505),
    artworkHeight,
    centre,
    coupeWallAt,
    oceaniaCoupe.artworkOffset,
    { left: 180, top: 130, right: 845, bottom: 635 },
  );
};

export const createCoupeWordGeometry = () => {
  const centre = floor + (top.height - floor) * 0.2;
  const radius =
    coupeWallAt(centre).radius + glassParameters.wallThickness + oceaniaCoupe.artworkOffset;
  const width = radius * 1.7;
  return createProfileArtworkGeometry(
    width,
    width * (132 / 600),
    centre,
    coupeWallAt,
    oceaniaCoupe.artworkOffset,
    { left: 212, top: 760, right: 812, bottom: 892 },
  );
};
