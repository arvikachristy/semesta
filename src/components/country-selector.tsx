import { useEffect, useRef, useState } from 'react';
import { countryGroups } from '../data/countries';
import type { CountryList } from '../types/country';
import { CountryStatus } from '../types/country-status';

enum SelectorEvent {
  KeyDown = 'keydown',
  PointerDown = 'pointerdown',
}
const SelectorKey = { Escape: 'Escape' };
interface ICountrySelectorProps {
  showedCountries: readonly CountryList[];
  statuses: Partial<Record<CountryList, CountryStatus>>;
  onToggle: (country: CountryList, checked: boolean) => void;
}

export const CountrySelector = ({ showedCountries, statuses, onToggle }: ICountrySelectorProps) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === SelectorKey.Escape) {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener(SelectorEvent.PointerDown, outside);
    document.addEventListener(SelectorEvent.KeyDown, keyDown);
    return () => {
      document.removeEventListener(SelectorEvent.PointerDown, outside);
      document.removeEventListener(SelectorEvent.KeyDown, keyDown);
    };
  }, [open]);

  return (
    <div className="country-selector" ref={root}>
      <button
        type="button"
        ref={trigger}
        aria-expanded={open}
        aria-controls="country-checklist"
        onClick={() => setOpen((value) => !value)}
      >
        Countries <span>{showedCountries.length} selected</span>
        <span aria-hidden="true">{open ? '⌄' : '⌃'}</span>
      </button>
      {open && (
        <div className="country-checklist" id="country-checklist">
          {countryGroups.map((group) => (
            <fieldset key={group.id}>
              <legend>{group.name}</legend>
              {group.countries.map((country) => (
                <label className="country-option" key={country.code}>
                  <input
                    type="checkbox"
                    value={country.code}
                    checked={showedCountries.includes(country.code)}
                    onChange={(event) => onToggle(country.code, event.currentTarget.checked)}
                  />
                  <span>{country.name}</span>
                  {statuses[country.code] === CountryStatus.Loading &&
                    showedCountries.includes(country.code) && <small>Loading…</small>}
                  {statuses[country.code] === CountryStatus.Error && (
                    <small role="alert">Could not load. Check to retry.</small>
                  )}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
};
