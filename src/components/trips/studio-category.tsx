import { getPlanningProgress, planningCategories } from '../../types/trip-planning';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { TripPlanningItem } from './trip-planning-item';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

export const studioCategoryLabels = {
  ...planningCategories,
  transportation: 'Getting there',
  accommodation: 'Your stay',
  activities: 'Things to do',
};
const categorySymbols = {
  transportation: '↗',
  accommodation: '⌂',
  activities: '✧',
  restaurants: '◦',
  essentials: '✓',
};
interface IStudioCategoryProps {
  category: TPlanningCategory;
  items: readonly ITripPlanningItem[];
  onChange: (item: ITripPlanningItem) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}
export const StudioCategorySection = ({
  category,
  items,
  onChange,
  onRemove,
  onAdd,
}: IStudioCategoryProps) => {
  const progress = getPlanningProgress(items);
  const label = studioCategoryLabels[category];
  return (
    <details className={`${ui.surface} ${styles.category}`} open>
      <summary className={styles.categoryHeading}>
        <span className={styles.symbol} aria-hidden="true">
          {categorySymbols[category]}
        </span>
        <span className={styles.categoryTitle}>
          {label}
          <small>
            {progress.total
              ? `${progress.completed} of ${progress.total} booked or ready`
              : 'No plans yet'}
          </small>
        </span>
        {progress.total > 0 && <span className={styles.categoryCount}>{progress.percent}%</span>}
        <span aria-hidden="true" className={styles.expand}>
          ⌄
        </span>
        {progress.total > 0 && (
          <progress
            className={styles.progress}
            aria-label={`${planningCategories[category]} planning progress`}
            value={progress.completed}
            max={progress.total || 1}
          />
        )}
      </summary>
      <div className={styles.categoryBody}>
        {!items.length && (
          <p className={styles.eyebrow}>Add an idea now. Details can come later.</p>
        )}
        <ul className={styles.tickets} aria-label={`${label} bookings`}>
          {items.map((item) => (
            <TripPlanningItem
              key={item.id}
              item={item}
              onChange={onChange}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </ul>
        <Button variant={ButtonVariant.Quiet} onClick={onAdd}>
          Add {planningCategories[category].toLowerCase()}
        </Button>
      </div>
    </details>
  );
};
