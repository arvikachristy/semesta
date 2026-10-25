import * as THREE from 'three';
import type { IScenePalette } from './scene-palette';

// Keep the gradient inside WebGL so transmissive glass refracts the scene colour.
export const createSceneBackground = (palette: IScenePalette) => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Color(palette.world);
  }
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, palette.worldSky);
  gradient.addColorStop(1, palette.world);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const createScene = (palette: IScenePalette) => {
  const scene = new THREE.Scene();
  scene.background = createSceneBackground(palette);
  return scene;
};
