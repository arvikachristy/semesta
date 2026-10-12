import { useState } from 'react';
import type { ReactNode } from 'react';
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
import { StudioCategorySection, studioCategoryLabels } from './studio-category';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

interface ITripPlanningProps {
  items: readonly ITripPlanningItem[];
  onChange: (items: ITripPlanningItem[]) => void;
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
  const [localCategories, setLocalCategories] = useState<TPlanningCategory[]>(() => [
    ...new Set(items.map((item) => item.category)),
  ]);
  const active = activeCategories ?? localCategories;
  const progress = getPlanningProgress(items, active);
  const [message, setMessage] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [adding, setAdding] = useState<TPlanningCategory | null>(null);
  return (
    <section className={styles.planningWorkspace} aria-label="Trip Studio planning">
      <div className={journey ? styles.hero : undefined}>
        {journey}
        <section className={`${ui.surface} ${styles.readiness}`} aria-label="Trip readiness">
          <span className={styles.eyebrow}>Coming together</span>
          <div className={styles.readinessTitle}>
            <h2>Ready when you are.</h2>
            <span>
              {progress.percent}
              <small>%</small>
            </span>
          </div>
          <p role="status">
            {progress.completed} of {progress.total} items booked or ready · {progress.percent}%
          </p>
          <progress
            className={styles.progress}
            aria-label="Overall trip planning progress"
            value={progress.completed}
            max={progress.total || 1}
          />
          <div className={styles.compactProgress}>
            {active.map((category) => {
              const result = getPlanningProgress(
                items.filter((item) => item.category === category),
              );
              return (
                <div key={category}>
                  <span>{studioCategoryLabels[category]}</span>
                  <small>{result.percent}%</small>
                  <progress
                    className={styles.progress}
                    aria-label={`${planningCategories[category]} readiness`}
                    value={result.completed}
                    max={result.total || 1}
                  />
                </div>
              );
            })}
            {!active.length && (
              <p className={styles.eyebrow}>Choose only what this journey needs.</p>
            )}
          </div>
        </section>
      </div>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Your reservation collection</span>
          <h2>A few things to look forward to.</h2>
        </div>
        <Button variant={ButtonVariant.Quiet} onClick={() => setChoosing(true)}>
          Choose optional categories
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
              setMessage(`${removed?.name ?? 'Booking'} removed.`);
            }}
          />
        ))}
      </div>
      {!active.length && (
        <p className={styles.empty}>
          A little space for possibilities. Add a category when you’re ready.
        </p>
      )}
      {choosing && (
        <Overlay title="Choose optional categories" onDismiss={() => setChoosing(false)}>
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
                      onChange={(event) => {
                        const next = event.currentTarget.checked
                          ? [...active, category]
                          : active.filter((id) => id !== category);
                        setLocalCategories(next);
                        onCategoriesChange?.(next);
                      }}
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
            onChange([
              ...items,
              {
                id: crypto.randomUUID(),
                category: adding,
                ...fields,
                completed: false,
                status: PlanningStatus.Idea,
              },
            ]);
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
