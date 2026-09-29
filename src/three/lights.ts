import * as THREE from 'three';

// Ambient fills every face; directional light makes the box's faces readable.
export const createLights = () => {
  const ambientLight = new THREE.AmbientLight('#ffffff', 1);
  const directionalLight = new THREE.DirectionalLight('#ffffff', 1.3);
  directionalLight.position.set(3, 6, 4);
  return { ambientLight, directionalLight };
};
