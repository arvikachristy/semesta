import { useAccount } from '../../account/account-context';
import { mobilePanelText } from '../../types/mobile-panel';
import type { IMobilePanelState } from '../../types/mobile-panel';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import { memo, useState } from 'react';
import { useTrips } from '../../hooks/use-trips';
import { TripEditor } from './trip-editor';
import { TripList } from './trip-list';
import styles from './trips.module.css';
import type { ITrip } from '../../types/trip';

const tripUi = { panelId: 'upcoming-trips-panel', newTrip: 'New trip' };
interface IUpcomingTripsProps {
  tripSession?: ReturnType<typeof useTrips>;
  mobilePanel?: IMobilePanelState;
  onOpenStudio: (trip: ITrip) => void;
  fullPage?: boolean;
}
export const UpcomingTrips = memo(
  ({ mobilePanel, onOpenStudio, tripSession, fullPage = false }: IUpcomingTripsProps) => {
    const localSession = useTrips(useAccount().trips, !tripSession);
    const { trips, ready, warning, saveTrip } = tripSession ?? localSession;
    const [desktopOpen, setOpen] = useState(false);
    const open = fullPage || (mobilePanel?.open ?? desktopOpen);
    const [creating, setCreating] = useState(false);
    return (
      <aside
        className={`${ui.surface} ${styles.panel}`}
        aria-label="Upcoming trips"
        data-mobile={Boolean(mobilePanel)}
        data-expanded={creating}
        data-editing={creating}
        data-full-page={fullPage}
      >
        <header className={styles.header}>
          <h2>
            {creating ? (
              'New trip'
            ) : fullPage ? (
              'Upcoming trips'
            ) : (
              <Button
                variant={ButtonVariant.Plain}
                className={styles.heading}
                aria-expanded={open}
                aria-controls={tripUi.panelId}
                onClick={() =>
                  mobilePanel ? mobilePanel.onClose() : setOpen((current) => !current)
                }
              >
                Upcoming trips
                <span className={styles.collapseIndicator} aria-hidden="true">
                  {open ? '⌄' : '⌃'}
                </span>
              </Button>
            )}
          </h2>
          {!creating && (
            <Button
              icon
              aria-label={tripUi.newTrip}
              title={tripUi.newTrip}
              disabled={!ready || creating}
              onClick={() => {
                setCreating(true);
                setOpen(true);
              }}
            >
              +
            </Button>
          )}
          {creating && !mobilePanel && (
            <Button
              icon
              aria-label="Cancel"
              title="Close new trip"
              variant={ButtonVariant.Quiet}
              onClick={() => setCreating(false)}
            >
              ×
            </Button>
          )}
          {mobilePanel && (
            <Button
              data-sheet-close
              variant={ButtonVariant.Quiet}
              onClick={mobilePanel.onClose}
              aria-label={mobilePanelText.close}
            >
              {creating ? '×' : mobilePanelText.closeLabel}
            </Button>
          )}
        </header>
        <div className={styles.body} id={tripUi.panelId} hidden={!open}>
          {warning && (
            <p role="status" className={styles.warning}>
              {warning}
            </p>
          )}
          {!ready ? (
            <p>Loading trips…</p>
          ) : creating ? (
            <TripEditor
              onCancel={() => setCreating(false)}
              onSave={(details) => {
                const id = saveTrip(null, details);
                if (id) {
                  setCreating(false);
                  onOpenStudio({ ...details, id, name: details.name.trim() });
                }
              }}
            />
          ) : trips.length ? (
            <TripList
              trips={trips}
              onSelect={(id) => {
                const trip = trips.find((item) => item.id === id);
                if (trip) {
                  onOpenStudio(trip);
                }
              }}
            />
          ) : (
            <p className={styles.empty}>No trips yet.</p>
          )}
        </div>
      </aside>
    );
  },
);
