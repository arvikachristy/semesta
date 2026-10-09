import { Button, ButtonVariant } from '../ui/button';
import { flagAssetPath } from '../../data/flag-definitions';
import type { ITrip } from '../../types/trip';
import { getTripDates, sortTrips } from './trip-presentation';
import styles from './trips.module.css';

interface ITripListProps {
  trips: readonly ITrip[];
  onSelect: (id: string) => void;
}

export const TripList = ({ trips, onSelect }: ITripListProps) => (
  <ol className={styles.timeline} aria-label="Planned trips">
    {sortTrips(trips).map((trip) => {
      const dates = getTripDates(trip);
      const country = trip.countryIds[0];
      return (
        <li key={trip.id}>
          <Button
            type="button"
            variant={ButtonVariant.Plain}
            className={styles.tripRow}
            aria-label={`Open ${trip.name}`}
            onClick={() => onSelect(trip.id)}
          >
            <span className={styles.dateMarker} aria-hidden="true">
              <span>{dates.month}</span>
              <small>{dates.days}</small>
            </span>
            <span className={styles.thumbnail} aria-hidden="true">
              {country && <img src={flagAssetPath(country)} alt="" loading="lazy" />}
            </span>
            <span className={styles.tripSummary}>
              <span className={styles.tripName}>{trip.name}</span>
              <span className={styles.dateSummary}>{dates.range}</span>
            </span>
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Button>
        </li>
      );
    })}
  </ol>
);
