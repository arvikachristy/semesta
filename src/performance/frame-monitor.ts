export enum FrameStatus {
  Good = 'good',
  Medium = 'medium',
  Bad = 'bad',
}

export const frameStatusLabels = {
  [FrameStatus.Good]: { name: 'Good', message: 'Butter mode', face: '✦' },
  [FrameStatus.Medium]: { name: 'Medium', message: 'Jelly legs', face: '〰' },
  [FrameStatus.Bad]: { name: 'Bad', message: 'Potato mode', face: '🥔' },
};
export const frameMonitorParameters = { sampleMs: 1000, goodFps: 50, mediumFps: 30 };
export interface IFrameReading {
  fps: number;
  frameMs: number;
  status: FrameStatus;
}
export const getFrameStatus = (fps: number) => {
  if (fps >= frameMonitorParameters.goodFps) {
    return FrameStatus.Good;
  }
  return fps >= frameMonitorParameters.mediumFps ? FrameStatus.Medium : FrameStatus.Bad;
};

// Measure actual render-loop intervals, before physics clamps its timestep.
export const createFrameMonitor = (report: (reading: IFrameReading) => void) => {
  let previous: number | null = null;
  let elapsed = 0;
  let frames = 0;
  const reset = () => {
    previous = null;
    elapsed = 0;
    frames = 0;
  };
  const sample = (now: number) => {
    if (previous === null) {
      previous = now;
      return;
    }
    const interval = now - previous;
    previous = now;
    if (interval <= 0) {
      return;
    }
    elapsed += interval;
    frames++;
    if (elapsed >= frameMonitorParameters.sampleMs) {
      const fps = (frames * 1000) / elapsed;
      report({ fps, frameMs: elapsed / frames, status: getFrameStatus(fps) });
      elapsed = 0;
      frames = 0;
    }
  };
  return { sample, reset };
};
