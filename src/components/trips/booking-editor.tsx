import { useState } from 'react';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { getPlanningStatus, PlanningStatus } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import { TripPlanningFields } from './trip-planning-fields';
import { readBookingForm } from './booking-form';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface IBookingEditorProps {
  item?: ITripPlanningItem;
  title: string;
  onSave: (
    fields: NonNullable<ReturnType<typeof readBookingForm>> &
      Pick<ITripPlanningItem, 'status' | 'completed' | 'dayNumber' | 'endDayNumber'>,
  ) => boolean | void;
  onCancel: () => void;
  onRemove?: () => void;
  tripDays?: number;
  allowDaySelection?: boolean;
}
export const BookingEditor = ({
  item,
  title,
  onSave,
  onCancel,
  onRemove,
  tripDays,
  allowDaySelection,
}: IBookingEditorProps) => {
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(
    item ? getPlanningStatus(item) === PlanningStatus.Booked : false,
  );
  return (
    <Overlay title={title} onDismiss={onCancel}>
      <form
        className={styles.planningForm}
        onSubmit={(event) => {
          event.preventDefault();
          const fields = readBookingForm(event.currentTarget);
          if (!fields) {
            setError('Check the date/time and use an http or https booking link.');
            return;
          }
          const data = new FormData(event.currentTarget);
          const stay = item?.category === 'accommodation' && tripDays && tripDays > 1;
          const start = Number(data.get('dayNumber'));
          const end = Number(data.get('endDayNumber'));
          if (
            stay &&
            (!Number.isInteger(start) ||
              !Number.isInteger(end) ||
              start < 1 ||
              end <= start ||
              end > tripDays)
          ) {
            setError('Choose a check-out day after check-in, within this trip.');
            return;
          }
          const saved = onSave({
            ...fields,
            ...(stay ? { dayNumber: start, endDayNumber: end } : {}),
            ...(allowDaySelection
              ? {
                  dayNumber:
                    Number(new FormData(event.currentTarget).get('dayNumber')) || undefined,
                }
              : {}),
            completed: booked,
            status: booked
              ? PlanningStatus.Booked
              : item?.status === PlanningStatus.Idea
                ? PlanningStatus.Idea
                : PlanningStatus.ToBook,
          });
          if (saved === false) {
            setError('These dates would cover another whole stay. Adjust that block first.');
          }
        }}
      >
        <TripPlanningFields item={item} />
        {item?.category === 'accommodation' && tripDays && tripDays > 1 && (
          <div className={ui.actions}>
            <label className={ui.field}>
              Check-in day
              <input
                className={ui.control}
                name="dayNumber"
                type="number"
                min={1}
                max={tripDays - 1}
                required
                defaultValue={item.dayNumber ?? 1}
              />
            </label>
            <label className={ui.field}>
              Check-out day
              <input
                className={ui.control}
                name="endDayNumber"
                type="number"
                min={2}
                max={tripDays}
                required
                defaultValue={item.endDayNumber ?? tripDays}
              />
            </label>
          </div>
        )}
        {allowDaySelection && tripDays && (
          <label className={ui.field}>
            Trip day
            <select className={ui.control} name="dayNumber" defaultValue={item?.dayNumber ?? ''}>
              <option value="">Use route or booking date</option>
              {Array.from({ length: tripDays }, (_, index) => (
                <option key={index} value={index + 1}>
                  Day {index + 1}
                </option>
              ))}
            </select>
            <small>A booking date takes priority when the trip has dates.</small>
          </label>
        )}
        <label className={styles.bookingStatus}>
          <input
            className={ui.checkbox}
            type="checkbox"
            checked={booked}
            onChange={(event) => setBooked(event.currentTarget.checked)}
          />
          Booked
        </label>
        {error && <p role="alert">{error}</p>}
        <div className={ui.actions}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={ButtonVariant.Primary} type="submit">
            Save plan
          </Button>
        </div>
        {onRemove && (
          <Button variant={ButtonVariant.Quiet} onClick={onRemove}>
            Delete block
          </Button>
        )}
      </form>
    </Overlay>
  );
};
