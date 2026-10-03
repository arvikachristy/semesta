import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createJellyPile } from './jelly-pile';
import { createSoftBody } from './jelly-soft-body';

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
    pile.update(1 / 120);
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
