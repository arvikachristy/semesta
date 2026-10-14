import * as THREE from 'three';
import { glassParameters } from '../glasses/glass-parameters';
import { JellyAttribute } from './jelly-geometry';
import { createJellyMaterial } from './jelly-material';
import { createFlagAtlas } from './flag-atlas';

interface IJellySource {
  object: THREE.Object3D;
  getBody: () => { getRevision: () => number } | null;
}
interface IJellyBatch {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  positions: THREE.BufferAttribute;
  normals: THREE.BufferAttribute;
  thickness: THREE.BufferAttribute;
  uv: THREE.BufferAttribute;
  atlas: ReturnType<typeof createFlagAtlas>;
  sources: IJellySource[];
  indexCount: number;
}
interface IJellySlot {
  batch: IJellyBatch;
  offset: number;
  revision: number;
}

// Physics and picking still use each body's independent mesh. Rendering copies
// changed surfaces into one mesh/flag atlas per glass: at most six jelly draw calls
// in both the colour and shadow passes, rather than one draw per country.
export const createJellyBatches = () => {
  const batches = new Map<THREE.Object3D, IJellyBatch>();
  const slots = new Map<IJellySource, IJellySlot>();
  const point = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const surfaceOf = (source: IJellySource) =>
    source.object.children.find((child) => child instanceof THREE.Mesh);
  const createBatch = (surface: THREE.Mesh, parent: THREE.Object3D): IJellyBatch => {
    const sourcePositions = surface.geometry.getAttribute(JellyAttribute.Position);
    const sourceIndex = surface.geometry.getIndex();
    const indexCount = sourceIndex?.count ?? sourcePositions.count;
    const count = sourcePositions.count * glassParameters.capacity;
    const attribute = (size: number) =>
      new THREE.BufferAttribute(new Float32Array(count * size), size).setUsage(
        THREE.DynamicDrawUsage,
      );
    const positions = attribute(3),
      normals = attribute(3),
      thickness = attribute(1),
      uv = attribute(2);
    const indices = new Uint32Array(indexCount * glassParameters.capacity);
    for (let slot = 0; slot < glassParameters.capacity; slot++) {
      for (let index = 0; index < indexCount; index++) {
        indices[slot * indexCount + index] =
          (sourceIndex?.getX(index) ?? index) + slot * sourcePositions.count;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(JellyAttribute.Position, positions);
    geometry.setAttribute(JellyAttribute.Normal, normals);
    geometry.setAttribute(JellyAttribute.Thickness, thickness);
    geometry.setAttribute(JellyAttribute.Uv, uv);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const atlas = createFlagAtlas();
    const mesh = new THREE.Mesh(
      geometry,
      createJellyMaterial(atlas.texture, glassParameters.jellyScale),
    );
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    // Pointer events raycast the individual, deformed source meshes instead.
    mesh.raycast = () => {};
    parent.add(mesh);
    return { mesh, positions, normals, thickness, uv, atlas, indexCount, sources: [] };
  };
  const removeBatch = (batch: IJellyBatch) => {
    batch.mesh.removeFromParent();
    batch.mesh.geometry.dispose();
    batch.mesh.material.dispose();
    batch.atlas.dispose();
  };
  return {
    update: (sources: readonly IJellySource[]) => {
      const membershipChanged =
        slots.size !== sources.length || sources.some((source) => !slots.has(source));
      if (membershipChanged) {
        const previousSlots = new Map(slots);
        const previousSources = new Map(
          [...batches].map(([parent, batch]) => [parent, [...batch.sources]]),
        );
        slots.clear();
        batches.forEach((batch) => {
          batch.sources.length = 0;
        });
        for (const source of sources) {
          const surface = surfaceOf(source);
          const parent = source.object.parent;
          if (!surface || !parent) {
            continue;
          }
          let batch = batches.get(parent);
          if (!batch) {
            batch = createBatch(surface, parent);
            batches.set(parent, batch);
          }
          const offset =
            batch.sources.length * surface.geometry.getAttribute(JellyAttribute.Position).count;
          const previous = previousSlots.get(source);
          slots.set(source, {
            batch,
            offset,
            revision:
              previous?.batch === batch && previous.offset === offset ? previous.revision : -1,
          });
          batch.sources.push(source);
          surface.visible = false;
        }
        batches.forEach((batch, parent) => {
          if (batch.sources.length === 0) {
            removeBatch(batch);
            batches.delete(parent);
            return;
          }
          batch.mesh.geometry.setDrawRange(0, batch.sources.length * batch.indexCount);
          const resized = batch.atlas.resize(batch.sources.length);
          const prior = previousSources.get(parent) ?? [];
          const unchangedPrefix = batch.sources.every(
            (source, index) => index >= prior.length || source === prior[index],
          );
          const firstChanged =
            !resized && unchangedPrefix ? Math.min(prior.length, batch.sources.length) : 0;
          batch.sources.slice(firstChanged).forEach((source, index) => {
            const slotIndex = firstChanged + index;
            const surface = surfaceOf(source);
            if (
              !surface ||
              !(surface.material instanceof THREE.MeshPhysicalMaterial) ||
              !(surface.material.map?.image instanceof HTMLCanvasElement)
            ) {
              throw new Error('Jelly batching requires canvas flag artwork');
            }
            const tile = batch.atlas.draw(surface.material.map.image, slotIndex);
            const uv = surface.geometry.getAttribute(JellyAttribute.Uv);
            for (let index = 0; index < uv.count; index++) {
              batch.uv.setXY(
                slotIndex * uv.count + index,
                tile.x + uv.getX(index) * tile.width,
                tile.y + uv.getY(index) * tile.height,
              );
            }
          });
          if (firstChanged < batch.sources.length) {
            batch.uv.needsUpdate = true;
          }
        });
      }
      for (const source of sources) {
        const slot = slots.get(source);
        const revision = source.getBody()?.getRevision() ?? 0;
        if (!slot || slot.revision === revision) {
          continue;
        }
        const surface = surfaceOf(source);
        if (!surface) {
          continue;
        }
        source.object.updateMatrix();
        normalMatrix.getNormalMatrix(source.object.matrix);
        const positions = surface.geometry.getAttribute(JellyAttribute.Position);
        const normals = surface.geometry.getAttribute(JellyAttribute.Normal);
        const thickness = surface.geometry.getAttribute(JellyAttribute.Thickness);
        for (let index = 0; index < positions.count; index++) {
          point.fromBufferAttribute(positions, index).applyMatrix4(source.object.matrix);
          slot.batch.positions.setXYZ(slot.offset + index, point.x, point.y, point.z);
          point.fromBufferAttribute(normals, index).applyMatrix3(normalMatrix).normalize();
          slot.batch.normals.setXYZ(slot.offset + index, point.x, point.y, point.z);
          slot.batch.thickness.setX(slot.offset + index, thickness.getX(index));
        }
        for (const attribute of [slot.batch.positions, slot.batch.normals, slot.batch.thickness]) {
          attribute.addUpdateRange(
            slot.offset * attribute.itemSize,
            positions.count * attribute.itemSize,
          );
          attribute.needsUpdate = true;
        }
        slot.revision = revision;
      }
    },
    dispose: () => {
      batches.forEach(removeBatch);
      batches.clear();
      slots.clear();
    },
  };
};
