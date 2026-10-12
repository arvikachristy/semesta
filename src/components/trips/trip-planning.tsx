import { useState } from 'react';
import {
  getPlanningProgress,
  planningCategories,
  isPlanningCategory,
  PlanningStatus,
} from '../../types/trip-planning';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { TripPlanningFields } from './trip-planning-fields';
import { readBookingForm } from './booking-form';
import { Button, ButtonVariant } from '../ui/button';
import { TripPlanningItem } from './trip-planning-item';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface ITripPlanningProps {
  items: readonly ITripPlanningItem[];
  onChange: (items: ITripPlanningItem[]) => void;
  activeCategories?: readonly TPlanningCategory[];
  onCategoriesChange?: (categories: TPlanningCategory[]) => void;
}

export const TripPlanning = ({
  items,
  onChange,
  activeCategories,
  onCategoriesChange,
}: ITripPlanningProps) => {
  const [localCategories, setLocalCategories] = useState<TPlanningCategory[]>(() => [
    ...new Set(items.map((item) => item.category)),
  ]);
  const active = activeCategories ?? localCategories;
  const progress = getPlanningProgress(items, active);
  const [message, setMessage] = useState('');
  return (
    <section className={styles.planning} aria-label="Trip Studio planning">
      <h4>Trip Studio</h4>
      <p id="trip-planning-progress" role="status">
        {progress.completed} of {progress.total} items booked or ready · {progress.percent}%
      </p>
      <progress
        className={styles.planningProgress}
        aria-labelledby="trip-planning-progress"
        value={progress.completed}
        max={progress.total || 1}
      />
      {!progress.total && (
        <p>
          Choose a category and add what this trip needs. Only active planned items count towards
          readiness.
        </p>
      )}
      <details className={styles.planningCategory}>
        <summary>Choose optional categories</summary>
        <p>Turning a category off keeps its items saved. Turn it back on any time.</p>
        {Object.entries(planningCategories).map(
          ([category, label]) =>
            isPlanningCategory(category) && (
              <label className={styles.bookingStatus} key={category}>
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
      </details>
      {Object.entries(planningCategories)
        .filter(([category]) => isPlanningCategory(category) && active.includes(category))
        .map(([category, label]) => (
          <details
            className={`${ui.surface} ${styles.planningCategory} ${styles.bookingCategory}`}
            key={category}
            open
          >
            <summary>{label}</summary>
            <p>
              {getPlanningProgress(items.filter((item) => item.category === category)).percent}%
              ready
            </p>
            <progress
              className={styles.planningProgress}
              aria-label={`${label} planning progress`}
              value={
                getPlanningProgress(items.filter((item) => item.category === category)).completed
              }
              max={
                getPlanningProgress(items.filter((item) => item.category === category)).total || 1
              }
            />
            {category === 'essentials' && (
              <p>
                Remember visas, passport validity, insurance, medication and an offline copy of your
                documents.
              </p>
            )}
            <ul className={styles.planningItems}>
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <TripPlanningItem
                    key={item.id}
                    item={item}
                    onChange={(updated) =>
                      onChange(
                        items.map((current) => (current.id === updated.id ? updated : current)),
                      )
                    }
                    onRemove={() => {
                      onChange(items.filter((current) => current.id !== item.id));
                      setMessage(`${item.name} removed.`);
                    }}
                  />
                ))}
            </ul>
            <details>
              <summary>Add {label.toLowerCase()}</summary>
              <form
                className={styles.planningForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const fields = readBookingForm(form);
                  if (fields && isPlanningCategory(category)) {
                    onChange([
                      ...items,
                      {
                        id: crypto.randomUUID(),
                        category,
                        ...fields,
                        completed: false,
                        status: PlanningStatus.Idea,
                      },
                    ]);
                    form.reset();
                    setMessage(`${fields.name} added.`);
                  } else {
                    setMessage('Check the date/time and use an http or https booking link.');
                  }
                }}
              >
                <TripPlanningFields titleLabel={`${label} name`} />
                <Button type="submit" variant={ButtonVariant.Secondary}>
                  Add {label.toLowerCase()}
                </Button>
              </form>
            </details>
          </details>
        ))}
      <p role="status">{message}</p>
    </section>
  );
};
