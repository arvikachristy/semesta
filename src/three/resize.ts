import { getRenderPixelRatio } from './render-parameters';
import type * as THREE from 'three';

// Keep the perspective projection and drawing buffer aligned with the viewport.
export const resize = (
  renderer: Pick<THREE.WebGLRenderer, 'setPixelRatio' | 'setSize'>,
  camera: THREE.PerspectiveCamera,
  resolutionScale = 1,
  canvas?: HTMLCanvasElement,
) => {
  const width = canvas?.clientWidth || window.innerWidth;
  const height = canvas?.clientHeight || window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(
    getRenderPixelRatio(window.devicePixelRatio, width * height, resolutionScale),
  );
  renderer.setSize(width, height, false);
};
