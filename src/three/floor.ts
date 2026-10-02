import * as THREE from 'three';

// A horizontal plane at Y = 0, matching the background's pink exactly.
export const createFloor = () => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 200),
    new THREE.ShadowMaterial({ color: '#71384b', opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
};
