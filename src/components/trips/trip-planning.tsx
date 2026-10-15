import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ITrip } from '../../types/trip';
import {
  getPlanningProgress,
  planningCategories,
  isPlanningCategory,
  PlanningStatus,
} from '../../types/trip-planning';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import { BookingEditor } from './booking-editor';
import { StudioCategorySection } from './studio-category';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

export const initialPlanningCategories: TPlanningCategory[] = [
  'activities',
  'transportation',
  'accommodation',
];
interface ITripPlanningProps {
  trip: ITrip;
  items: readonly ITripPlanningItem[];
  onChange: (items: ITripPlanningItem[], activeCategories?: TPlanningCategory[]) => void;
  activeCategories?: readonly TPlanningCategory[];
  onCategoriesChange?: (categories: TPlanningCategory[]) => void;
  journey?: ReactNode;
}
export const TripPlanning = ({
  items,
  onChange,
  activeCategories,
  onCategoriesChange,
  journey,
}: ITripPlanningProps) => {
  const [localCategories, setLocalCategories] = useState<TPlanningCategory[]>(() =>
    items.length
      ? [...new Set(items.map((item) => item.category))]
      : [...initialPlanningCategories],
  );
  const active = activeCategories ?? localCategories;
  const progress = getPlanningProgress(items, active);
  const [message, setMessage] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [adding, setAdding] = useState<TPlanningCategory | null>(null);
  const changeCategories = (next: TPlanningCategory[]) => {
    setLocalCategories(next);
    onCategoriesChange?.(next);
  };
  return (
    <section className={styles.planningWorkspace} aria-label="Trip Studio planning">
      {journey && (
        <div className={progress.total ? styles.hero : undefined}>
          {journey}
          {progress.total > 0 && (
            <section
              className={`${ui.surface} ${styles.readiness}`}
              aria-label="Trip readiness"
              data-complete={progress.completed === progress.total}
            >
              <span className={styles.eyebrow}>Your tracked plans</span>
              <div className={styles.readinessTitle}>
                <h2>
                  {progress.completed === progress.total
                    ? 'All tracked plans confirmed.'
                    : 'Coming together.'}
                </h2>
                <span>
                  {progress.percent}
                  <small>%</small>
                </span>
              </div>
              <p role="status">
                {progress.completed} of {progress.total} items booked or ready
              </p>
              <progress
                className={styles.progress}
                aria-label="Overall trip planning progress"
                value={progress.completed}
                max={progress.total}
              />
            </section>
          )}
        </div>
      )}
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>
            {progress.total
              ? 'Keep your ideas and bookings together'
              : 'Start with one thing you want to experience'}
          </span>
          <h2>Your trip plan</h2>
        </div>
        <Button variant={ButtonVariant.Quiet} onClick={() => setChoosing(true)}>
          Choose categories
        </Button>
      </div>
      <div className={styles.categories}>
        {active.map((category) => (
          <StudioCategorySection
            key={category}
            category={category}
            items={items.filter((item) => item.category === category)}
            onAdd={() => setAdding(category)}
            onChange={(updated) =>
              onChange(items.map((item) => (item.id === updated.id ? updated : item)))
            }
            onRemove={(id) => {
              const removed = items.find((item) => item.id === id);
              onChange(items.filter((item) => item.id !== id));
              setMessage(`${removed?.name ?? 'Plan'} removed.`);
            }}
          />
        ))}
      </div>
      {!active.length && (
        <p className={styles.empty}>
          Choose a category to start. Dates and bookings can come later.
        </p>
      )}
      {choosing && (
        <Overlay title="Choose categories" onDismiss={() => setChoosing(false)}>
          <p>Turning a category off keeps its items saved. Turn it back on any time.</p>
          <div className={styles.choices}>
            {Object.entries(planningCategories).map(
              ([category, label]) =>
                isPlanningCategory(category) && (
                  <label key={category}>
                    <input
                      className={ui.checkbox}
                      type="checkbox"
                      checked={active.includes(category)}
                      onChange={(event) =>
                        changeCategories(
                          event.currentTarget.checked
                            ? [...active, category]
                            : active.filter((id) => id !== category),
                        )
                      }
                    />
                    {label}
                  </label>
                ),
            )}
          </div>
          <Button variant={ButtonVariant.Primary} onClick={() => setChoosing(false)}>
            Done
          </Button>
        </Overlay>
      )}
      {adding && (
        <BookingEditor
          title={`Add ${planningCategories[adding].toLowerCase()}`}
          onCancel={() => setAdding(null)}
          onSave={(fields) => {
            onChange(
              [
                ...items,
                {
                  id: crypto.randomUUID(),
                  category: adding,
                  ...fields,
                  completed: false,
                  status: PlanningStatus.Idea,
                },
              ],
              [...active],
            );
            setAdding(null);
            setMessage(`${fields.name} added.`);
          }}
        />
      )}
      <p className={styles.eyebrow} role="status">
        {message}
      </p>
    </section>
  );
};
