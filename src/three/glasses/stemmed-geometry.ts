import * as THREE from 'three';
import { glassParameters } from './glass-parameters';

export interface IStemmedBowl {
  profile: readonly { height: number; radius: number }[];
  floor: number;
  footRadius: number;
}

// Revolve the foot, stem, outside bowl, rounded open lip, and inside bowl.
export const createStemmedGlassGeometry = ({ profile, floor, footRadius }: IStemmedBowl) => {
  const wall = glassParameters.wallThickness;
  const top = profile[profile.length - 1];
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
