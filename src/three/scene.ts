import * as THREE from 'three';
import { readScenePalette } from './scene-palette';
import type { IScenePalette } from './scene-palette';

export const createScene = (palette: IScenePalette = readScenePalette()) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.world);
  return scene;
};
