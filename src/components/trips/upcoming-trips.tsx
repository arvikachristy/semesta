import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import { memo, useState } from 'react';
import { countries } from '../../data/countries';
import { useTrips } from '../../hooks/use-trips';
import { TripEditor } from './trip-editor';
import { TripList } from './trip-list';
import { getTripDates } from './trip-presentation';
import styles from './trips.module.css';

const tripUi = {
  panelId: 'upcoming-trips-panel',
  newEditorKey: 'new-trip',
  compactWidth: 600,
  newTrip: 'New trip',
};

export const UpcomingTrips = memo(() => {
  const { trips, ready, warning, saveTrip, removeTrip } = useTrips();
  const [open, setOpen] = useState(() => window.innerWidth > tripUi.compactWidth);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selected = trips.find((trip) => trip.id === selectedId);
  return (
    <aside className={`${ui.surface} ${styles.panel}`} aria-label="Upcoming trips">
      <header className={styles.header}>
        <h2>
          <Button
            variant={ButtonVariant.Plain}
            className={styles.heading}
            type="button"
            aria-expanded={open}
            aria-controls={tripUi.panelId}
            onClick={() => setOpen((current) => !current)}
          >
            Upcoming trips
            <span className={styles.collapseIndicator} aria-hidden="true">
              {open ? '⌄' : '⌃'}
            </span>
          </Button>
        </h2>
        <Button
          icon
          type="button"
          aria-label={tripUi.newTrip}
          title={tripUi.newTrip}
          disabled={!ready || editing}
          onClick={() => {
            setSelectedId(null);
            setDeleting(false);
            setEditing(true);
            setOpen(true);
          }}
        >
          +
        </Button>
      </header>
      <div className={styles.body} id={tripUi.panelId} hidden={!open}>
        {warning && (
          <p role="status" className={styles.warning}>
            {warning}
          </p>
        )}
        {!ready ? (
          <p>Loading trips…</p>
        ) : editing ? (
          <TripEditor
            key={selectedId ?? tripUi.newEditorKey}
            initial={selected}
            onCancel={() => setEditing(false)}
            onSave={(details) => {
              const id = saveTrip(selectedId, details);
              if (id) {
                setSelectedId(id);
                setEditing(false);
              }
            }}
          />
        ) : selected ? (
          <section className={styles.details} aria-label="Trip details">
            <Button
              variant={ButtonVariant.Quiet}
              className={styles.back}
              type="button"
              onClick={() => {
                setSelectedId(null);
                setDeleting(false);
              }}
            >
              ‹ All trips
            </Button>
            <h3>{selected.name}</h3>
            <p className={styles.dateSummary}>{getTripDates(selected).range}</p>
            <p>
              {selected.countryIds.map((id) => countries[id].name).join(' · ') ||
                'Destinations to decide'}
            </p>
            {selected.notes && <p className={styles.notes}>{selected.notes}</p>}
            {deleting ? (
              <div className={styles.deleteConfirmation} role="alert">
                <p>Delete this trip? Its details will be removed.</p>
                <div className={ui.actions}>
                  <Button type="button" onClick={() => setDeleting(false)}>
                    Keep trip
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      removeTrip(selected.id);
                      setSelectedId(null);
                      setDeleting(false);
                    }}
                  >
                    Delete trip
                  </Button>
                </div>
              </div>
            ) : (
              <div className={ui.actions}>
                <Button type="button" onClick={() => setEditing(true)}>
                  Edit trip
                </Button>
                <Button type="button" onClick={() => setDeleting(true)}>
                  Delete trip
                </Button>
              </div>
            )}
          </section>
        ) : trips.length ? (
          <TripList trips={trips} onSelect={setSelectedId} />
        ) : (
          <p className={styles.empty}>No trips yet.</p>
        )}
      </div>
    </aside>
  );
});
