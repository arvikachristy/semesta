import { useState } from 'react';
import {
  getPlanningStatus,
  PlanningStatus,
  planningStatusLabel,
  isPlanningStatus,
} from '../../types/trip-planning';
import type { ITripPlanningItem, TPlanningStatus } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { TripPlanningFields } from './trip-planning-fields';
import { readBookingForm } from './booking-form';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';
interface ITripPlanningItemProps {
  item: ITripPlanningItem;
  onChange: (item: ITripPlanningItem) => void;
  onRemove: () => void;
}
export const TripPlanningItem = ({ item, onChange, onRemove }: ITripPlanningItemProps) => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const status = getPlanningStatus(item);
  const updateStatus = (next: TPlanningStatus) =>
    onChange({ ...item, status: next, completed: next === PlanningStatus.Booked });
  return (
    <li className={styles.planningItem} data-confirmed={status === PlanningStatus.Booked}>
      <details>
        <summary className={styles.bookingSummary}>
          <span>
            {item.name}
            {item.dateTime && <small>{item.dateTime.replace('T', ' · ')}</small>}
          </span>
          <small>{planningStatusLabel(status, item.category)}</small>
        </summary>
        <div className={styles.planningForm}>
          <label className={ui.field}>
            Status for {item.name}
            <select
              className={ui.control}
              value={status}
              onChange={(event) => {
                if (isPlanningStatus(event.currentTarget.value)) {
                  updateStatus(event.currentTarget.value);
                }
              }}
            >
              {Object.values(PlanningStatus).map((value) => (
                <option key={value} value={value}>
                  {planningStatusLabel(value, item.category)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.bookingStatus}>
            <input
              className={ui.checkbox}
              type="checkbox"
              checked={status === PlanningStatus.Booked}
              onChange={(event) =>
                updateStatus(
                  event.currentTarget.checked ? PlanningStatus.Booked : PlanningStatus.ToBook,
                )
              }
            />
            {item.category === 'essentials' ? 'Ready' : 'Booked'}: {item.name}
          </label>
          {editing ? (
            <form
              className={styles.planningForm}
              onSubmit={(event) => {
                event.preventDefault();
                const fields = readBookingForm(event.currentTarget);
                if (!fields) {
                  setError('Check the date/time and use an http or https booking link.');
                  return;
                }
                onChange({ ...item, ...fields });
                setEditing(false);
                setError('');
              }}
            >
              <TripPlanningFields item={item} />
              {error && <p role="alert">{error}</p>}
              <div className={ui.actions}>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant={ButtonVariant.Primary}>
                  Save details
                </Button>
              </div>
            </form>
          ) : (
            <>
              {item.details && <p className={styles.notes}>{item.details}</p>}
              {item.bookingReference && <p>Reference: {item.bookingReference}</p>}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer">
                  Open booking link ↗
                </a>
              )}
              <div className={ui.actions}>
                <Button
                  variant={ButtonVariant.Quiet}
                  aria-label={`Edit ${item.name}`}
                  onClick={() => setEditing(true)}
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
        </div>
      </details>
    </li>
  );
};
