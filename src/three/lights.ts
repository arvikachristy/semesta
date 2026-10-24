import * as THREE from 'three';
import { readScenePalette } from './scene-palette';
import type { IScenePalette } from './scene-palette';

// Regenerate the tiny reflection environment on demand, never the world or physics.
const makeEnvironment = (renderer: THREE.WebGLRenderer, palette: IScenePalette) => {
  const lightingScene = new THREE.Scene();
  lightingScene.background = new THREE.Color(palette.reflectionBackground);
  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  const panels = [
    { color: '#ffffff', intensity: 2, size: [4, 7], position: [-4, -1, 1] },
    { color: palette.reflectionWarm, intensity: 3, size: [5, 2], position: [1, 5, -2] },
    { color: '#ffffff', intensity: 1.5, size: [4, 7], position: [4, -1, 1] },
    { color: palette.reflectionCool, intensity: 2, size: [3, 3], position: [0, 1, -5] },
  ].map(({ color, intensity, size, position }) => {
    const material = new THREE.MeshBasicMaterial({ color });
    material.color.multiplyScalar(intensity);
    const panel = new THREE.Mesh(panelGeometry, material);
    panel.scale.set(size[0], size[1], 1);
    panel.position.set(position[0], position[1], position[2]);
    panel.lookAt(0, 0, 0);
    lightingScene.add(panel);
    return panel;
  });
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(lightingScene, 0.025, 0.1, 30, { size: 128 });
  generator.dispose();
  panelGeometry.dispose();
  panels.forEach((panel) => panel.material.dispose());
  lightingScene.clear();

  return environment;
};

export const createLights = (
  renderer: THREE.WebGLRenderer,
  palette: IScenePalette = readScenePalette(),
) => {
  const ambientLight = new THREE.AmbientLight('#ffffff', 1);
  const directionalLight = new THREE.DirectionalLight('#ffffff', 1.3);
  directionalLight.position.set(1, 6, 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  Object.assign(directionalLight.shadow.camera, {
    left: -5,
    right: 5,
    top: 4,
    bottom: -4,
    near: 0.1,
    far: 15,
  });
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.blurSamples = 8;
  directionalLight.shadow.normalBias = 0.025;
  directionalLight.shadow.bias = -0.0001;

  let environment = makeEnvironment(renderer, palette);
  return {
    ambientLight,
    directionalLight,
    environment: environment.texture,
    setTheme: (next: IScenePalette) => {
      const previous = environment;
      environment = makeEnvironment(renderer, next);
      previous.dispose();
      return environment.texture;
    },
    dispose: () => {
      environment.dispose();
      directionalLight.shadow.dispose();
    },
  };
};
