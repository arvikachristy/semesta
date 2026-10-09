import { memo, useEffect, useRef, useState } from 'react';
import { countryGroups } from '../data/countries';
import type { CountryList } from '../types/country';
import { CountryStatus } from '../types/country-status';

enum SelectorEvent {
  KeyDown = 'keydown',
  PointerDown = 'pointerdown',
}
const SelectorKey = { Escape: 'Escape' };
const selectorText = { search: 'Search countries' };
interface ICountrySelectorProps {
  disabled?: boolean;
  showedCountries: readonly CountryList[];
  statuses: Partial<Record<CountryList, CountryStatus>>;
  onToggle: (country: CountryList, checked: boolean) => void;
}

export const CountrySelector = memo(
  ({ disabled = false, showedCountries, statuses, onToggle }: ICountrySelectorProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const query = search.trim().toLocaleLowerCase();
    const groups = countryGroups
      .map((group) => ({
        ...group,
        countries: group.countries.filter((country) =>
          `${country.name} ${country.code}`.toLocaleLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.countries.length > 0);
    const selected = new Set(showedCountries);
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
          disabled={disabled}
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
            <input
              className="country-search"
              type="search"
              aria-label={selectorText.search}
              placeholder={selectorText.search}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
            {groups.length === 0 && <p>No countries found.</p>}
            {groups.map((group) => (
              <fieldset key={group.id}>
                <legend>{group.name}</legend>
                {group.countries.map((country) => (
                  <label className="country-option" key={country.code}>
                    <input
                      type="checkbox"
                      value={country.code}
                      checked={selected.has(country.code)}
                      onChange={(event) => onToggle(country.code, event.currentTarget.checked)}
                    />
                    <span>{country.name}</span>
                    {statuses[country.code] === CountryStatus.Loading &&
                      selected.has(country.code) && <small>Loading…</small>}
                    {statuses[country.code] === CountryStatus.Error && (
                      <small role="alert">Could not load. Untick and tick to retry.</small>
                    )}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        )}
      </div>
    );
  },
);
