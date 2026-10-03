import * as THREE from 'three';
import { jellyParameters } from './jelly-parameters';

export interface IJellyContainer {
  origin: THREE.Vector3;
  radius: number;
  floor: number;
  ceiling: number;
}

interface IEdge {
  a: number;
  b: number;
  length: number;
}
interface ITet {
  ids: number[];
  volume: number;
}

// A low-resolution tetrahedral volume. The rendering mesh is bound separately.
export const createSoftBody = (
  width: number,
  height: number,
  depth: number,
  bounds: THREE.Plane[] = [],
  container?: IJellyContainer,
) => {
  const p = jellyParameters.physics;
  const scale = width / jellyParameters.surface.width;
  const floorLevel = () => (container ? container.floor - container.origin.y : -height / 2);
  const [nx, ny, nz] = p.cells;
  const rest: THREE.Vector3[] = [];
  const positions: THREE.Vector3[] = [];
  const previous: THREE.Vector3[] = [];
  const velocities: THREE.Vector3[] = [];
  const weights: number[] = [];
  const tets: ITet[] = [];
  const edges: IEdge[] = [];
  const edgeKeys = new Set<string>();
  const id = (x: number, y: number, z: number) => (y * (nz + 1) + z) * (nx + 1) + x;
  for (let y = 0; y <= ny; y++) {
    for (let z = 0; z <= nz; z++) {
      for (let x = 0; x <= nx; x++) {
        const point = new THREE.Vector3(
          (x / nx - 0.5) * width,
          (y / ny - 0.5) * height,
          (z / nz - 0.5) * depth,
        );
        rest.push(point);
        positions.push(point.clone());
        previous.push(point.clone());
        velocities.push(new THREE.Vector3());
        // Every particle is movable; the floor is a collision constraint, not an anchor.
        weights.push(1);
      }
    }
  }
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const ad = new THREE.Vector3();
  const gradients = Array.from({ length: 4 }, () => new THREE.Vector3());
  const volume = (ids: number[]) => {
    const [a, b, c, d] = ids.map((i) => positions[i]);
    return ab.subVectors(b, a).cross(ac.subVectors(c, a)).dot(ad.subVectors(d, a)) / 6;
  };
  for (let y = 0; y < ny; y++) {
    for (let z = 0; z < nz; z++) {
      for (let x = 0; x < nx; x++) {
        const v = [
          id(x, y, z),
          id(x + 1, y, z),
          id(x, y + 1, z),
          id(x + 1, y + 1, z),
          id(x, y, z + 1),
          id(x + 1, y, z + 1),
          id(x, y + 1, z + 1),
          id(x + 1, y + 1, z + 1),
        ];
        for (const corners of [
          [0, 1, 3, 7],
          [0, 3, 2, 7],
          [0, 2, 6, 7],
          [0, 6, 4, 7],
          [0, 4, 5, 7],
          [0, 5, 1, 7],
        ]) {
          const ids = corners.map((i) => v[i]);
          if (volume(ids) < 0) {
            [ids[1], ids[2]] = [ids[2], ids[1]];
          }
          tets.push({ ids, volume: volume(ids) });
          for (let a = 0; a < 4; a++) {
            for (let b = a + 1; b < 4; b++) {
              const i = Math.min(ids[a], ids[b]);
              const j = Math.max(ids[a], ids[b]);
              const key = `${i}:${j}`;
              if (!edgeKeys.has(key)) {
                edgeKeys.add(key);
                edges.push({ a: i, b: j, length: rest[i].distanceTo(rest[j]) });
              }
            }
          }
        }
      }
    }
  }
  const grabWeights = new Float32Array(rest.length);
  const grabOffsets = rest.map(() => new THREE.Vector3());
  const target = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  const center = new THREE.Vector3();
  const meanVelocity = new THREE.Vector3();
  const incomingVelocity = rest.map(() => new THREE.Vector3());
  let grabbed = false;
  let sleeping = false;
  let quietTime = 0;
  let revision = 0;
  const wake = () => {
    sleeping = false;
    quietTime = 0;
  };
  let accumulator = 0;
  const beginGrab = (point: THREE.Vector3) => {
    wake();
    grabbed = true;
    target.copy(point);
    let nearest = 0;
    let nearestDistance = Infinity;
    positions.forEach((position, i) => {
      const distance = position.distanceTo(point);
      grabWeights[i] = weights[i] * Math.max(0, 1 - distance / (p.grabRadius * scale)) ** 2;
      grabOffsets[i].subVectors(position, point);
      if (weights[i] && distance < nearestDistance) {
        nearest = i;
        nearestDistance = distance;
      }
    });
    grabWeights[nearest] = 1;
  };
  const moveGrab = (point: THREE.Vector3) => {
    target.copy(point);
  };
  const endGrab = (jump = false) => {
    if (grabbed && jump) {
      for (const velocity of velocities) {
        velocity.y = Math.max(velocity.y, p.jumpSpeed * scale);
      }
    }
    grabbed = false;
  };
  const normal = new THREE.Vector3();
  const constrainParticle = (position: THREE.Vector3) => {
    position.y = Math.max(floorLevel(), position.y);
    if (container) {
      position.y = Math.min(container.ceiling - container.origin.y, position.y);
      const x = position.x + container.origin.x;
      const z = position.z + container.origin.z;
      const radius = Math.hypot(x, z);
      if (radius > container.radius) {
        position.x = (x * container.radius) / radius - container.origin.x;
        position.z = (z * container.radius) / radius - container.origin.z;
      }
    }
  };
  const constrainEnvironment = () => positions.forEach(constrainParticle);
  const predict = () => {
    if (sleeping) {
      return;
    }
    const dt = p.timestep;
    const decay = Math.exp(-p.damping * dt);
    center.set(0, 0, 0);
    meanVelocity.set(0, 0, 0);
    for (let i = 0; i < positions.length; i++) {
      center.add(positions[i]);
      meanVelocity.add(velocities[i]);
    }
    center.divideScalar(positions.length);
    meanVelocity.divideScalar(positions.length);
    // Recover shape around the moving centre, never around a fixed floor position.

    for (let i = 0; i < positions.length; i++) {
      previous[i].copy(positions[i]);
      if (!weights[i]) {
        continue;
      }
      velocities[i]
        .sub(meanVelocity)
        .multiplyScalar(decay)
        .addScaledVector(meanVelocity, Math.exp(-p.airDrag * dt));
      scratch.copy(rest[i]).add(center).sub(positions[i]);
      velocities[i].addScaledVector(scratch, p.recovery * dt);
      velocities[i].y += p.gravity * dt;
      incomingVelocity[i].copy(velocities[i]);
      positions[i].addScaledVector(velocities[i], dt);
    }
  };
  const solveConstraints = () => {
    if (sleeping) {
      return;
    }
    for (const edge of edges) {
      const { a, b, length } = edge;
      const w = weights[a] + weights[b];
      if (!w) {
        continue;
      }
      scratch.subVectors(positions[b], positions[a]);
      const distance = scratch.length();
      if (distance < 1e-8) {
        continue;
      }
      scratch.multiplyScalar((((distance - length) / distance) * p.stiffness) / w);
      positions[a].addScaledVector(scratch, weights[a]);
      positions[b].addScaledVector(scratch, -weights[b]);
    }
    for (const tet of tets) {
      const [ia, ib, ic, iz] = tet.ids;
      const a = positions[ia];
      const b = positions[ib];
      const c = positions[ic];
      const d = positions[iz];
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      ad.subVectors(d, a);
      gradients[1].crossVectors(ac, ad).multiplyScalar(1 / 6);
      gradients[2].crossVectors(ad, ab).multiplyScalar(1 / 6);
      gradients[3].crossVectors(ab, ac).multiplyScalar(1 / 6);
      gradients[0].copy(gradients[1]).add(gradients[2]).add(gradients[3]).negate();
      const current = ab.dot(gradients[1]);
      let denominator = 0;
      for (let j = 0; j < 4; j++) {
        denominator += weights[tet.ids[j]] * gradients[j].lengthSq();
      }
      if (denominator < 1e-12) {
        continue;
      }
      const correction = ((current - tet.volume) * p.volumePreservation) / denominator;
      for (let j = 0; j < 4; j++) {
        positions[tet.ids[j]].addScaledVector(gradients[j], -correction * weights[tet.ids[j]]);
      }
    }
    for (let i = 0; i < positions.length; i++) {
      if (!weights[i]) {
        positions[i].copy(rest[i]);
        continue;
      }
      if (grabbed && grabWeights[i] > 0) {
        scratch
          .copy(target)
          .add(grabOffsets[i])
          .sub(rest[i])
          .sub(center)
          .clampLength(0, p.maxStretch * scale)
          .add(rest[i])
          .add(center);
        positions[i].lerp(scratch, grabWeights[i] * p.grabStrength);
      }
      constrainParticle(positions[i]);
      for (const plane of bounds) {
        const distance = plane.distanceToPoint(positions[i]) - p.screenMargin;
        if (distance < 0) {
          positions[i].addScaledVector(plane.normal, -distance);
        }
      }
    }
  };
  const finishStep = () => {
    if (sleeping) {
      return;
    }
    revision++;
    let maximumSpeed = 0;
    const dt = p.timestep;
    for (let i = 0; i < positions.length; i++) {
      velocities[i]
        .subVectors(positions[i], previous[i])
        .multiplyScalar(1 / dt)
        .clampLength(0, 10 * scale);
      if (positions[i].y <= floorLevel() + 1e-6) {
        velocities[i].y =
          incomingVelocity[i].y < -p.bounceThreshold
            ? -incomingVelocity[i].y * p.restitution
            : Math.max(0, velocities[i].y);
        velocities[i].x *= Math.exp(-p.floorFriction * dt);
        velocities[i].z *= Math.exp(-p.floorFriction * dt);
      }
      if (container) {
        const x = positions[i].x + container.origin.x;
        const z = positions[i].z + container.origin.z;
        const radius = Math.hypot(x, z);
        if (radius >= container.radius - 1e-5) {
          normal.set(-x / radius, 0, -z / radius);
          const approach = incomingVelocity[i].dot(normal);
          if (approach < 0) {
            velocities[i].addScaledVector(
              normal,
              -approach * p.restitution - velocities[i].dot(normal),
            );
          }
        }
        if (positions[i].y + container.origin.y >= container.ceiling - 1e-5) {
          velocities[i].y = Math.min(0, -Math.abs(incomingVelocity[i].y) * p.restitution);
        }
      }
      maximumSpeed = Math.max(maximumSpeed, velocities[i].length());
      for (const plane of bounds) {
        const approach = incomingVelocity[i].dot(plane.normal);
        if (plane.distanceToPoint(positions[i]) <= p.screenMargin + 1e-5 && approach < 0) {
          velocities[i].addScaledVector(
            plane.normal,
            -approach * p.restitution - velocities[i].dot(plane.normal),
          );
        }
      }
    }
    quietTime = !grabbed && maximumSpeed < p.sleepSpeed * scale ? quietTime + dt : 0;
    if (quietTime >= p.sleepAfter) {
      sleeping = true;
      velocities.forEach((velocity) => velocity.set(0, 0, 0));
    }
  };
  const step = () => {
    predict();
    for (let iteration = 0; iteration < p.iterations; iteration++) {
      solveConstraints();
    }
    finishStep();
  };
  const update = (delta: number) => {
    accumulator = Math.min(accumulator + delta, p.timestep * p.maxSubsteps);
    while (accumulator >= p.timestep) {
      step();
      accumulator -= p.timestep;
    }
  };
  // Trilinear embedding transfers the simulated volume's displacement to a dense surface.
  const bind = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const indices = new Uint16Array(attribute.count * 8);
    const factors = new Float32Array(attribute.count * 8);
    const original = new Float32Array(attribute.count * 3);
    for (let i = 0; i < attribute.count; i++) {
      original.set([attribute.getX(i), attribute.getY(i), attribute.getZ(i)], i * 3);
    }
    for (let i = 0; i < attribute.count; i++) {
      const coords = [
        (attribute.getX(i) / width + 0.5) * nx,
        (attribute.getY(i) / height + 0.5) * ny,
        (attribute.getZ(i) / depth + 0.5) * nz,
      ];
      const cell = coords.map((v, j) => Math.min(p.cells[j] - 1, Math.max(0, Math.floor(v))));
      const f = coords.map((v, j) => THREE.MathUtils.clamp(v - cell[j], 0, 1));
      let k = 0;
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          for (let x = 0; x < 2; x++) {
            indices[i * 8 + k] = id(cell[0] + x, cell[1] + y, cell[2] + z);
            factors[i * 8 + k] =
              (x ? f[0] : 1 - f[0]) * (y ? f[1] : 1 - f[1]) * (z ? f[2] : 1 - f[2]);
            k++;
          }
        }
      }
    }
    return () => {
      for (let i = 0; i < attribute.count; i++) {
        scratch.set(original[i * 3], original[i * 3 + 1], original[i * 3 + 2]);
        for (let k = 0; k < 8; k++) {
          const j = indices[i * 8 + k];
          const f = factors[i * 8 + k];
          scratch.x += (positions[j].x - rest[j].x) * f;
          scratch.y += (positions[j].y - rest[j].y) * f;
          scratch.z += (positions[j].z - rest[j].z) * f;
        }
        attribute.setXYZ(i, scratch.x, scratch.y, scratch.z);
      }
      attribute.needsUpdate = true;
    };
  };
  return {
    update,
    bind,
    beginGrab,
    moveGrab,
    endGrab,
    positions,
    rest,
    tets,
    predict,
    solveConstraints,
    constrainEnvironment,
    finishStep,
    container,
    wake,
    isSleeping: () => sleeping,
    getRevision: () => revision,
  };
};
