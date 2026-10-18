import { useState } from 'react';
import { countries } from '../../data/countries';
import { CountryPicker, CountryPickerMode } from '../shared/country-picker/country-picker';
import type { TTripDetails } from '../../types/trip';
import { Button, ButtonVariant } from '../ui/button';
import {
  createTripDetails,
  destinationCountries,
  getDestination,
  getDurationDays,
  tripDuration,
} from './trip-itinerary';
import { DayDial } from './day-dial';
import { DateRangeCalendar } from './date-range-calendar';
import { addDays, rangeDays } from './date-range';
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
          selectedCountries={destinationCountries(destination)}
          searchValue={destination}
          onSearchChange={setDestination}
          label="Where next?"
          labelClassName={styles.destinationQuestion}
          onToggle={(country) => setDestination(countries[country].name)}
        />
        <fieldset className={styles.duration}>
          <legend className={styles.question}>How long?</legend>
          <div className={styles.durationModes}>
            <Button
              aria-pressed={!dated}
              variant={!dated ? ButtonVariant.Primary : ButtonVariant.Secondary}
              onClick={() => {
                if (startDate && endDate) {
                  setDays(rangeDays(startDate, endDate));
                }
                setDated(false);
              }}
            >
              Days
            </Button>
            <Button
              aria-pressed={dated}
              variant={dated ? ButtonVariant.Primary : ButtonVariant.Secondary}
              onClick={() => setDated(true)}
            >
              Dates
            </Button>
          </div>
          {dated ? (
            <DateRangeCalendar
              start={startDate}
              end={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                if (start && end) {
                  setDays(rangeDays(start, end));
                }
              }}
            />
          ) : (
            <>
              <DayDial
                value={days}
                onChange={(value) => {
                  setDays(value);
                  if (
                    startDate &&
                    endDate &&
                    Number.isInteger(value) &&
                    value >= 1 &&
                    value <= tripDuration.maxDays
                  ) {
                    setEndDate(addDays(startDate, value - 1));
                  }
                }}
              />
              <p className={styles.flexibleDates}>
                <span aria-hidden="true">▦</span>
                <span>Dates flexible</span>
              </p>
            </>
          )}
          {dated && (
            <Button
              className={styles.flexibleDates}
              onClick={() => {
                setDated(false);
                setStartDate('');
                setEndDate('');
              }}
            >
              Keep dates flexible
            </Button>
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
      <div className={styles.setupFooter}>
        <p className={styles.tripPreview} aria-live="polite">
          {destination.trim() || 'Your next trip'} ·{' '}
          {invalidDuration ? 'Choose a duration' : `${duration} ${duration === 1 ? 'day' : 'days'}`}
        </p>
        <div className={ui.actions}>
          {initial && <Button onClick={onCancel}>Cancel</Button>}
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
            {initial ? 'Save trip' : 'Create trip →'}
          </Button>
        </div>
      </div>
    </form>
  );
};
