import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Button, ButtonVariant } from '../ui/button';
import { getPlanningStatus, planningStatusLabel } from '../../types/trip-planning';
import type { IJourneyEntry } from './journey-map-model';
import { blockRange } from './journey-blocks';
import type { TBlockAction } from './journey-blocks';
import styles from './journey-map.module.css';

interface IJourneyBlockProps {
  entry: IJourneyEntry;
  duration: number;
  getBoundaries: () => number[];
  onChange: (start: number, end: number) => void;
  onEdit: () => void;
}
interface IBlockDrag {
  action: TBlockAction;
  y: number;
  boundaries: number[];
  delta: number;
}
export const JourneyBlock = ({
  entry,
  duration,
  getBoundaries,
  onChange,
  onEdit,
}: IJourneyBlockProps) => {
  const drag = useRef<IBlockDrag | null>(null);
  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null);
  const start = entry.day ?? 1;
  const end = entry.endDay ?? start;
  const stay = entry.item.category === 'accommodation';
  const range = preview ?? { start, end };
  const cancel = () => {
    drag.current = null;
    setPreview(null);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drag.current) {
        event.preventDefault();
        drag.current = null;
        setPreview(null);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  const pointDay = (y: number, boundaries: number[]) =>
    Math.max(
      1,
      boundaries.findIndex((next) => y < next),
    );
  const update = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (!active) {
      return;
    }
    const at = (y: number) =>
      y >= (active.boundaries.at(-1) ?? 0) ? duration : pointDay(y, active.boundaries);
    active.delta = at(event.clientY) - at(active.y);
    const next = blockRange(start, end, active.delta, active.action, duration);
    setPreview(next);
  };
  const handle = (action: TBlockAction, label: string, symbol: string) => (
    <Button
      variant={ButtonVariant.Quiet}
      className={styles.dragHandle}
      aria-label={`${label} ${entry.item.name}`}
      title={`${label} · drag or use arrow keys`}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        event.preventDefault();
        event.currentTarget.focus();
        drag.current = { action, y: event.clientY, boundaries: getBoundaries(), delta: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        setPreview({ start, end });
      }}
      onPointerMove={update}
      onPointerUp={(event) => {
        const active = drag.current;
        if (!active) {
          return;
        }
        update(event);
        const next = blockRange(start, end, active.delta, action, duration);
        cancel();
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (next.start !== start || next.end !== end) {
          onChange(next.start, next.end);
        }
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          cancel();
          return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const next = blockRange(start, end, event.key === 'ArrowUp' ? -1 : 1, action, duration);
          onChange(next.start, next.end);
        }
      }}
    >
      {symbol}
    </Button>
  );
  const boundaries = drag.current?.boundaries;
  const blockStyle =
    preview && boundaries
      ? {
          transform: `translateY(${(boundaries[preview.start - 1] ?? 0) - (boundaries[start - 1] ?? 0)}px)`,
          ...(stay
            ? {
                height: Math.max(
                  0,
                  (boundaries[preview.end - 1] ?? 0) - (boundaries[preview.start - 1] ?? 0) - 16,
                ),
              }
            : {}),
        }
      : undefined;
  return (
    <div className={styles.calendarBlock} data-dragging={preview !== null} style={blockStyle}>
      <div className={styles.blockHandles}>
        {stay && handle('start', 'Resize start of', '↑')}
        {handle('move', 'Move', '⠿')}
      </div>
      <Button
        variant={ButtonVariant.Plain}
        className={styles.blockBody}
        data-journey-item={entry.item.id}
        aria-label={`${entry.saved ? 'Edit' : 'Add'} ${entry.item.name}`}
        onClick={onEdit}
      >
        <strong>{entry.item.name}</strong>
        <small>
          Day {range.start}
          {stay ? `–${range.end} · ${range.end - range.start} nights` : ''}
        </small>
        <span className={styles.badge} data-status={getPlanningStatus(entry.item)}>
          {planningStatusLabel(getPlanningStatus(entry.item), entry.item.category)}
        </span>
      </Button>
      {stay && handle('end', 'Resize end of', '↕')}
      {preview && <small role="status">Release to place · Esc to cancel</small>}
    </div>
  );
};
