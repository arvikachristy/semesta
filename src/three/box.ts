import * as THREE from 'three';

// A unit cube centred half a unit above the floor, so its base rests on Y = 0.
export const createBox = () => {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: '#742f42' }),
  );
  box.position.set(0, 0.5, 0);
  box.rotation.y = Math.PI / 8;
  return box;
};
