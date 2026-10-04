import { Box3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { createCollisionBroadphase } from './collision-broadphase';

describe('collision broad phase', () => {
  it('matches exhaustive bounds checks, includes touching faces, and skips sleeping pairs', () => {
    const entries = Array.from({ length: 60 }, (_, index) => ({
      index,
      bounds: new Box3(
        new Vector3(index % 3, Math.floor(index / 3) * 0.5, 0),
        new Vector3((index % 3) + 1, Math.floor(index / 3) * 0.5 + 1, 1),
      ),
      body: { isSleeping: () => index % 3 === 0 },
    }));
    const expected: string[] = [];
    entries.forEach((a, index) =>
      entries.slice(index + 1).forEach((b) => {
        if (!(a.body.isSleeping() && b.body.isSleeping()) && a.bounds.intersectsBox(b.bounds)) {
          expected.push(`${a.index}:${b.index}`);
        }
      }),
    );
    const actual: string[] = [];
    createCollisionBroadphase<(typeof entries)[number]>()([...entries].reverse(), (a, b) => {
      actual.push(`${Math.min(a.index, b.index)}:${Math.max(a.index, b.index)}`);
    });
    expect(actual.sort()).toEqual(expected.sort());
  });
});
