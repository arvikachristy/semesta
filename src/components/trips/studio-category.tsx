import { getStudioProgress } from './studio-preview';
import type { IStudioCategory } from './studio-preview';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

interface IStudioCategoryProps {
  category: IStudioCategory;
}
export const StudioCategorySection = ({ category }: IStudioCategoryProps) => {
  const progress = getStudioProgress(category.items);
  return (
    <details className={`${ui.surface} ${styles.category}`}>
      <summary className={styles.categoryHeading}>
        <span className={styles.symbol} aria-hidden="true">
          {category.symbol}
        </span>
        <span className={styles.categoryTitle}>
          {category.label}
          <small>
            {progress.booked} of {progress.total} collected
          </small>
        </span>
        <span>{progress.percent}%</span>
        <span aria-hidden="true" className={styles.expand}>
          ⌄
        </span>
        <progress
          className={styles.progress}
          aria-label={`${category.label} booking progress`}
          value={progress.booked}
          max={progress.total || 1}
        />
      </summary>
      <ol className={styles.tickets} aria-label={`${category.label} bookings`}>
        {category.items.map((item) => (
          <li className={styles.ticket} key={item.id}>
            <span>
              <strong>{item.name}</strong>
              <small>{item.detail}</small>
            </span>
            <span className={styles.status}>{item.status}</span>
          </li>
        ))}
      </ol>
    </details>
  );
};
