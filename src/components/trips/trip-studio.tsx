import { useEffect, useRef } from 'react';
import type { ITrip } from '../../types/trip';
import { countries } from '../../data/countries';
import { flagAssetPath } from '../../data/flag-definitions';
import { Button, ButtonVariant } from '../ui/button';
import { getTripDates } from './trip-presentation';
import { useAccount } from '../../account/account-context';
import { useTrips } from '../../hooks/use-trips';
import { TripPlanning } from './trip-planning';
import styles from './trip-studio.module.css';

interface ITripStudioProps {
  tripSession?: ReturnType<typeof useTrips>;
  trip: ITrip;
  onBack: () => void;
}
export const TripStudio = ({ trip, onBack, tripSession }: ITripStudioProps) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const localSession = useTrips(useAccount().trips, !tripSession);
  const { trips, ready, warning, saveTrip } = tripSession ?? localSession;
  const currentTrip = trips.find((saved) => saved.id === trip.id) ?? trip;
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section className={styles.studio} aria-label="Trip Studio">
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <Button variant={ButtonVariant.Quiet} onClick={onBack}>
            ‹ Back to collection
          </Button>
          <span className={styles.eyebrow}>Trip Studio</span>
        </header>
        <div className={styles.introduction}>
          <div>
            <p className={styles.eyebrow}>Your next chapter</p>
            <h1 ref={heading} tabIndex={-1}>
              {trip.name}
            </h1>
            <div className={styles.destinations}>
              {trip.countryIds.map((id) => (
                <span key={id}>
                  <img src={flagAssetPath(id)} alt="" />
                  {countries[id].name}
                </span>
              ))}
              {!trip.countryIds.length && <span>Destinations to decide</span>}
            </div>
            <p className={styles.dates}>{getTripDates(trip).range}</p>
          </div>
        </div>
        {warning && <p role="status">{warning}</p>}
        {ready ? (
          <TripPlanning
            key={currentTrip.id}
            items={currentTrip.planning ?? []}
            activeCategories={currentTrip.activePlanningCategories}
            onChange={(planning) => saveTrip(currentTrip.id, { ...currentTrip, planning })}
            onCategoriesChange={(activePlanningCategories) =>
              saveTrip(currentTrip.id, { ...currentTrip, activePlanningCategories })
            }
          />
        ) : (
          <p>Loading trip planning…</p>
        )}
      </div>
    </section>
  );
};
