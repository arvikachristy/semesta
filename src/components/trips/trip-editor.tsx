import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import { useState } from 'react';
import { countries } from '../../data/countries';
import { emptyTripDetails } from '../../types/trip';
import type { TTripDetails } from '../../types/trip';
import { CountryPicker, CountryPickerMode } from '../shared/country-picker/country-picker';
import styles from './trips.module.css';

interface ITripEditorProps {
  initial?: TTripDetails;
  onSave: (details: TTripDetails) => void;
  onCancel: () => void;
}

const fieldLimits = { name: 80, notes: 2000 };
const fieldLabels = { destinations: 'Destinations' };

export const TripEditor = ({ initial = emptyTripDetails, onSave, onCancel }: ITripEditorProps) => {
  const [draft, setDraft] = useState<TTripDetails>(() => ({
    ...initial,
    countryIds: [...initial.countryIds],
  }));
  const update = (changes: Partial<TTripDetails>) =>
    setDraft((current) => ({ ...current, ...changes }));
  return (
    <form
      className={styles.editor}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <div className={styles.editorFields}>
        <label className={ui.field}>
          Trip name
          <input
            className={ui.control}
            required
            maxLength={fieldLimits.name}
            value={draft.name}
            placeholder="Give this trip a name"
            onChange={(event) => update({ name: event.currentTarget.value })}
          />
        </label>
        <div className={styles.dates}>
          <label className={ui.field}>
            From
            <input
              className={ui.control}
              type="date"
              aria-label="Departure date"
              value={draft.startDate}
              max={draft.endDate || undefined}
              onChange={(event) => update({ startDate: event.currentTarget.value })}
            />
          </label>
          <label className={ui.field}>
            Until
            <input
              className={ui.control}
              type="date"
              aria-label="Return date"
              value={draft.endDate}
              min={draft.startDate || undefined}
              onChange={(event) => update({ endDate: event.currentTarget.value })}
            />
          </label>
        </div>
        <div className={ui.field}>
          <span>{fieldLabels.destinations}</span>
          <details className={styles.countryPicker}>
            <summary className={`${ui.control} ${styles.countryPickerTrigger}`}>
              Add a country…
            </summary>
            <CountryPicker
              mode={CountryPickerMode.Add}
              selectedCountries={draft.countryIds}
              onToggle={(country, checked) =>
                update({
                  countryIds: checked
                    ? [...draft.countryIds, country]
                    : draft.countryIds.filter((selected) => selected !== country),
                })
              }
            />
          </details>
        </div>
        {draft.countryIds.length > 0 && (
          <ul className={styles.destinations} aria-label="Trip destinations">
            {draft.countryIds.map((id) => (
              <li key={id}>
                <span>{countries[id].name}</span>
                <Button
                  type="button"
                  variant={ButtonVariant.Quiet}
                  icon
                  aria-label={`Remove ${countries[id].name}`}
                  onClick={() =>
                    update({ countryIds: draft.countryIds.filter((country) => country !== id) })
                  }
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        )}
        <label className={ui.field}>
          Notes
          <textarea
            className={ui.control}
            rows={4}
            maxLength={fieldLimits.notes}
            value={draft.notes}
            placeholder="Places, bookings, things to remember…"
            onChange={(event) => update({ notes: event.currentTarget.value })}
          />
        </label>
      </div>
      <div className={`${ui.actions} ${styles.editorActions}`}>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={ButtonVariant.Primary} type="submit" disabled={!draft.name.trim()}>
          Save trip
        </Button>
      </div>
    </form>
  );
};
