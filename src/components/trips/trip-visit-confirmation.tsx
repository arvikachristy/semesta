import { useState } from 'react';
import type { CountryList } from '../../types/country';
import type { ITrip } from '../../types/trip';
import { countries } from '../../data/countries';
import { flagAssetPath } from '../../data/flag-definitions';
import { Overlay } from '../ui/overlay';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

interface ITripVisitConfirmationProps {
  trip: ITrip;
  visitedCountryIds: readonly CountryList[];
  onConfirm: (countries: CountryList[]) => void;
  onDismiss: () => void;
}
export const TripVisitConfirmation = ({
  trip,
  visitedCountryIds,
  onConfirm,
  onDismiss,
}: ITripVisitConfirmationProps) => {
  const [selected, setSelected] = useState<CountryList[]>(() => [...trip.countryIds]);
  return (
    <Overlay title="Which countries did you visit?" onDismiss={onDismiss}>
      <p>
        Confirm only the places you actually visited. New countries will drop into your glasses, and
        their wishes will be fulfilled.
      </p>
      <div className={styles.choices}>
        {trip.countryIds.map((id) => (
          <label key={id}>
            <input
              className={ui.checkbox}
              type="checkbox"
              checked={selected.includes(id)}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setSelected((current) =>
                  checked ? [...current, id] : current.filter((country) => country !== id),
                );
              }}
            />
            <img className={styles.visitFlag} src={flagAssetPath(id)} alt="" />
            <span>
              {countries[id].name}
              <small>
                {visitedCountryIds.includes(id)
                  ? 'Already in your glasses · record this trip too'
                  : 'A new country for your collection'}
              </small>
            </span>
          </label>
        ))}
      </div>
      <div className={ui.actions}>
        <Button onClick={onDismiss}>Not yet</Button>
        <Button
          variant={ButtonVariant.Primary}
          disabled={!selected.length}
          onClick={() => onConfirm(selected)}
        >
          Confirm visits
        </Button>
      </div>
    </Overlay>
  );
};
