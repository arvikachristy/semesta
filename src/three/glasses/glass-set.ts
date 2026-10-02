import * as THREE from 'three';
import { createGlassGeometry } from './glass-geometry';
import { createGlassMaterial } from './glass-material';
import { glassDimensions, glassParameters } from './glass-parameters';
import { continents } from './continents';
import { createArtworkGeometry, createContinentArtwork, createGoldMaterial } from './glass-artwork';

export const createGlassSet = () => {
  const object = new THREE.Group();
  const geometry = createGlassGeometry();
  const material = createGlassMaterial();
  const artworkGeometry = createArtworkGeometry();
  const rimGeometry = new THREE.TorusGeometry(
    glassDimensions.outerRadius - glassParameters.wallThickness / 2,
    0.012,
    8,
    96,
  );
  const goldMaterial = createGoldMaterial();
  const artworkResources: ReturnType<typeof createContinentArtwork>[] = [];
  const worldPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();

  for (let index = 0; index < glassParameters.count; index++) {
    const angle = Math.PI - (index * Math.PI * 2) / glassParameters.count;
    const glass = new THREE.Mesh(geometry, material);
    const continent = continents[index];
    glass.name = continent.id;
    const artwork = createContinentArtwork(continent, artworkGeometry);
    artworkResources.push(artwork);
    const rim = new THREE.Mesh(rimGeometry, goldMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = glassDimensions.outerHeight - glassParameters.wallThickness / 2;
    glass.add(artwork.object, rim);
    glass.position.set(
      glassParameters.circleRadius * Math.sin(angle),
      0,
      glassParameters.circleRadius * Math.cos(angle),
    );
    object.add(glass);
  }

  // The complete rotation envelope keeps every orientation inside the camera fit.
  const extent =
    glassParameters.circleRadius +
    glassDimensions.outerRadius +
    glassParameters.artwork.surfaceOffset;
  return {
    object,
    bounds: new THREE.Box3(
      new THREE.Vector3(-extent, 0, -extent),
      new THREE.Vector3(extent, glassDimensions.outerHeight, extent),
    ),
    rotateBy: (viewportDelta: number) => {
      object.rotation.y += viewportDelta * glassParameters.dragRadiansPerViewport;
    },
    updateFacing: (camera: THREE.Camera) => {
      camera.getWorldPosition(cameraPosition);
      object.updateWorldMatrix(true, true);
      object.children.forEach((glass) => {
        glass.getWorldPosition(worldPosition);
        glass.rotation.y =
          Math.atan2(cameraPosition.x - worldPosition.x, cameraPosition.z - worldPosition.z) -
          object.rotation.y;
      });
    },
    dispose: () => {
      artworkResources.forEach((artwork) => artwork.dispose());
      artworkGeometry.dispose();
      rimGeometry.dispose();
      goldMaterial.dispose();
      geometry.dispose();
      material.dispose();
      object.clear();
    },
  };
};
