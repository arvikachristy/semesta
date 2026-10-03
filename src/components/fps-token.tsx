import { frameStatusLabels } from '../performance/frame-monitor';
import type { IFrameReading } from '../performance/frame-monitor';

interface IFpsTokenProps {
  reading: IFrameReading | null;
}
export const FpsToken = ({ reading }: IFpsTokenProps) => {
  const label = reading ? frameStatusLabels[reading.status] : null;
  return (
    <aside
      className="fps-token"
      data-status={reading?.status}
      aria-label="Scene performance"
      title="Average render-loop FPS and frame time over one second. Good: 50+ FPS; medium: 30–49 FPS; bad: below 30 FPS."
    >
      <span className="fps-token-face" aria-hidden="true">
        {label?.face ?? '·'}
      </span>
      <span className="fps-token-content">
        <span className="fps-token-value">
          {reading ? Math.floor(reading.fps) : '—'} <small>FPS</small>
        </span>
        <span className="fps-token-message">
          {label ? `${label.name} · ${label.message}` : 'Warming up…'}
        </span>
        {reading && <span className="fps-token-time">{reading.frameMs.toFixed(1)} ms / frame</span>}
      </span>
    </aside>
  );
};
