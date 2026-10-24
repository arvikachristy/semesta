import * as THREE from 'three';
import { readScenePalette } from './theme';

// Background shares the active CSS theme with the DOM.
export const createScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(readScenePalette().world);
  return scene;
};
