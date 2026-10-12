import * as THREE from 'three';
import { ContinentId } from '../../types/continent';
import { glassParameters } from './glass-parameters';
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

export const createCoupeGeometry = () => {
  const wall = glassParameters.wallThickness;
  const footRadius = oceaniaCoupe.footRadius;
  const points = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(footRadius - 0.025, 0),
    new THREE.Vector2(footRadius, 0.025),
    new THREE.Vector2(footRadius, 0.05),
    new THREE.Vector2(footRadius - 0.025, 0.075),
    new THREE.Vector2(0.14, 0.11),
    new THREE.Vector2(0.095, 0.18),
    new THREE.Vector2(0.085, floor - 0.2),
    new THREE.Vector2(0.12, floor - 0.1),
    ...profile.map(
      ({ radius, height }, index) =>
        new THREE.Vector2(radius + wall, index === 0 ? height - wall : height),
    ),
  ];
  // Rounded lip connects the outside and inside without capping the opening.
  for (let step = 0; step <= 12; step++) {
    const angle = (step * Math.PI) / 12;
    points.push(
      new THREE.Vector2(
        top.radius + wall / 2 + (Math.cos(angle) * wall) / 2,
        top.height + (Math.sin(angle) * wall) / 2,
      ),
    );
  }
  points.push(
    ...[...profile].reverse().map(({ radius, height }) => new THREE.Vector2(radius, height)),
  );
  points.push(new THREE.Vector2(0, floor));
  return new THREE.LatheGeometry(points, 96);
};

export const createCoupeArtworkGeometry = () => {
  const centre = floor + (top.height - floor) * 0.65;
  const artworkHeight = (top.height - floor) * 0.58;
  const artworkWidth = artworkHeight * (665 / 505);
  const geometry = new THREE.PlaneGeometry(artworkWidth, artworkHeight, 32, 12);
  // Crop this SVG's black margins and embedded text; the separate label owns its name.
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(index, (180 + uv.getX(index) * 665) / 1024, (389 + uv.getY(index) * 505) / 1024);
  }
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const y = centre + positions.getY(index);
    const radius =
      coupeWallAt(y).radius + glassParameters.wallThickness + oceaniaCoupe.artworkOffset;
    const angle = positions.getX(index) / radius;
    positions.setXYZ(index, Math.sin(angle) * radius, y, Math.cos(angle) * radius);
  }
  geometry.computeVertexNormals();
  return geometry;
};

export const createCoupeWordGeometry = () => {
  const sourceWidth = 600;
  const sourceHeight = 132;
  const centre = floor + (top.height - floor) * 0.2;
  const radius =
    coupeWallAt(centre).radius + glassParameters.wallThickness + oceaniaCoupe.artworkOffset;
  const width = radius * 1.7;
  const height = width * (sourceHeight / sourceWidth);
  const geometry = new THREE.PlaneGeometry(width, height, 32, 2);
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(
      index,
      (212 + uv.getX(index) * sourceWidth) / 1024,
      (132 + uv.getY(index) * sourceHeight) / 1024,
    );
  }
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const y = centre + positions.getY(index);
    const radius =
      coupeWallAt(y).radius + glassParameters.wallThickness + oceaniaCoupe.artworkOffset;
    const angle = positions.getX(index) / radius;
    positions.setXYZ(
      index,
      Math.sin(angle) * radius,
      positions.getY(index),
      Math.cos(angle) * radius,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
};
