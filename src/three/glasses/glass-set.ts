import * as THREE from 'three';
import { createGlassGeometry } from './glass-geometry';
import { createGlassMaterial } from './glass-material';
import { glassDimensions, glassParameters } from './glass-parameters';
import { continents } from './continents';
import { ContinentId } from '../../types/continent';
import {
  createCoupeGeometry,
  createCoupeArtworkGeometry,
  createCoupeWordGeometry,
  oceaniaCoupe,
} from './oceania-coupe';
import type { TContinentId } from '../../types/continent';
import { createArtworkGeometry, createContinentArtwork, createGoldMaterial } from './glass-artwork';

export const createGlassSet = () => {
  const object = new THREE.Group();
  const containers = new Map<TContinentId, THREE.Group>();
  const geometry = createGlassGeometry();
  const material = createGlassMaterial();
  const coupeGeometry = createCoupeGeometry();
  const coupeMaterial = createGlassMaterial(oceaniaCoupe.height);
  const coupeArtwork = createCoupeArtworkGeometry();
  const coupeWordGeometry = createCoupeWordGeometry();
  const coupeRim = new THREE.TorusGeometry(
    oceaniaCoupe.innerRadius + glassParameters.wallThickness / 2,
    0.012,
    8,
    96,
  );
  const artworkGeometry = createArtworkGeometry();
  const rimGeometry = new THREE.TorusGeometry(
    glassDimensions.outerRadius - glassParameters.wallThickness / 2,
    0.012,
    8,
    96,
  );
  const goldMaterial = createGoldMaterial();
  const coupeFootGeometry = new THREE.TorusGeometry(oceaniaCoupe.footRadius - 0.012, 0.022, 10, 96);
  const coupeCollarGeometry = new THREE.TorusGeometry(0.12, 0.026, 10, 48);
  const coupeStemGeometry = new THREE.CylinderGeometry(0.033, 0.045, oceaniaCoupe.floor - 0.26, 24);
  const artworkResources: ReturnType<typeof createContinentArtwork>[] = [];
  const worldPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();

  for (let index = 0; index < glassParameters.count; index++) {
    const angle = Math.PI - (index * Math.PI * 2) / glassParameters.count;
    const continent = continents[index];
    const isCoupe = continent.id === ContinentId.Oceania;
    const glass = new THREE.Mesh(
      isCoupe ? coupeGeometry : geometry,
      isCoupe ? coupeMaterial : material,
    );
    glass.name = continent.id;
    const artwork = createContinentArtwork(continent, isCoupe ? coupeArtwork : artworkGeometry);
    if (isCoupe) {
      artwork.object.position.y = 0;
    }
    artworkResources.push(artwork);
    const rim = new THREE.Mesh(isCoupe ? coupeRim : rimGeometry, goldMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = glassDimensions.outerHeight - glassParameters.wallThickness / 2;
    if (isCoupe) {
      rim.position.y = oceaniaCoupe.height + glassParameters.wallThickness / 2;
    }
    const contents = new THREE.Group();
    containers.set(continent.id, contents);
    glass.add(artwork.object, rim, contents);
    if (isCoupe) {
      artwork.object.renderOrder = 2;
      const wordmark = createContinentArtwork(continent, coupeWordGeometry);
      wordmark.object.position.y =
        oceaniaCoupe.floor + (oceaniaCoupe.height - oceaniaCoupe.floor) * 0.2;
      wordmark.object.renderOrder = 3;
      artworkResources.push(wordmark);
      const accents = new THREE.Group();
      const foot = new THREE.Mesh(coupeFootGeometry, goldMaterial);
      foot.rotation.x = Math.PI / 2;
      foot.position.y = 0.05;
      const collar = new THREE.Mesh(coupeCollarGeometry, goldMaterial);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = oceaniaCoupe.floor - 0.1;
      const stem = new THREE.Mesh(coupeStemGeometry, goldMaterial);
      stem.position.y = (oceaniaCoupe.floor - 0.26) / 2 + 0.13;
      accents.add(foot, collar, stem);
      glass.add(accents, wordmark.object);
    }
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
    Math.max(glassDimensions.outerRadius, oceaniaCoupe.outerRadius) +
    Math.max(glassParameters.artwork.surfaceOffset, oceaniaCoupe.artworkOffset);
  return {
    object,
    containers,
    bounds: new THREE.Box3(
      new THREE.Vector3(-extent, 0, -extent),
      new THREE.Vector3(
        extent,
        Math.max(glassDimensions.outerHeight, oceaniaCoupe.height + glassParameters.wallThickness),
        extent,
      ),
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
      coupeWordGeometry.dispose();
      coupeFootGeometry.dispose();
      coupeCollarGeometry.dispose();
      coupeStemGeometry.dispose();
      coupeGeometry.dispose();
      coupeMaterial.dispose();
      coupeArtwork.dispose();
      coupeRim.dispose();
      geometry.dispose();
      material.dispose();
      object.clear();
    },
  };
};
