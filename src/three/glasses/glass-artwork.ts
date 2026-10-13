import * as THREE from 'three';
import type { IContinent } from './continents';
import { glassDimensions, glassParameters } from './glass-parameters';

export const createGoldMaterial = () =>
  new THREE.MeshStandardMaterial({
    ...glassParameters.gold,
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

export const createContinentArtwork = (continent: IContinent, geometry: THREE.BufferGeometry) => {
  const texture = new THREE.TextureLoader().load(continent.artwork);
  texture.colorSpace = THREE.NoColorSpace;
  const material = createGoldMaterial();
  material.alphaMap = texture;
  material.alphaTest = 0.35;
  const object = new THREE.Mesh(geometry, material);
  object.position.y = glassDimensions.outerHeight * glassParameters.artwork.centreHeight;
  return {
    object,
    dispose: () => {
      texture.dispose();
      material.dispose();
    },
  };
};
