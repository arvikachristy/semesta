import * as THREE from 'three';
import type { createSoftBody } from './jelly-soft-body';
import { jellyParameters } from './jelly-parameters';
import { createCollisionBroadphase } from './collision-broadphase';

export const pileParameters = {
  dropInterval: 0.25,
  dropAngle: 2.3999632297,
  dropRadiusStep: 0.6180339887,
  contactMargin: 0.0001,
  maxContactCorrection: 0.05,
  wallClearance: 0.015,
  wakePenetration: 0.008,
  neighbourMargin: 0.01,
};
interface ICollisionBody {
  body: ReturnType<typeof createSoftBody>;
  origin: THREE.Vector3;
  bounds: THREE.Box3;
  boundsRevision: number;
}
const ContactAxis = { X: 'x', Y: 'y', Z: 'z' } as const;
type TContactAxis = (typeof ContactAxis)[keyof typeof ContactAxis];
const horizontalAxes = [ContactAxis.X, ContactAxis.Z];

// Bodies retain their tetrahedral deformation. Between bodies, conservative bounds
// contacts make dense stacks stable without testing every particle against every tet.
export const createJellyPile = () => {
  const bodies = new Map<ReturnType<typeof createSoftBody>, ICollisionBody>();
  const entries: ICollisionBody[] = [];
  const visitOverlaps = createCollisionBroadphase<ICollisionBody>();
  const world = new THREE.Vector3();
  const correction = new THREE.Vector3();
  const contactBounds = new THREE.Box3();
  let accumulator = 0;

  const refreshBounds = () => {
    for (const entry of entries) {
      if (entry.body.isSleeping() && entry.boundsRevision === entry.body.getRevision()) {
        continue;
      }
      entry.boundsRevision = entry.body.getRevision();
      entry.bounds.makeEmpty();
      for (const position of entry.body.positions) {
        entry.bounds.expandByPoint(world.copy(position).add(entry.origin));
      }
    }
  };
  const wakeConnected = (seed: ICollisionBody) => {
    const visited = new Set<ICollisionBody>([seed]);
    const queue = [seed];
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      current.body.wake();
      contactBounds.copy(current.bounds).expandByScalar(pileParameters.neighbourMargin);
      for (const entry of entries) {
        if (!visited.has(entry) && contactBounds.intersectsBox(entry.bounds)) {
          visited.add(entry);
          queue.push(entry);
        }
      }
    }
  };
  const translate = (entry: ICollisionBody, amount: number, axis: TContactAxis) => {
    correction.set(0, 0, 0);
    correction[axis] = amount;
    for (const position of entry.body.positions) {
      position.add(correction);
    }
    entry.bounds.translate(correction);
  };
  const collide = (first: ICollisionBody, second: ICollisionBody) => {
    const a = first.bounds;
    const b = second.bounds;
    let axis: TContactAxis = ContactAxis.Y;
    let penetration = Math.min(a.max.y - b.min.y, b.max.y - a.min.y);
    for (const candidate of horizontalAxes) {
      const overlap = Math.min(
        a.max[candidate] - b.min[candidate],
        b.max[candidate] - a.min[candidate],
      );
      if (overlap < penetration) {
        penetration = overlap;
        axis = candidate;
      }
    }
    if (penetration <= 0) {
      return;
    }
    const sign = a.min[axis] + a.max[axis] < b.min[axis] + b.max[axis] ? -1 : 1;
    const depth = Math.min(
      penetration + pileParameters.contactMargin,
      pileParameters.maxContactCorrection,
    );
    if (axis === ContactAxis.Y) {
      // The lower volume supports the upper one. Avoid forcing an entire sleeping
      // pile into the floor when another jelly lands on top.
      const upper = sign < 0 ? second : first;
      const lower = sign < 0 ? first : second;
      if (penetration > pileParameters.wakePenetration && lower.body.isSleeping()) {
        lower.body.wake();
      }
      if (upper.body.isSleeping()) {
        if (penetration <= pileParameters.wakePenetration) {
          return;
        }
        upper.body.wake();
      }
      translate(upper, depth, axis);
      return;
    }
    if (penetration > pileParameters.wakePenetration) {
      if (first.body.isSleeping()) {
        first.body.wake();
      }
      if (second.body.isSleeping()) {
        second.body.wake();
      }
    }
    const firstWeight = Number(!first.body.isSleeping());
    const secondWeight = Number(!second.body.isSleeping());
    const total = firstWeight + secondWeight;
    if (total === 0) {
      return;
    }
    translate(first, (sign * depth * firstWeight) / total, axis);
    translate(second, (-sign * depth * secondWeight) / total, axis);
  };

  const update = (delta: number) => {
    if (entries.every(({ body }) => body.isSleeping())) {
      accumulator = 0;
      return;
    }
    const p = jellyParameters.physics;
    accumulator = Math.min(accumulator + delta, p.timestep * p.maxSubsteps);
    while (accumulator >= p.timestep) {
      for (const { body } of entries) {
        body.predict();
      }
      for (let iteration = 0; iteration < p.iterations; iteration++) {
        for (const { body } of entries) {
          body.solveConstraints();
        }
        refreshBounds();
        visitOverlaps(entries, collide);
        for (const { body } of entries) {
          body.constrainEnvironment();
        }
      }
      for (const { body } of entries) {
        body.finishStep();
      }
      accumulator -= p.timestep;
    }
  };
  return {
    getAwakeCount: () =>
      entries.reduce((count, entry) => count + Number(!entry.body.isSleeping()), 0),
    add: (body: ReturnType<typeof createSoftBody>) => {
      if (bodies.has(body)) {
        return;
      }
      const entry: ICollisionBody = {
        body,
        origin: body.container?.origin ?? new THREE.Vector3(),
        bounds: new THREE.Box3(),
        boundsRevision: -1,
      };
      bodies.set(body, entry);
      entries.push(entry);
    },
    update,
    remove: (body: ReturnType<typeof createSoftBody>) => {
      const entry = bodies.get(body);
      if (entry) {
        refreshBounds();
        wakeConnected(entry);
        entries.splice(entries.indexOf(entry), 1);
        bodies.delete(body);
      }
    },
    dispose: () => {
      bodies.clear();
      entries.length = 0;
    },
  };
};
