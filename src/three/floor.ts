import * as THREE from 'three';
import { readScenePalette } from './scene-palette';
import type { IScenePalette } from './scene-palette';

// The plane receives shadows while the scene background supplies its colour.
export const createFloor = (palette: IScenePalette = readScenePalette()) => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 200),
    new THREE.ShadowMaterial({ color: palette.shadow, opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
};
