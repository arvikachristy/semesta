import * as THREE from 'three';
import type { createSoftBody } from './jelly-soft-body';
import { jellyParameters } from './jelly-parameters';

export const pileParameters = {
  dropInterval: 0.25,
  collisionCellSize: 0.15,
  contactMargin: 0.002,
  maxContactCorrection: 0.05,
  wallClearance: 0.015,
};
interface ICollisionBody {
  body: ReturnType<typeof createSoftBody>;
  origin: THREE.Vector3;
  faces: Array<readonly [number, number, number]>;
  hash: Map<string, number[]>;
  bounds: THREE.Box3;
}

// All particles share a glass-local frame. Surface contacts transfer corrections to both volumes.
export const createJellyPile = () => {
  const bodies = new Map<ReturnType<typeof createSoftBody>, ICollisionBody>();
  const entries: ICollisionBody[] = [];
  const indexed = new Set<ICollisionBody>();
  const triangle = new THREE.Triangle();
  const normal = new THREE.Vector3();
  const query = new THREE.Vector3();
  const closest = new THREE.Vector3();
  const nearest = new THREE.Vector3();
  const weights = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const ad = new THREE.Vector3();
  const ap = new THREE.Vector3();
  const cross = new THREE.Vector3();
  const world = new THREE.Vector3();
  let accumulator = 0;
  const key = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  const cell = (value: number) => Math.floor(value / pileParameters.collisionCellSize);

  const add = (body: ReturnType<typeof createSoftBody>) => {
    if (bodies.has(body)) {
      return;
    }
    const faces = new Map<string, readonly [number, number, number]>();
    for (const { ids } of body.tets) {
      for (let opposite = 0; opposite < 4; opposite++) {
        const remaining = ids.filter((_, index) => index !== opposite);
        const a = remaining[0];
        let b = remaining[1];
        let c = remaining[2];
        const faceKey = [...remaining].sort((x, y) => x - y).join(':');
        if (faces.has(faceKey)) {
          faces.delete(faceKey);
          continue;
        }
        triangle.set(body.rest[a], body.rest[b], body.rest[c]).getNormal(normal);
        if (normal.dot(query.subVectors(body.rest[ids[opposite]], body.rest[a])) > 0) {
          [b, c] = [c, b];
        }
        faces.set(faceKey, [a, b, c]);
      }
    }
    const entry: ICollisionBody = {
      body,
      origin: body.container?.origin ?? new THREE.Vector3(),
      faces: [...faces.values()],
      hash: new Map(),
      bounds: new THREE.Box3(),
    };
    bodies.set(body, entry);
    entries.push(entry);
  };

  const indexBody = (entry: ICollisionBody) => {
    const { positions, tets } = entry.body;
    entry.hash.forEach((bucket) => {
      bucket.length = 0;
    });
    tets.forEach((tet, index) => {
      const [a, b, c, d] = tet.ids;
      const pa = positions[a];
      const pb = positions[b];
      const pc = positions[c];
      const pd = positions[d];
      const minX = cell(Math.min(pa.x, pb.x, pc.x, pd.x));
      const maxX = cell(Math.max(pa.x, pb.x, pc.x, pd.x));
      const minY = cell(Math.min(pa.y, pb.y, pc.y, pd.y));
      const maxY = cell(Math.max(pa.y, pb.y, pc.y, pd.y));
      const minZ = cell(Math.min(pa.z, pb.z, pc.z, pd.z));
      const maxZ = cell(Math.max(pa.z, pb.z, pc.z, pd.z));
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          for (let z = minZ; z <= maxZ; z++) {
            const bucketKey = key(x, y, z);
            const bucket = entry.hash.get(bucketKey);
            if (bucket) {
              bucket.push(index);
            } else {
              entry.hash.set(bucketKey, [index]);
            }
          }
        }
      }
    });
  };
  const contains = (entry: ICollisionBody, point: THREE.Vector3) => {
    const candidates = entry.hash.get(key(cell(point.x), cell(point.y), cell(point.z)));
    if (!candidates) {
      return false;
    }
    for (const index of candidates) {
      const ids = entry.body.tets[index].ids;
      const a = entry.body.positions[ids[0]];
      const b = entry.body.positions[ids[1]];
      const c = entry.body.positions[ids[2]];
      const d = entry.body.positions[ids[3]];
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      ad.subVectors(d, a);
      ap.subVectors(point, a);
      const determinant = ab.dot(cross.crossVectors(ac, ad));
      if (Math.abs(determinant) < 1e-12) {
        continue;
      }
      const wb = ap.dot(cross.crossVectors(ac, ad)) / determinant;
      const wc = ab.dot(cross.crossVectors(ap, ad)) / determinant;
      const wd = ab.dot(cross.crossVectors(ac, ap)) / determinant;
      const wa = 1 - wb - wc - wd;
      if (Math.min(wa, wb, wc, wd) > 1e-7) {
        return true;
      }
    }
    return false;
  };
  const collide = (source: ICollisionBody, target: ICollisionBody) => {
    if (!source.bounds.intersectsBox(target.bounds)) {
      return;
    }
    for (const position of source.body.positions) {
      query.copy(position).add(source.origin).sub(target.origin);
      if (!contains(target, query)) {
        continue;
      }
      source.body.wake();
      target.body.wake();
      let distance = Infinity;
      let face: readonly [number, number, number] | null = null;
      for (const candidate of target.faces) {
        const [a, b, c] = candidate;
        triangle.set(target.body.positions[a], target.body.positions[b], target.body.positions[c]);
        triangle.closestPointToPoint(query, closest);
        const squared = closest.distanceToSquared(query);
        if (squared < distance) {
          distance = squared;
          face = candidate;
          nearest.copy(closest);
        }
      }
      if (!face) {
        continue;
      }
      const a = target.body.positions[face[0]];
      const b = target.body.positions[face[1]];
      const c = target.body.positions[face[2]];
      triangle.set(a, b, c).getNormal(normal);
      triangle.getBarycoord(nearest, weights);
      const depth = Math.min(
        Math.sqrt(distance) + pileParameters.contactMargin,
        pileParameters.maxContactCorrection,
      );
      const correction = depth / (1 + weights.lengthSq());
      position.addScaledVector(normal, correction);
      a.addScaledVector(normal, -correction * weights.x);
      b.addScaledVector(normal, -correction * weights.y);
      c.addScaledVector(normal, -correction * weights.z);
    }
  };

  const update = (delta: number) => {
    if (entries.every(({ body }) => body.isSleeping())) {
      accumulator = 0;
      return;
    }
    const p = jellyParameters.physics;
    accumulator = Math.min(accumulator + delta, p.timestep * p.maxSubsteps);
    while (accumulator >= p.timestep) {
      bodies.forEach(({ body }) => body.predict());
      for (let iteration = 0; iteration < p.iterations; iteration++) {
        bodies.forEach(({ body }) => body.solveConstraints());
        if (bodies.size > 1 && (iteration === 0 || iteration === p.iterations - 1)) {
          bodies.forEach((entry) => {
            entry.bounds.makeEmpty();
            entry.body.positions.forEach((position) =>
              entry.bounds.expandByPoint(world.copy(position).add(entry.origin)),
            );
          });
          indexed.clear();
          for (let a = 0; a < entries.length; a++) {
            for (let b = a + 1; b < entries.length; b++) {
              if (
                (entries[a].body.isSleeping() && entries[b].body.isSleeping()) ||
                !entries[a].bounds.intersectsBox(entries[b].bounds)
              ) {
                continue;
              }
              const first = entries[a];
              const second = entries[b];
              if (!indexed.has(first)) {
                indexBody(first);
                indexed.add(first);
              }
              if (!indexed.has(second)) {
                indexBody(second);
                indexed.add(second);
              }
              collide(entries[a], entries[b]);
              collide(entries[b], entries[a]);
            }
          }
        }
        bodies.forEach(({ body }) => body.constrainEnvironment());
      }
      bodies.forEach(({ body }) => body.finishStep());
      accumulator -= p.timestep;
    }
  };
  return {
    add,
    remove: (body: ReturnType<typeof createSoftBody>) => {
      const entry = bodies.get(body);
      if (entry) {
        entries.splice(entries.indexOf(entry), 1);
        bodies.delete(body);
      }
    },
    update,
    dispose: () => {
      bodies.clear();
      entries.length = 0;
      indexed.clear();
    },
  };
};
