import type { Box3 } from 'three';

interface IBoundedBody {
  bounds: Box3;
  body: { isSleeping: () => boolean };
}

// Sweep along the stack's vertical axis. Bodies separated in height never enter
// the expensive particle/tetrahedron contact tests. Reuse the sorted array.
export const createCollisionBroadphase = <T extends IBoundedBody>() => {
  const sorted: T[] = [];
  return (entries: readonly T[], collide: (first: T, second: T) => void) => {
    for (let i = 0; i < entries.length; i++) {
      sorted[i] = entries[i];
    }
    sorted.length = entries.length;
    sorted.sort((first, second) => first.bounds.min.y - second.bounds.min.y);
    for (let a = 0; a < sorted.length; a++) {
      const first = sorted[a];
      for (let b = a + 1; b < sorted.length; b++) {
        const second = sorted[b];
        if (second.bounds.min.y > first.bounds.max.y) {
          break;
        }
        if (
          !(first.body.isSleeping() && second.body.isSleeping()) &&
          first.bounds.intersectsBox(second.bounds)
        ) {
          collide(first, second);
        }
      }
    }
  };
};
