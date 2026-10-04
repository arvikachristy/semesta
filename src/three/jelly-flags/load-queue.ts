import { jellyPerformance } from './jelly-performance';

interface IQueuedLoad {
  start: () => void;
  cancel: () => void;
}

// Bound SVG decoding/mesh construction and give input/rendering a turn between batches.
export const createLoadQueue = (limit: number) => {
  const tasks: IQueuedLoad[] = [];
  let active = 0;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pump = () => {
    while (!disposed && active < limit && tasks.length > 0) {
      tasks.shift()?.start();
    }
  };
  return {
    run: (task: () => Promise<void>) =>
      new Promise<void>((resolve, reject) => {
        if (disposed) {
          resolve();
          return;
        }
        tasks.push({
          cancel: resolve,
          start: () => {
            active++;
            Promise.resolve()
              .then(task)
              .then(resolve, reject)
              .finally(() => {
                active--;
                if (!disposed) {
                  clearTimeout(timer);
                  timer = setTimeout(pump, jellyPerformance.loadBatchDelayMs);
                }
              });
          },
        });
        pump();
      }),
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
      tasks.splice(0).forEach((task) => task.cancel());
    },
  };
};
