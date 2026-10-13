import { Button, ButtonVariant } from '../ui/button';
import { flagAssetPath } from '../../data/flag-definitions';
import type { ITrip } from '../../types/trip';
import { getPlanningProgress } from '../../types/trip-planning';
import { getTripDates, sortTrips } from './trip-presentation';
import styles from './trips.module.css';

interface ITripListProps {
  trips: readonly ITrip[];
  onSelect: (id: string) => void;
}

const maximumFlagSlices = 6;

export const TripList = ({ trips, onSelect }: ITripListProps) => (
  <ol className={styles.timeline} aria-label="Planned trips">
    {sortTrips(trips).map((trip) => {
      const dates = getTripDates(trip);
      const visibleCountries = trip.countryIds.slice(0, maximumFlagSlices);
      const planning = trip.planning ?? [];
      const activeCategories = trip.activePlanningCategories ?? [
        ...new Set(planning.map((item) => item.category)),
      ];
      const progress = getPlanningProgress(planning, activeCategories);
      const remaining = progress.total - progress.completed;
      const subtitle =
        progress.total === 0
          ? 'Start planning'
          : remaining === 0
            ? 'All tracked bookings confirmed'
            : `${remaining} thing${remaining === 1 ? '' : 's'} left to book`;
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
              {visibleCountries.map((country, index) => (
                <img
                  key={country}
                  src={flagAssetPath(country)}
                  alt=""
                  loading="lazy"
                  style={{
                    maskImage: `conic-gradient(from ${index * (360 / visibleCountries.length)}deg, black 0deg ${360 / visibleCountries.length}deg, transparent ${360 / visibleCountries.length}deg 360deg)`,
                  }}
                />
              ))}
            </span>
            <span className={styles.tripSummary}>
              <span className={styles.tripName}>{trip.name}</span>
              <span className={styles.dateSummary}>{dates.range}</span>
              <span className={styles.tripPlanning}>
                <progress
                  className={styles.tripProgress}
                  aria-label={
                    progress.total
                      ? `${trip.name} planning progress`
                      : `${trip.name} has no tracked bookings`
                  }
                  value={progress.completed}
                  max={progress.total || 1}
                />
                {progress.total > 0 && (
                  <small className={styles.tripPercent}>{progress.percent}%</small>
                )}
              </span>
              <small className={styles.tripPlanningSubtitle}>{subtitle}</small>
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
