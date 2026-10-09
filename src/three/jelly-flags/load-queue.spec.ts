import { describe, expect, it, vi } from 'vitest';
import { createLoadQueue } from './load-queue';

describe('bounded artwork loading', () => {
  it('cancels queued construction when the scene is disposed', async () => {
    const queue = createLoadQueue(1);
    let finish = () => {};
    const active = queue.run(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const build = vi.fn(async () => {});
    const pending = queue.run(build);
    await Promise.resolve();
    queue.dispose();
    finish();
    await Promise.all([active, pending]);
    expect(build).not.toHaveBeenCalled();
  });
  it('limits construction bursts and continues after a rejected load', async () => {
    vi.useFakeTimers();
    try {
      const queue = createLoadQueue(2);
      let active = 0;
      let maximum = 0;
      const completed: number[] = [];
      const tasks = Array.from({ length: 7 }, (_, index) =>
        queue.run(async () => {
          active++;
          maximum = Math.max(maximum, active);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active--;
          if (index === 1) {
            throw new Error('Decode failed');
          }
          completed.push(index);
        }),
      );
      const results = Promise.allSettled(tasks);
      await vi.runAllTimersAsync();
      expect((await results).filter((result) => result.status === 'rejected')).toHaveLength(1);
      expect(maximum).toBe(2);
      expect(completed).toHaveLength(6);
    } finally {
      vi.useRealTimers();
    }
  });
});
