import { getRenderPixelRatio } from './render-parameters';
import type * as THREE from 'three';

// Keep the perspective projection and drawing buffer aligned with the viewport.
export const resize = (
  renderer: Pick<THREE.WebGLRenderer, 'setPixelRatio' | 'setSize'>,
  camera: THREE.PerspectiveCamera,
) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(getRenderPixelRatio(window.devicePixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
};
