import { Button, ButtonVariant } from '../ui/button';
import { getPlanningStatus, planningStatusLabel } from '../../types/trip-planning';
import type { IJourneyEntry } from './journey-map-model';
import { blockRange } from './journey-blocks';
import type { TBlockAction } from './journey-blocks';
import { useJourneyInteraction } from './use-journey-interaction';
import { JourneyItemActions } from './journey-item-actions';
import styles from './journey-map.module.css';

interface IJourneyBlockProps {
  entry: IJourneyEntry;
  duration: number;
  getBoundaries: () => number[];
  onChange: (start: number, end: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}
export const JourneyBlock = ({
  entry,
  duration,
  getBoundaries,
  onChange,
  onEdit,
  onDelete,
}: IJourneyBlockProps) => {
  const start = entry.day ?? 1;
  const end = entry.endDay ?? start;
  const stay = entry.item.category === 'accommodation';
  const { ref, preview, cancel } = useJourneyInteraction({
    start,
    end,
    duration,
    stay,
    getBoundaries,
    onChange,
  });
  const range = preview ?? { start, end };
  const handle = (action: TBlockAction, label: string, symbol: string) => (
    <Button
      variant={ButtonVariant.Quiet}
      className={styles.dragHandle}
      aria-label={`${label} ${entry.item.name}`}
      title={`${label} · drag or use arrow keys`}
      data-block-handle={action}
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
  const blockStyle = preview
    ? {
        transform: `translateY(${preview.offset}px)`,
        ...(preview.height !== undefined ? { height: preview.height } : {}),
      }
    : undefined;
  return (
    <div
      ref={ref}
      className={styles.calendarBlock}
      data-dragging={preview !== null}
      style={blockStyle}
    >
      {stay && handle('start', 'Resize start of', '↑')}
      <div className={styles.blockHandles}>
        {handle('move', 'Move', '⠿')}
        <JourneyItemActions name={entry.item.name} onEdit={onEdit} onDelete={onDelete} />
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
