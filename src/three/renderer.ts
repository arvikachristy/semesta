import { getRenderPixelRatio } from './render-parameters';
import * as THREE from 'three';

// The renderer owns the WebGL canvas and draws the scene through the camera.
export const createRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setPixelRatio(getRenderPixelRatio(window.devicePixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
};
