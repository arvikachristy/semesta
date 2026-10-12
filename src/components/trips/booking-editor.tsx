import { useState } from 'react';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import { TripPlanningFields } from './trip-planning-fields';
import { readBookingForm } from './booking-form';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface IBookingEditorProps {
  item?: ITripPlanningItem;
  title: string;
  onSave: (fields: NonNullable<ReturnType<typeof readBookingForm>>) => void;
  onCancel: () => void;
}
export const BookingEditor = ({ item, title, onSave, onCancel }: IBookingEditorProps) => {
  const [error, setError] = useState('');
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
          onSave(fields);
        }}
      >
        <TripPlanningFields
          item={item}
          titleLabel={
            item
              ? 'Name'
              : title.replace('Add ', '').replace(/^./, (letter) => letter.toUpperCase()) + ' name'
          }
        />
        {error && <p role="alert">{error}</p>}
        <div className={ui.actions}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={ButtonVariant.Primary} type="submit">
            {item ? 'Save details' : title}
          </Button>
        </div>
      </form>
    </Overlay>
  );
};
