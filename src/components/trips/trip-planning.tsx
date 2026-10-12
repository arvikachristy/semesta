import { useState } from 'react';
import {
  getPlanningProgress,
  planningCategories,
  isPlanningCategory,
} from '../../types/trip-planning';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { TripPlanningItem } from './trip-planning-item';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface ITripPlanningProps {
  items: readonly ITripPlanningItem[];
  onChange: (items: ITripPlanningItem[]) => void;
}

export const TripPlanning = ({ items, onChange }: ITripPlanningProps) => {
  const progress = getPlanningProgress(items);
  const [message, setMessage] = useState('');
  return (
    <section className={styles.planning} aria-label="Trip planning">
      <h4>Make it happen</h4>
      <p id="trip-planning-progress" role="status">
        {progress.completed} of {progress.total} items booked or ready · {progress.percent}%
      </p>
      <progress
        className={styles.planningProgress}
        aria-labelledby="trip-planning-progress"
        value={progress.completed}
        max={progress.total || 1}
      />
      {!items.length && (
        <p>Add what you need for this trip, then tick each item when it is booked or ready.</p>
      )}
      {Object.entries(planningCategories).map(([category, label]) => (
        <details className={styles.planningCategory} key={category} open>
          <summary>{label}</summary>
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
          <form
            className={styles.planningForm}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fields = new FormData(form);
              const name = fields.get('name');
              const details = fields.get('details');
              if (
                typeof name === 'string' &&
                name.trim() &&
                typeof details === 'string' &&
                isPlanningCategory(category)
              ) {
                onChange([
                  ...items,
                  {
                    id: crypto.randomUUID(),
                    category,
                    name: name.trim(),
                    details,
                    completed: false,
                  },
                ]);
                form.reset();
                setMessage(`${name.trim()} added.`);
              }
            }}
          >
            <label className={ui.field}>
              {label} name
              <input
                name="name"
                className={ui.control}
                required
                maxLength={120}
                placeholder={
                  category === 'essentials'
                    ? 'e.g. Travel insurance'
                    : `Add ${label.toLowerCase()}…`
                }
              />
            </label>
            <label className={ui.field}>
              Details
              <textarea
                name="details"
                className={ui.control}
                maxLength={2000}
                rows={2}
                placeholder="Dates, address, price, booking reference or link…"
              />
            </label>
            <Button type="submit" variant={ButtonVariant.Secondary}>
              Add {label.toLowerCase()}
            </Button>
          </form>
        </details>
      ))}
      <p role="status">{message}</p>
    </section>
  );
};
