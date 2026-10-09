// @vitest-environment jsdom
import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJellyBatches } from './jelly-batches';
import { JellyAttribute, createJellyGeometry } from './jelly-geometry';

vi.mock('./flag-atlas', () => ({
  createFlagAtlas: () => ({
    texture: new THREE.Texture(),
    resize: vi.fn(),
    draw: vi.fn(() => ({ x: 0, y: 0, width: 1, height: 1 })),
    dispose: vi.fn(),
  }),
}));

const createSource = (parent: THREE.Group, x: number) => {
  const geometry = createJellyGeometry(1);
  geometry.setAttribute(
    JellyAttribute.Thickness,
    new THREE.BufferAttribute(
      new Float32Array(geometry.getAttribute(JellyAttribute.Position).count).fill(0.2),
      1,
    ),
  );
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      map: new THREE.CanvasTexture(document.createElement('canvas')),
    }),
  );
  const object = new THREE.Group();
  object.position.x = x;
  object.add(mesh);
  parent.add(object);
  let revision = 0;
  return {
    object,
    mesh,
    getBody: () => ({ getRevision: () => revision }),
    change: () => revision++,
  };
};
const findBatch = (parent: THREE.Group) => {
  const mesh = parent.children.find((child) => child instanceof THREE.Mesh);
  if (!mesh) {
    throw new Error('Missing render batch');
  }
  return mesh;
};
afterEach(() => vi.restoreAllMocks());

describe('jelly render batches', () => {
  it('copies changed local surfaces into glass coordinates without losing individual raycasts', () => {
    const parent = new THREE.Group();
    const source = createSource(parent, 2);
    const batches = createJellyBatches();
    batches.update([source]);
    const batch = findBatch(parent);
    const original = source.mesh.geometry.getAttribute(JellyAttribute.Position);
    const copied = batch.geometry.getAttribute(JellyAttribute.Position);
    expect(copied.getX(0)).toBeCloseTo(original.getX(0) + 2);
    expect(source.mesh.visible).toBe(false);
    const oldX = copied.getX(0);
    original.setX(0, original.getX(0) + 0.1);
    batches.update([source]);
    expect(copied.getX(0)).toBe(oldX);
    source.change();
    batches.update([source]);
    expect(copied.getX(0)).toBeCloseTo(oldX + 0.1);
    parent.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(2, 0, 5), new THREE.Vector3(0, 0, -1));
    expect(ray.intersectObject(source.object, true).length).toBeGreaterThan(0);
    expect(ray.intersectObject(batch).length).toBe(0);
    batches.dispose();
  });

  it('compacts removed countries and disposes empty glass batches', () => {
    const parent = new THREE.Group();
    const first = createSource(parent, 0);
    const second = createSource(parent, 2);
    const batches = createJellyBatches();
    batches.update([first, second]);
    const batch = findBatch(parent);
    const disposeGeometry = vi.spyOn(batch.geometry, 'dispose');
    const count = first.mesh.geometry.getIndex()?.count;
    expect(batch.geometry.drawRange.count).toBe((count ?? 0) * 2);
    batches.update([second]);
    expect(batch.geometry.drawRange.count).toBe(count);
    expect(batch.geometry.getAttribute(JellyAttribute.Position).getX(0)).toBeCloseTo(
      second.mesh.geometry.getAttribute(JellyAttribute.Position).getX(0) + 2,
    );
    batches.update([]);
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(batch.parent).toBeNull();
    batches.dispose();
  });
});
