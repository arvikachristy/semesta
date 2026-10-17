import { useState } from 'react';
import type { ITrip } from '../../types/trip';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import {
  destinationCountries,
  getTripStops,
  splitLastStop,
  updateTripStop,
} from './trip-itinerary';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface ITripStopEditorProps {
  trip: ITrip;
  stopId?: string;
  onCancel: () => void;
  onSave: (trip: ITrip) => void;
}
export const TripStopEditor = ({ trip, stopId, onCancel, onSave }: ITripStopEditorProps) => {
  const stops = getTripStops(trip);
  const last = stops.at(-1);
  const editing = stops.find((stop) => stop.id === stopId);
  const [name, setName] = useState(editing?.name ?? '');
  const [nights, setNights] = useState(
    editing?.nights ?? Math.max(1, Math.floor((last?.nights ?? 0) / 2)),
  );
  const canSplit = Boolean(editing || (last && last.nights >= 2));
  const preview = stopId
    ? updateTripStop(trip, stopId, name, nights)
    : splitLastStop(trip, name, nights);
  const valid = Boolean(preview);
  return (
    <Overlay title={editing ? 'Edit stop' : 'Add a stop'} onDismiss={onCancel}>
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault();
          const next = preview;
          if (!next) {
            return;
          }
          onSave({
            ...trip,
            stops: next,
            countryIds: [...new Set([...trip.countryIds, ...destinationCountries(name)])],
          });
        }}
      >
        {canSplit ? (
          <>
            <label className={ui.field}>
              {editing ? 'Where?' : 'Where next?'}
              <input
                className={ui.control}
                required
                maxLength={80}
                placeholder="Country or city"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </label>
            <label className={ui.field}>
              How many nights?
              <input
                className={ui.control}
                required
                type="number"
                min={editing && stops.length === 1 ? 0 : 1}
                max={
                  editing
                    ? stops.reduce((total, stop) => total + stop.nights, 0) - stops.length + 1
                    : (last?.nights ?? 1) - 1
                }
                disabled={Boolean(editing && stops.length === 1)}
                value={Number.isNaN(nights) ? '' : nights}
                onChange={(event) => setNights(event.currentTarget.valueAsNumber)}
              />
            </label>
            {valid && (
              <section className={styles.routePreview} aria-label="Updated route">
                <h3>Your updated route</h3>
                <ol>
                  {preview?.map((stop) => (
                    <li key={stop.id}>
                      {stop.name} · {stop.nights} nights
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <p className={styles.dateSummary}>
              {editing
                ? 'Changing nights adjusts the neighbouring stop. The total trip length stays the same.'
                : `Nights come from ${last?.name}. A stay and a connecting journey will be added.`}
            </p>
            {trip.planning?.some((item) => item.category === 'accommodation') && (
              <p role="note">
                Existing reservations stay unchanged. Check their dates against the new route.
              </p>
            )}
          </>
        ) : (
          <p>
            You need at least two nights in your last stop to split it. Edit the trip duration or
            add a separate journey instead.
          </p>
        )}
        <div className={ui.actions}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant={ButtonVariant.Primary} disabled={!valid}>
            Update trip
          </Button>
        </div>
      </form>
    </Overlay>
  );
};
