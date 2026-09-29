import type * as THREE from 'three';

// Keep the perspective projection and drawing buffer aligned with the viewport.
export const resize = (renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
};
