import type { ITripPlanningItem } from '../../types/trip-planning';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';
interface ITripPlanningFieldsProps {
  item?: ITripPlanningItem;
  titleLabel?: string;
}
export const TripPlanningFields = ({
  item,
  titleLabel = 'Name or booking link',
}: ITripPlanningFieldsProps) => (
  <>
    <label className={ui.field}>
      {titleLabel}
      <input
        name="name"
        className={ui.control}
        required
        maxLength={500}
        placeholder="A name or https://…"
        defaultValue={item?.name ?? ''}
      />
    </label>
    <details className={styles.extraDetails}>
      <summary>Add details</summary>
      <label className={ui.field}>
        Date and time
        <input
          name="dateTime"
          className={ui.control}
          type="datetime-local"
          defaultValue={item?.dateTime ?? ''}
        />
      </label>
      <label className={ui.field}>
        Details
        <textarea
          name="details"
          className={ui.control}
          rows={3}
          maxLength={2000}
          defaultValue={item?.details ?? ''}
        />
      </label>
      <label className={ui.field}>
        Booking reference (optional)
        <input
          name="bookingReference"
          className={ui.control}
          maxLength={200}
          defaultValue={item?.bookingReference ?? ''}
        />
      </label>
      <label className={ui.field}>
        Booking link (optional)
        <input
          name="link"
          className={ui.control}
          type="url"
          pattern="https?://.*"
          placeholder="https://…"
          defaultValue={item?.link ?? ''}
        />
      </label>
    </details>
  </>
);
