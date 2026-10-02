// @vitest-environment jsdom
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGlassSet } from './glass-set';
import { continents } from './continents';

describe('glass circle', () => {
  const sets: ReturnType<typeof createGlassSet>[] = [];
  const create = () => {
    const glasses = createGlassSet();
    sets.push(glasses);
    return glasses;
  };
  afterEach(() => sets.splice(0).forEach((glasses) => glasses.dispose()));

  it('places seven separated glasses evenly around a 4.5-unit circle on the floor', () => {
    const { object } = create();
    expect(object.children).toHaveLength(7);
    const distances = object.children.map((glass, index) => {
      expect(glass.position.y).toBe(0);
      expect(Math.hypot(glass.position.x, glass.position.z)).toBeCloseTo(4.5);
      return glass.position.distanceTo(
        object.children[(index + 1) % object.children.length].position,
      );
    });
    distances.forEach((distance) => {
      expect(distance).toBeCloseTo(distances[0]);
      expect(distance).toBeGreaterThan(2.04);
    });
  });

  it('turns in both directions without translating, tilting, or lifting the glasses', () => {
    const glasses = create();
    glasses.rotateBy(0.25);
    expect(glasses.object.rotation.y).toBeCloseTo(Math.PI / 2);
    glasses.rotateBy(-0.5);
    expect(glasses.object.rotation.y).toBeCloseTo(-Math.PI / 2);
    expect(glasses.object.rotation.x).toBe(0);
    expect(glasses.object.rotation.z).toBe(0);
    expect(glasses.object.position.toArray()).toEqual([0, 0, 0]);
    glasses.object.updateMatrixWorld(true);
    glasses.object.children.forEach((glass) => {
      const world = glass.getWorldPosition(new THREE.Vector3());
      expect(world.y).toBe(0);
      expect(Math.hypot(world.x, world.z)).toBeCloseTo(4.5);
    });
  });

  it('keeps the entire geometry inside the camera bounds throughout a full rotation', () => {
    const glasses = create();
    for (let step = 0; step < 28; step++) {
      glasses.rotateBy(1 / 28);
      glasses.object.updateMatrixWorld(true);
      const occupied = new THREE.Box3().setFromObject(glasses.object, true);
      // Mesh coordinates use Float32 precision; allow only rounding error.
      expect(glasses.bounds.clone().expandByScalar(1e-6).containsBox(occupied)).toBe(true);
    }
  });

  it('shares resources and disposes each once', () => {
    const { object, dispose } = create();
    const meshes = object.children.filter((child) => child instanceof THREE.Mesh);
    const first = meshes[0];
    expect(meshes).toHaveLength(7);
    meshes.forEach((mesh) => {
      expect(mesh.geometry).toBe(first.geometry);
      expect(mesh.material).toBe(first.material);
    });
    const geometryDispose = vi.spyOn(first.geometry, 'dispose');
    const material = first.material;
    if (Array.isArray(material)) {
      throw new Error('Glass must use a single shared material');
    }
    const materialDispose = vi.spyOn(material, 'dispose');
    dispose();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(object.children).toHaveLength(0);
    sets.pop();
  });

  it('assigns each continent once and keeps its markings facing the camera through a turn', () => {
    const glasses = create();
    expect(glasses.object.children.map((glass) => glass.name)).toEqual(
      continents.map((continent) => continent.id),
    );
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(2, 8, 16);
    for (let step = 0; step < 7; step++) {
      glasses.rotateBy(1 / 7);
      glasses.updateFacing(camera);
      glasses.object.updateMatrixWorld(true);
      glasses.object.children.forEach((glass) => {
        const position = glass.getWorldPosition(new THREE.Vector3());
        const towardCamera = camera.position.clone().sub(position).setY(0).normalize();
        expect(glass.getWorldDirection(new THREE.Vector3()).dot(towardCamera)).toBeCloseTo(1);
        expect(glass.children).toHaveLength(2);
      });
    }
  });

  it('disposes unique artwork textures and shared annotation geometry', () => {
    const glasses = create();
    const patches = glasses.object.children.flatMap((glass) => glass.children.slice(0, 1));
    const disposeSpies = patches.map((patch) => {
      if (
        !(patch instanceof THREE.Mesh) ||
        !(patch.material instanceof THREE.MeshStandardMaterial) ||
        !patch.material.alphaMap
      ) {
        throw new Error('Continent artwork must have a texture mask');
      }
      return vi.spyOn(patch.material.alphaMap, 'dispose');
    });
    glasses.dispose();
    disposeSpies.forEach((spy) => expect(spy).toHaveBeenCalledOnce());
    sets.pop();
  });
});
