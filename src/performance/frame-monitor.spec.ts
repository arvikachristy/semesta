import { describe, expect, it, vi } from 'vitest';
import { createFrameMonitor, FrameStatus, getFrameStatus } from './frame-monitor';

describe('render-loop diagnostics', () => {
  it.each([
    [60, FrameStatus.Good],
    [50, FrameStatus.Good],
    [49, FrameStatus.Medium],
    [30, FrameStatus.Medium],
    [29, FrameStatus.Bad],
    [0, FrameStatus.Bad],
  ])('classifies %s FPS as %s', (fps, status) => {
    expect(getFrameStatus(fps)).toBe(status);
  });
  it('averages real elapsed time and publishes once per sample window', () => {
    const report = vi.fn();
    const monitor = createFrameMonitor(report);
    for (let frame = 0; frame <= 100; frame++) {
      monitor.sample(frame * 20);
    }
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenLastCalledWith({ fps: 50, frameMs: 20, status: FrameStatus.Good });
  });
  it('includes long stalls instead of reporting the clamped simulation delta', () => {
    const report = vi.fn();
    const monitor = createFrameMonitor(report);
    monitor.sample(0);
    monitor.sample(1000);
    expect(report).toHaveBeenCalledWith({ fps: 1, frameMs: 1000, status: FrameStatus.Bad });
  });
  it('discards hidden-tab gaps when reset', () => {
    const report = vi.fn();
    const monitor = createFrameMonitor(report);
    monitor.sample(0);
    monitor.sample(20);
    monitor.reset();
    monitor.sample(100000);
    expect(report).not.toHaveBeenCalled();
    for (let frame = 1; frame <= 50; frame++) {
      monitor.sample(100000 + frame * 20);
    }
    expect(report).toHaveBeenCalledWith({ fps: 50, frameMs: 20, status: FrameStatus.Good });
  });
});
