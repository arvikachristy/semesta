import * as THREE from 'three';
import { readScenePalette } from '../scene-palette';
import type { IScenePalette } from '../scene-palette';
import type { IContinent } from './continents';
import { glassDimensions, glassParameters } from './glass-parameters';

export const createGoldMaterial = (palette: IScenePalette = readScenePalette()) =>
  new THREE.MeshStandardMaterial({
    ...glassParameters.gold,
    color: palette.glassMetal,
  });

export const createArtworkGeometry = (
  width = glassParameters.artwork.width,
  height = glassParameters.artwork.height,
  radius = glassDimensions.outerRadius + glassParameters.artwork.surfaceOffset,
) => {
  const geometry = new THREE.PlaneGeometry(width, height, 32, 1);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const angle = positions.getX(index) / radius;
    positions.setXYZ(
      index,
      Math.sin(angle) * radius,
      positions.getY(index),
      Math.cos(angle) * radius,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
};

export const createContinentArtwork = (
  continent: IContinent,
  geometry: THREE.BufferGeometry,
  palette: IScenePalette = readScenePalette(),
  onLoad?: () => void,
) => {
  const texture = new THREE.TextureLoader().load(continent.artwork, onLoad);
  texture.colorSpace = THREE.NoColorSpace;
  const material = createGoldMaterial(palette);
  material.alphaMap = texture;
  material.alphaTest = 0.35;
  const object = new THREE.Mesh(geometry, material);
  object.position.y = glassDimensions.outerHeight * glassParameters.artwork.centreHeight;
  return {
    object,
    setTheme: (next: IScenePalette) => material.color.set(next.glassMetal),
    dispose: () => {
      texture.dispose();
      material.dispose();
    },
  };
};
