import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createJellyPile } from './jelly-pile';
import { createSoftBody } from './jelly-soft-body';
import { jellyParameters } from './jelly-parameters';

const makeBody = (x: number, y: number) =>
  createSoftBody(0.594, 0.396, 0.3, [], {
    origin: new THREE.Vector3(x, y, 0),
    radius: 1.2,
    floor: 0.07,
    ceiling: 2.9,
  });
const centre = (body: ReturnType<typeof makeBody>) => {
  const result = new THREE.Vector3();
  body.positions.forEach((point) => result.add(point));
  return result
    .divideScalar(body.positions.length)
    .add(body.container?.origin ?? new THREE.Vector3());
};
const assertContained = (body: ReturnType<typeof makeBody>) => {
  const origin = body.container?.origin ?? new THREE.Vector3();
  body.positions.forEach((point) => {
    expect(Number.isFinite(point.length())).toBe(true);
    expect(point.y + origin.y).toBeGreaterThanOrEqual(0.07 - 1e-5);
    expect(point.y + origin.y).toBeLessThanOrEqual(2.9 + 1e-5);
    expect(Math.hypot(point.x + origin.x, point.z + origin.z)).toBeLessThanOrEqual(1.2 + 1e-5);
  });
};

describe('contained loose jelly piles', () => {
  it('drops a miniature jelly onto the interior base while retaining its thickness', () => {
    const body = makeBody(0, 2);
    const pile = createJellyPile();
    pile.add(body);
    for (let step = 0; step < 300; step++) {
      pile.update(1 / 120);
    }
    assertContained(body);
    expect(centre(body).y).toBeLessThan(0.4);
    expect(centre(body).y).toBeGreaterThan(0.2);
    pile.dispose();
  });
  it('keeps a released grab within the wall and headroom bounds', () => {
    const body = makeBody(0.95, 2.5);
    const pile = createJellyPile();
    pile.add(body);
    body.beginGrab(body.positions[0]);
    body.moveGrab(new THREE.Vector3(100, 100, 0));
    for (let step = 0; step < 40; step++) {
      pile.update(1 / 120);
    }
    body.endGrab(true);
    for (let step = 0; step < 80; step++) {
      pile.update(1 / 120);
    }
    assertContained(body);
    pile.dispose();
  });
  it('makes two falling volumes collide and settle separately rather than occupying the same space', () => {
    const lower = makeBody(0, 0.7);
    const upper = makeBody(0.02, 1.6);
    const pile = createJellyPile();
    pile.add(lower);
    pile.add(upper);
    for (let step = 0; step < 360; step++) {
      pile.update(1 / 120);
    }
    assertContained(lower);
    assertContained(upper);
    expect(centre(upper).distanceTo(centre(lower))).toBeGreaterThan(0.27);
    expect(centre(upper).y).toBeLessThan(1.2);
    pile.dispose();
  });
  it('sleeps a settled volume and wakes it for a new grab', () => {
    const body = makeBody(0, 0.7);
    const pile = createJellyPile();
    pile.add(body);
    for (let step = 0; step < 600; step++) {
      pile.update(1 / 120);
    }
    expect(body.isSleeping()).toBe(true);
    const revision = body.getRevision();
    pile.update(0.05);
    expect(body.getRevision()).toBe(revision);
    body.beginGrab(body.positions[0]);
    expect(body.isSleeping()).toBe(false);
    pile.update(jellyParameters.physics.timestep);
    expect(body.getRevision()).toBeGreaterThan(revision);
    pile.dispose();
  });
  it('stops simulating a removed body', () => {
    const body = makeBody(0, 1);
    const pile = createJellyPile();
    pile.add(body);
    pile.remove(body);
    const before = body.positions.map((point) => point.clone());
    pile.update(0.05);
    body.positions.forEach((point, index) => expect(point.equals(before[index])).toBe(true));
    pile.dispose();
  });
});

const settle = (body: ReturnType<typeof makeBody>) => {
  for (let step = 0; step < 240; step++) {
    body.update(1 / 60);
  }
  expect(body.isSleeping()).toBe(true);
};

describe('selective sleeping', () => {
  it('wakes a hit body while a distant body stays asleep', () => {
    const lower = makeBody(-0.35, 0.7);
    const distant = makeBody(0.65, 0.7);
    settle(lower);
    settle(distant);
    const lowerRevision = lower.getRevision();
    const distantRevision = distant.getRevision();
    const incoming = makeBody(-0.33, 1.5);
    const pile = createJellyPile();
    pile.add(lower);
    pile.add(distant);
    pile.add(incoming);
    for (let step = 0; step < 120; step++) {
      pile.update(1 / 60);
    }
    expect(lower.getRevision()).toBeGreaterThan(lowerRevision);
    expect(distant.getRevision()).toBe(distantRevision);
    expect(distant.isSleeping()).toBe(true);
    assertContained(lower);
    assertContained(incoming);
    pile.dispose();
  });
  it('wakes resting neighbours when their support is removed', () => {
    const lower = makeBody(0, 0.7);
    const upper = makeBody(0, 0.7);
    settle(lower);
    settle(upper);
    // Assemble an already sleeping stack, with the upper base touching the lower top.
    upper.positions.forEach((point) => {
      point.y += 0.394;
    });
    const height = centre(upper).y;
    const pile = createJellyPile();
    pile.add(lower);
    pile.add(upper);
    pile.remove(lower);
    expect(upper.isSleeping()).toBe(false);
    for (let step = 0; step < 90; step++) {
      pile.update(1 / 60);
    }
    expect(centre(upper).y).toBeLessThan(height - 0.2);
    assertContained(upper);
    pile.dispose();
  });
  it('deforms a grabbed corner locally while retaining signed volume', () => {
    const body = makeBody(0, 0.7);
    settle(body);
    const before = body.positions.map((point) => point.clone());
    const near = before.length - 1;
    body.beginGrab(before[near]);
    body.moveGrab(before[near].clone().add(new THREE.Vector3(0.14, 0.12, 0)));
    for (let step = 0; step < 2; step++) {
      body.update(1 / 60);
    }
    const movement = new THREE.Vector3();
    body.positions.forEach((point, index) => movement.add(point).sub(before[index]));
    movement.divideScalar(before.length);
    const nearShift = body.positions[near].clone().sub(before[near]).sub(movement).length();
    const farShift = body.positions[0].clone().sub(before[0]).sub(movement).length();
    expect(nearShift).toBeGreaterThan(farShift * 1.2);
    for (let step = 0; step < 10; step++) {
      body.update(1 / 60);
    }
    const ab = new THREE.Vector3(),
      ac = new THREE.Vector3(),
      ad = new THREE.Vector3();
    let volume = 0;
    body.tets.forEach(({ ids }) => {
      const [a, b, c, d] = ids.map((id) => body.positions[id]);
      const signed = ab.subVectors(b, a).cross(ac.subVectors(c, a)).dot(ad.subVectors(d, a)) / 6;
      expect(signed).toBeGreaterThan(0);
      volume += signed;
    });
    const restVolume = body.tets.reduce((sum, tet) => sum + tet.volume, 0);
    expect(volume / restVolume).toBeGreaterThan(0.85);
    expect(volume / restVolume).toBeLessThan(1.15);
    body.endGrab();
    for (let step = 0; step < 180; step++) {
      body.update(1 / 60);
    }
    expect(body.isSleeping()).toBe(true);
    assertContained(body);
  });
});
