import { useState } from 'react';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface ITripPlanningItemProps {
  item: ITripPlanningItem;
  onChange: (item: ITripPlanningItem) => void;
  onRemove: () => void;
}

export const TripPlanningItem = ({ item, onChange, onRemove }: ITripPlanningItemProps) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [details, setDetails] = useState(item.details);
  return (
    <li className={styles.planningItem}>
      <label className={styles.bookingStatus}>
        <input
          className={ui.checkbox}
          type="checkbox"
          checked={item.completed}
          onChange={(event) => onChange({ ...item, completed: event.currentTarget.checked })}
        />
        <span>
          {item.name}
          <small>
            {item.completed
              ? item.category === 'essentials'
                ? 'Ready'
                : 'Booked'
              : item.category === 'essentials'
                ? 'To prepare'
                : 'Not booked'}
          </small>
        </span>
      </label>
      {editing ? (
        <form
          className={styles.planningForm}
          onSubmit={(event) => {
            event.preventDefault();
            onChange({ ...item, name: name.trim(), details });
            setEditing(false);
          }}
        >
          <label className={ui.field}>
            Name
            <input
              className={ui.control}
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <label className={ui.field}>
            Details
            <textarea
              className={ui.control}
              rows={3}
              maxLength={2000}
              value={details}
              onChange={(event) => setDetails(event.currentTarget.value)}
            />
          </label>
          <div className={ui.actions}>
            <Button onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" variant={ButtonVariant.Primary} disabled={!name.trim()}>
              Save details
            </Button>
          </div>
        </form>
      ) : (
        <>
          {item.details && <p className={styles.notes}>{item.details}</p>}
          <div className={ui.actions}>
            <Button
              variant={ButtonVariant.Quiet}
              aria-label={`Edit ${item.name}`}
              onClick={() => {
                setName(item.name);
                setDetails(item.details);
                setEditing(true);
              }}
            >
              Edit details
            </Button>
            <Button
              variant={ButtonVariant.Quiet}
              aria-label={`Remove ${item.name}`}
              onClick={onRemove}
            >
              Remove
            </Button>
          </div>
        </>
      )}
    </li>
  );
};
