import { ContinentId } from '../../types/continent';
import { glassParameters } from './glass-parameters';
import { getCocktailBowlVolume, getCountryCapacity } from './glass-capacity';
import { findProfileFillHeight, profileVolume, profileWallAt } from './glass-profile';
import { createProfileArtworkGeometry } from './profile-artwork';

const capacity = getCountryCapacity(ContinentId.SouthAmerica);
const targetVolume = getCocktailBowlVolume(capacity);
const floor = 1.05;
// A rounded base rises into nearly vertical sides at the narrow opening.
const normalized = Array.from({ length: 33 }, (_, index) => {
  const t = index / 32;
  return { height: t * 4.4, radius: 0.52 + 0.48 * Math.sin((Math.PI * t) / 2) };
});
const scale = Math.cbrt(targetVolume / profileVolume(normalized));
const profile = normalized.map(({ height, radius }) => ({
  height: floor + height * scale,
  radius: radius * scale,
}));
const top = profile[profile.length - 1];
const bowlHeight = top.height - floor;

export const fluteWallAt = (height: number) => profileWallAt(profile, height);
export const southAmericaFlute = {
  capacity,
  profile,
  floor,
  ceiling: findProfileFillHeight(profile, targetVolume * (1 - glassParameters.topBufferFraction)),
  height: top.height,
  innerRadius: top.radius,
  outerRadius: top.radius + glassParameters.wallThickness,
  footRadius: top.radius * 0.88,
  artworkOffset: 0.006,
  bowlVolume: profileVolume(profile),
  usableVolume: targetVolume * (1 - glassParameters.topBufferFraction),
};

export const createFluteMapGeometry = () => {
  const height = bowlHeight * 0.49;
  return createProfileArtworkGeometry(
    height * (464 / 605),
    height,
    floor + bowlHeight * 0.68,
    fluteWallAt,
    southAmericaFlute.artworkOffset,
    { left: 280, top: 80, right: 744, bottom: 685 },
  );
};

export const createFluteWordGeometry = () => {
  const centre = floor + bowlHeight * 0.32;
  const width = fluteWallAt(centre).radius * 1.7;
  return createProfileArtworkGeometry(
    width,
    Math.max(width * (145 / 744), 0.26),
    centre,
    fluteWallAt,
    southAmericaFlute.artworkOffset,
    { left: 140, top: 745, right: 884, bottom: 890 },
  );
};
