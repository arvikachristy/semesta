import * as THREE from 'three';
import { ContinentId } from '../../types/continent';
import { glassParameters } from './glass-parameters';
import { getCocktailBowlVolume, getCountryCapacity } from './glass-capacity';
import { profileVolume, findProfileFillHeight } from './glass-profile';
import { createProfileArtworkGeometry } from './profile-artwork';

const capacity = getCountryCapacity(ContinentId.NorthAmerica);
const bowlVolume = getCocktailBowlVolume(capacity);
const bottomRatio = 0.3;
const heightToTopRadius = 1.4;
const topRadius = Math.cbrt(
  (bowlVolume * 3) / (Math.PI * heightToTopRadius * (bottomRatio ** 2 + bottomRatio + 1)),
);
const floor = 1.05;
const bowlHeight = topRadius * heightToTopRadius;
const profile = Array.from({ length: 33 }, (_, index) => {
  const t = index / 32;
  return {
    height: floor + bowlHeight * t,
    radius: topRadius * (bottomRatio + (1 - bottomRatio) * t),
  };
});
const top = profile[profile.length - 1];
const slope = (topRadius * (1 - bottomRatio)) / bowlHeight;

export const martiniWallAt = (height: number) => ({
  radius: topRadius * bottomRatio + slope * THREE.MathUtils.clamp(height - floor, 0, bowlHeight),
  slope,
});

const ceiling = findProfileFillHeight(
  profile,
  bowlVolume * (1 - glassParameters.topBufferFraction),
);

export const northAmericaMartini = {
  capacity,
  profile,
  floor,
  ceiling,
  height: top.height,
  innerRadius: topRadius,
  outerRadius: topRadius + glassParameters.wallThickness,
  footRadius: topRadius * 0.46,
  artworkOffset: 0.006,
  bowlVolume: profileVolume(profile),
  usableVolume: bowlVolume * (1 - glassParameters.topBufferFraction),
};

export const createMartiniMapGeometry = () => {
  const height = bowlHeight * 0.53;
  return createProfileArtworkGeometry(
    height * (680 / 540),
    height,
    floor + bowlHeight * 0.69,
    martiniWallAt,
    northAmericaMartini.artworkOffset,
    { left: 170, top: 110, right: 850, bottom: 650 },
  );
};

export const createMartiniWordGeometry = () => {
  const centre = floor + bowlHeight * 0.23;
  const width = martiniWallAt(centre).radius * 1.7;
  return createProfileArtworkGeometry(
    width,
    width * (155 / 834),
    centre,
    martiniWallAt,
    northAmericaMartini.artworkOffset,
    { left: 95, top: 750, right: 929, bottom: 905 },
  );
};
