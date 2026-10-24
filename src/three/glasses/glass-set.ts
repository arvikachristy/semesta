import * as THREE from 'three';
import { readScenePalette } from '../scene-palette';
import type { IScenePalette } from '../scene-palette';
import { updateGlassMaterial } from './glass-material';
import { glassParameters } from './glass-parameters';
import { continents } from './continents';
import type { TContinentId } from '../../types/continent';
import { createContinentArtwork, createGoldMaterial } from './glass-artwork';
import { getGlassDefinition } from './glass-definitions';
import type { IGlassDefinition } from './glass-definitions';
import { createGlassResources } from './glass-resources';

export const createGlassSet = (palette: IScenePalette = readScenePalette()) => {
  const object = new THREE.Group();
  const containers = new Map<TContinentId, THREE.Group>();
  const resources = new Map<IGlassDefinition, ReturnType<typeof createGlassResources>>();
  const goldMaterial = createGoldMaterial(palette);
  const artworkResources: ReturnType<typeof createContinentArtwork>[] = [];
  const worldPosition = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();

  continents.forEach((continent, index) => {
    const definition = getGlassDefinition(continent.id);
    let shared = resources.get(definition);
    if (!shared) {
      shared = createGlassResources(definition, palette);
      resources.set(definition, shared);
    }
    const glass = new THREE.Mesh(shared.geometry, shared.material);
    glass.name = continent.id;
    const markings = shared.markings.map(({ geometry, y }, index) => {
      const artwork = createContinentArtwork(continent, geometry, palette);
      artwork.object.position.y = y;
      artwork.object.renderOrder = 2 + index;
      artworkResources.push(artwork);
      return artwork.object;
    });
    const rim = new THREE.Mesh(shared.rim, goldMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = definition.rimHeight;
    const contents = new THREE.Group();
    containers.set(continent.id, contents);
    glass.add(markings[0], rim, contents);
    if (shared.accents.length) {
      const accents = new THREE.Group();
      shared.accents.forEach(({ geometry, y, rotationX = 0 }) => {
        const accent = new THREE.Mesh(geometry, goldMaterial);
        accent.position.y = y;
        accent.rotation.x = rotationX;
        accents.add(accent);
      });
      glass.add(accents);
    }
    markings.slice(1).forEach((marking) => glass.add(marking));
    const angle = Math.PI - (index * Math.PI * 2) / continents.length;
    glass.position.set(
      glassParameters.circleRadius * Math.sin(angle),
      0,
      glassParameters.circleRadius * Math.cos(angle),
    );
    object.add(glass);
  });

  // Include complete geometry, rims and markings in the carousel's rotation envelope.
  const definitions = [...resources.keys()];
  const extent =
    glassParameters.circleRadius +
    Math.max(...definitions.map(({ outerRadius, artworkOffset }) => outerRadius + artworkOffset));
  const height = Math.max(
    ...definitions.map((definition) => Math.max(definition.height, definition.rimHeight + 0.012)),
  );
  return {
    object,
    containers,
    bounds: new THREE.Box3(
      new THREE.Vector3(-extent, 0, -extent),
      new THREE.Vector3(extent, height, extent),
    ),
    continentForObject: (hit: THREE.Object3D) => {
      let candidate: THREE.Object3D | null = hit;
      while (candidate && candidate.parent !== object) {
        candidate = candidate.parent;
      }
      return continents.find((continent) => continent.id === candidate?.name)?.id ?? null;
    },
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
    setTheme: (next: IScenePalette) => {
      goldMaterial.color.set(next.glassMetal);
      resources.forEach((resource) => updateGlassMaterial(resource.material, next));
      artworkResources.forEach((artwork) => artwork.setTheme(next));
    },
    dispose: () => {
      artworkResources.forEach((artwork) => artwork.dispose());
      resources.forEach((resource) => resource.dispose());
      goldMaterial.dispose();
      object.clear();
    },
  };
};
