import { useAccount } from '../../account/account-context';
import { mobilePanelText } from '../../types/mobile-panel';
import type { IMobilePanelState } from '../../types/mobile-panel';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import { memo, useEffect, useState } from 'react';
import { useTrips } from '../../hooks/use-trips';
import { TripEditor } from './trip-editor';
import { TripList } from './trip-list';
import styles from './trips.module.css';
import type { ITrip } from '../../types/trip';

const tripUi = { panelId: 'upcoming-trips-panel', newTrip: 'New trip' };
interface IUpcomingTripsProps {
  tripSession?: ReturnType<typeof useTrips>;
  mobilePanel?: IMobilePanelState;
  desktopPanel?: IMobilePanelState;
  onOpenStudio: (trip: ITrip) => void;
  fullPage?: boolean;
}
export const UpcomingTrips = memo(
  ({
    mobilePanel,
    desktopPanel,
    onOpenStudio,
    tripSession,
    fullPage = false,
  }: IUpcomingTripsProps) => {
    const localSession = useTrips(useAccount().trips, !tripSession);
    const { trips, ready, warning, saveTrip } = tripSession ?? localSession;
    const [desktopOpen, setOpen] = useState(false);
    const open = fullPage || (mobilePanel?.open ?? desktopPanel?.open ?? desktopOpen);
    const sidebarOpen = Boolean(desktopPanel?.open);
    useEffect(() => {
      if (!sidebarOpen) {
        return;
      }
      const previous = document.activeElement;
      return () => {
        if (previous instanceof HTMLElement && previous.isConnected) {
          previous.focus();
        }
      };
    }, [sidebarOpen]);
    const [creating, setCreating] = useState(false);
    return (
      <aside
        className={`${ui.surface} ${styles.panel}`}
        aria-label="Upcoming trips"
        data-mobile={Boolean(mobilePanel)}
        data-expanded={creating}
        data-editing={creating}
        data-full-page={fullPage}
        data-sidebar={Boolean(desktopPanel)}
        hidden={Boolean(desktopPanel) && !open}
        onKeyDown={(event) => {
          if (desktopPanel && event.key === 'Escape') {
            desktopPanel.onClose();
          }
        }}
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
                  mobilePanel
                    ? mobilePanel.onClose()
                    : desktopPanel
                      ? desktopPanel.onClose()
                      : setOpen((current) => !current)
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
              onClick={() => {
                if (creating) {
                  setCreating(false);
                } else {
                  mobilePanel.onClose();
                }
              }}
              aria-label={creating ? 'Back to trips' : mobilePanelText.close}
            >
              {creating ? '‹ Back to trips' : mobilePanelText.closeLabel}
            </Button>
          )}
          {desktopPanel && !creating && (
            <Button
              icon
              variant={ButtonVariant.Quiet}
              aria-label="Close trips"
              onClick={desktopPanel.onClose}
            >
              ×
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
