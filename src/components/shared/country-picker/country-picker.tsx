import { memo, useMemo, useState } from 'react';
import { CountryStatus } from '../../../types/country-status';
import type { CountryList } from '../../../types/country';
import { countryGroups } from '../../../data/countries';
import { Button, ButtonVariant } from '../../ui/button';
import ui from '../../ui/ui.module.css';
import styles from './country-picker.module.css';
import { matchesCountryQuery, normalizeCountryQuery } from './country-search';

export const CountryPickerMode = {
  Checklist: 'checklist',
  Add: 'add',
} as const;
type TCountryPickerMode = (typeof CountryPickerMode)[keyof typeof CountryPickerMode];

const pickerText = {
  search: 'Search countries',
  emptyAdd: 'Search for a country to add it to this trip.',
  noResults: 'No countries found.',
  noEntries: 'No country entries in this continent.',
  loading: 'Loading…',
  loadError: 'Could not load. Untick and tick to retry.',
} as const;

export interface ICountryPickerProps {
  mode: TCountryPickerMode;
  selectedCountries: readonly CountryList[];
  statuses?: Partial<Record<CountryList, CountryStatus>>;
  disabled?: boolean;
  onToggle: (country: CountryList, checked: boolean) => void;
}

export const CountryPicker = memo(
  ({ mode, selectedCountries, statuses = {}, disabled = false, onToggle }: ICountryPickerProps) => {
    const [search, setSearch] = useState('');
    const query = normalizeCountryQuery(search);
    const selected = useMemo(() => new Set(selectedCountries), [selectedCountries]);
    const groups = useMemo(
      () =>
        countryGroups
          .map((group) => {
            const selectedCount = group.countries.filter((country) =>
              selected.has(country.code),
            ).length;
            return {
              ...group,
              selectedCount,
              totalCount: group.countries.length,
              countries: group.countries.filter((country) => {
                const matches = matchesCountryQuery(country, query);
                return (
                  matches && (mode === CountryPickerMode.Checklist || !selected.has(country.code))
                );
              }),
            };
          })
          .filter(
            (group) =>
              group.countries.length > 0 ||
              (mode === CountryPickerMode.Checklist && query.length === 0),
          ),
      [mode, query, selected],
    );
    const waitingForSearch = mode === CountryPickerMode.Add && query.length === 0;

    return (
      <div className={styles.picker} data-mode={mode}>
        <label className={ui.field}>
          {pickerText.search}
          <input
            className={ui.control}
            type="search"
            aria-label={pickerText.search}
            placeholder={pickerText.search}
            value={search}
            disabled={disabled}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </label>
        {waitingForSearch ? (
          <p className={styles.empty}>{pickerText.emptyAdd}</p>
        ) : groups.length === 0 ? (
          <p className={styles.empty}>{pickerText.noResults}</p>
        ) : (
          <div className={styles.groups}>
            {groups.map((group) => (
              <fieldset className={styles.group} key={group.id}>
                <legend>
                  <span>{group.name}</span>
                  <small aria-label={`${group.selectedCount} of ${group.totalCount} selected`}>
                    {group.selectedCount}/{group.totalCount}
                  </small>
                </legend>
                {group.countries.length === 0 && (
                  <p className={styles.empty}>{pickerText.noEntries}</p>
                )}
                {group.countries.map((country) =>
                  mode === CountryPickerMode.Checklist ? (
                    <label className={styles.option} key={country.code}>
                      <input
                        type="checkbox"
                        className={ui.checkbox}
                        value={country.code}
                        checked={selected.has(country.code)}
                        disabled={disabled}
                        onChange={(event) => onToggle(country.code, event.currentTarget.checked)}
                      />
                      <span>{country.name}</span>
                      {statuses[country.code] === CountryStatus.Loading &&
                        selected.has(country.code) && <small>{pickerText.loading}</small>}
                      {statuses[country.code] === CountryStatus.Error && (
                        <small role="alert">{pickerText.loadError}</small>
                      )}
                    </label>
                  ) : (
                    <Button
                      key={country.code}
                      variant={ButtonVariant.Plain}
                      className={styles.result}
                      disabled={disabled}
                      onClick={() => onToggle(country.code, true)}
                    >
                      {country.name}
                    </Button>
                  ),
                )}
              </fieldset>
            ))}
          </div>
        )}
      </div>
    );
  },
);
