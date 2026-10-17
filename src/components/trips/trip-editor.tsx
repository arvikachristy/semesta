import { useState } from 'react';
import { countries } from '../../data/countries';
import { CountryPicker, CountryPickerMode } from '../shared/country-picker/country-picker';
import type { TTripDetails } from '../../types/trip';
import { Button, ButtonVariant } from '../ui/button';
import { createTripDetails, getDestination, getDurationDays, tripDuration } from './trip-itinerary';
import ui from '../ui/ui.module.css';
import styles from './trips.module.css';

interface ITripEditorProps {
  initial?: TTripDetails;
  onSave: (details: TTripDetails) => void;
  onCancel: () => void;
}

export const TripEditor = ({ initial, onSave, onCancel }: ITripEditorProps) => {
  const [destination, setDestination] = useState(initial ? getDestination(initial) : '');
  const [days, setDays] = useState(initial ? getDurationDays(initial) : tripDuration.defaultDays);
  const [dated, setDated] = useState(Boolean(initial?.startDate && initial.endDate));
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const duration =
    dated && startDate && endDate
      ? getDurationDays({
          ...(initial ?? { name: '', countryIds: [], notes: '' }),
          startDate,
          endDate,
        })
      : days;
  const allocated =
    initial?.stops && initial.stops.length > 1
      ? initial.stops.reduce((total, stop) => total + stop.nights, 0)
      : null;
  const invalidDuration =
    !Number.isInteger(duration) || duration < 1 || duration > tripDuration.maxDays;
  const allocationChanged = allocated !== null && duration - 1 !== allocated;
  return (
    <form
      className={styles.editor}
      onSubmit={(event) => {
        event.preventDefault();
        if (
          !destination.trim() ||
          invalidDuration ||
          allocationChanged ||
          (dated && (!startDate || !endDate))
        ) {
          return;
        }
        const details = createTripDetails(
          destination,
          duration,
          dated ? startDate : '',
          dated ? endDate : '',
        );
        onSave(
          initial
            ? {
                ...initial,
                ...details,
                name: name.trim() || details.name,
                notes,
                countryIds:
                  destination === getDestination(initial) ? initial.countryIds : details.countryIds,
                stops:
                  initial.stops?.length && initial.stops.length > 1
                    ? initial.stops
                    : [
                        {
                          id: initial.stops?.[0]?.id ?? 'first-stop',
                          name: destination.trim(),
                          nights: duration - 1,
                        },
                      ],
              }
            : details,
        );
      }}
    >
      <div className={styles.editorFields}>
        <CountryPicker
          mode={CountryPickerMode.Destination}
          selectedCountries={[]}
          searchValue={destination}
          onSearchChange={setDestination}
          label="Where do you want to go?"
          labelClassName={styles.question}
          onToggle={(country) => setDestination(countries[country].name)}
        />
        <fieldset className={styles.duration}>
          <legend className={styles.question}>How long?</legend>
          <div className={styles.durationModes}>
            <Button
              aria-pressed={!dated}
              variant={!dated ? ButtonVariant.Primary : ButtonVariant.Secondary}
              onClick={() => setDated(false)}
            >
              Days
            </Button>
            <Button
              aria-pressed={dated}
              variant={dated ? ButtonVariant.Primary : ButtonVariant.Secondary}
              onClick={() => setDated(true)}
            >
              Choose dates
            </Button>
          </div>
          {dated ? (
            <div className={styles.dates}>
              <label className={ui.field}>
                From
                <input
                  className={ui.control}
                  type="date"
                  required
                  aria-label="Departure date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.currentTarget.value)}
                />
              </label>
              <label className={ui.field}>
                Until
                <input
                  className={ui.control}
                  type="date"
                  required
                  aria-label="Return date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.currentTarget.value)}
                />
              </label>
            </div>
          ) : (
            <label className={ui.field}>
              Number of days
              <input
                className={ui.control}
                type="number"
                min={1}
                max={tripDuration.maxDays}
                required
                value={Number.isNaN(days) ? '' : days}
                onChange={(event) => setDays(event.currentTarget.valueAsNumber)}
              />
            </label>
          )}
        </fieldset>
        {allocationChanged && (
          <p role="alert">
            Your stops use {allocated} nights. Keep this trip at {allocated + 1} days so their
            allocations stay intact.
          </p>
        )}
        {initial && (
          <details className={styles.extraDetails}>
            <summary>More details</summary>
            <label className={ui.field}>
              Trip name
              <input
                className={ui.control}
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </label>
            <label className={ui.field}>
              Notes
              <textarea
                className={ui.control}
                maxLength={2000}
                value={notes}
                onChange={(event) => setNotes(event.currentTarget.value)}
              />
            </label>
          </details>
        )}
      </div>
      <div className={`${ui.actions} ${styles.editorActions}`}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant={ButtonVariant.Primary}
          type="submit"
          disabled={
            !destination.trim() ||
            invalidDuration ||
            allocationChanged ||
            (dated && (!startDate || !endDate))
          }
        >
          {initial ? 'Save trip' : 'Create trip'}
        </Button>
      </div>
    </form>
  );
};
