import { useEffect, useRef, useState } from 'react';
import type { ITrip } from '../../types/trip';
import { countries } from '../../data/countries';
import { flagAssetPath } from '../../data/flag-definitions';
import { Button, ButtonVariant } from '../ui/button';
import { getTripDates } from './trip-presentation';
import { useAccount } from '../../account/account-context';
import { useTrips } from '../../hooks/use-trips';
import { TripPlanning } from './trip-planning';
import { TripJourney } from './trip-journey';
import { TripParticipants } from './trip-participants';
import { TripEditor } from './trip-editor';
import { Overlay } from '../ui/overlay';
import ui from '../ui/ui.module.css';
import tripStyles from './trips.module.css';
import styles from './trip-studio.module.css';

interface ITripStudioProps {
  tripSession?: ReturnType<typeof useTrips>;
  trip: ITrip;
  onBack: () => void;
  onTrips?: () => void;
}
export const TripStudio = ({ trip, onBack, onTrips, tripSession }: ITripStudioProps) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const localSession = useTrips(useAccount().trips, !tripSession);
  const { trips, ready, warning, saveTrip, removeTrip } = tripSession ?? localSession;
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
          <div>
            {onTrips && (
              <Button variant={ButtonVariant.Quiet} onClick={onTrips}>
                All trips
              </Button>
            )}
            <span className={styles.eyebrow}>Trip Studio</span>
            <details ref={menu} className={styles.tripMenu}>
              <summary>More</summary>
              <div className={`${ui.surface} ${ui.raised} ${styles.menuActions}`}>
                <Button
                  variant={ButtonVariant.Quiet}
                  disabled={!ready}
                  onClick={() => {
                    if (menu.current) {
                      menu.current.open = false;
                    }
                    setEditing(true);
                  }}
                >
                  Edit trip
                </Button>
                <Button
                  variant={ButtonVariant.Quiet}
                  disabled={!ready}
                  onClick={() => {
                    if (menu.current) {
                      menu.current.open = false;
                    }
                    setDeleting(true);
                  }}
                >
                  Delete trip
                </Button>
              </div>
            </details>
          </div>
        </header>
        <div className={styles.introduction}>
          <div>
            <p className={styles.eyebrow}>Your next chapter</p>
            <h1 ref={heading} tabIndex={-1}>
              {currentTrip.name}
            </h1>
            <div className={styles.destinations}>
              {currentTrip.countryIds.map((id) => (
                <span key={id}>
                  <img src={flagAssetPath(id)} alt="" />
                  {countries[id].name}
                </span>
              ))}
              {!currentTrip.countryIds.length && <span>Destinations to decide</span>}
            </div>
            <p className={styles.dates}>{getTripDates(currentTrip).range}</p>
            {currentTrip.notes && (
              <details>
                <summary>Trip notes</summary>
                <p className={tripStyles.notes}>{currentTrip.notes}</p>
              </details>
            )}
          </div>
          {ready && (
            <TripParticipants
              participants={currentTrip.participants ?? []}
              onChange={(participants) =>
                saveTrip(currentTrip.id, { ...currentTrip, participants })
              }
            />
          )}
        </div>
        {warning && <p role="status">{warning}</p>}
        {ready ? (
          <TripPlanning
            key={currentTrip.id}
            trip={currentTrip}
            journey={<TripJourney trip={currentTrip} />}
            items={currentTrip.planning ?? []}
            activeCategories={
              currentTrip.activePlanningCategories ?? [
                ...new Set((currentTrip.planning ?? []).map((item) => item.category)),
              ]
            }
            onChange={(planning, activePlanningCategories) =>
              saveTrip(currentTrip.id, {
                ...currentTrip,
                planning,
                ...(activePlanningCategories ? { activePlanningCategories } : {}),
              })
            }
            onCategoriesChange={(activePlanningCategories) =>
              saveTrip(currentTrip.id, { ...currentTrip, activePlanningCategories })
            }
          />
        ) : (
          <p>Loading trip planning…</p>
        )}
        {editing && (
          <Overlay title="Edit trip" onDismiss={() => setEditing(false)}>
            <TripEditor
              initial={currentTrip}
              onCancel={() => setEditing(false)}
              onSave={(details) => {
                const { name, countryIds, startDate, endDate, notes } = details;
                const id = saveTrip(currentTrip.id, {
                  ...currentTrip,
                  name,
                  countryIds,
                  startDate,
                  endDate,
                  notes,
                });
                if (id) {
                  setEditing(false);
                }
              }}
            />
          </Overlay>
        )}
        {deleting && (
          <Overlay title="Delete trip" onDismiss={() => setDeleting(false)}>
            <p>Delete {currentTrip.name}? Its trip details and bookings will be removed.</p>
            <div className={ui.actions}>
              <Button onClick={() => setDeleting(false)}>Keep trip</Button>
              <Button
                variant={ButtonVariant.Primary}
                onClick={() => {
                  removeTrip(currentTrip.id);
                  setDeleting(false);
                  onBack();
                }}
              >
                Delete trip
              </Button>
            </div>
          </Overlay>
        )}
      </div>
    </section>
  );
};
