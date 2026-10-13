import { ContinentId } from '../../types/continent';
import { glassParameters } from './glass-parameters';
import { createStemmedGlassGeometry } from './stemmed-geometry';
import { createProfileArtworkGeometry } from './profile-artwork';
import { profileVolume, profileWallAt, findProfileFillHeight } from './glass-profile';
import {
  cocktailPackingFraction,
  getCocktailBowlVolume,
  getCountryCapacity,
} from './glass-capacity';

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

export const coupeWallAt = (height: number) => profileWallAt(profile, height);
const ceiling = findProfileFillHeight(
  profile,
  targetVolume * (1 - glassParameters.topBufferFraction),
);

export const oceaniaCoupe = {
  capacity,
  packingFraction,
  artworkOffset: 0.006,
  footRadius: top.radius * 0.56,
  profile,
  floor,
  ceiling,
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
