import * as THREE from 'three';
import { readScenePalette } from './theme';

// The floor uses a transparent shadow material over the scene colour.
export const createFloor = () => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 200),
    new THREE.ShadowMaterial({ color: readScenePalette().shadow, opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
};
