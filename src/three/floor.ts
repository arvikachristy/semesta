import * as THREE from 'three';

// A horizontal plane at Y = 0, matching the background's pink exactly.
export const createFloor = () => {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 200),
    new THREE.MeshBasicMaterial({ color: '#f3c9c7' }),
  );
  floor.rotation.x = -Math.PI / 2;
  return floor;
};
