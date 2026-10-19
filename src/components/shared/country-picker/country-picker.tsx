import { memo, useId, useMemo, useRef, useState } from 'react';
import { CountryStatus } from '../../../types/country-status';
import type { CountryList } from '../../../types/country';
import { countryGroups } from '../../../data/countries';
import { flagAssetPath } from '../../../data/flag-definitions';
import { Button, ButtonVariant } from '../../ui/button';
import ui from '../../ui/ui.module.css';
import styles from './country-picker.module.css';
import { matchesCountryQuery, normalizeCountryQuery } from './country-search';

export const CountryPickerMode = {
  Checklist: 'checklist',
  Add: 'add',
  Destination: 'destination',
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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  label?: string;
  labelClassName?: string;
  onSearchActiveChange?: (active: boolean) => void;
}

export const CountryPicker = memo(
  ({
    mode,
    selectedCountries,
    statuses = {},
    disabled = false,
    onToggle,
    searchValue,
    onSearchChange,
    label = pickerText.search,
    labelClassName,
    onSearchActiveChange,
  }: ICountryPickerProps) => {
    const [localSearch, setSearch] = useState('');
    const search = searchValue ?? localSearch;
    const input = useRef<HTMLInputElement>(null);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const destinationMode = mode === CountryPickerMode.Destination;
    const requiredMessageId = useId();
    const missingDestination = destinationMode && !search.trim();
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
                return matches && (mode !== CountryPickerMode.Add || !selected.has(country.code));
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
    const suggestions = groups.flatMap((group) => group.countries).slice(0, 8);
    const setSearchActive = (active: boolean) => {
      setSuggestionsOpen(active);
      if (destinationMode) {
        onSearchActiveChange?.(active);
      }
    };
    const finishSearch = () => {
      setSearchActive(false);
      input.current?.blur();
    };
    const choose = (country: CountryList) => {
      onToggle(country, true);
      finishSearch();
    };

    return (
      <div
        className={styles.picker}
        data-mode={mode}
        data-searching={destinationMode && suggestionsOpen}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSearchActive(false);
          }
        }}
      >
        {destinationMode && suggestionsOpen && (
          <div className={styles.searchNavigation}>
            <Button variant={ButtonVariant.Quiet} aria-label="Back to trip" onClick={finishSearch}>
              ‹ Back to trip
            </Button>
          </div>
        )}
        <label className={ui.field}>
          <span className={labelClassName}>{label}</span>
          <span className={destinationMode ? styles.destinationControl : undefined}>
            {destinationMode && selectedCountries[0] && (
              <img
                className={styles.selectedFlag}
                src={flagAssetPath(selectedCountries[0])}
                alt=""
              />
            )}
            <input
              ref={input}
              className={ui.control}
              type="search"
              name={destinationMode ? 'destination' : undefined}
              required={destinationMode}
              aria-describedby={missingDestination ? requiredMessageId : undefined}
              maxLength={destinationMode ? 80 : undefined}
              aria-label={label}
              placeholder={destinationMode ? 'Country or city' : pickerText.search}
              value={search}
              disabled={disabled}
              autoComplete={destinationMode ? 'off' : undefined}
              data-has-flag={destinationMode && Boolean(selectedCountries[0])}
              onFocus={() => setSearchActive(true)}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                onSearchChange?.(event.currentTarget.value);
                setSearchActive(true);
              }}
              onKeyDown={(event) => {
                if (!destinationMode) {
                  return;
                }
                if (event.key === 'Escape' && suggestionsOpen) {
                  event.preventDefault();
                  event.stopPropagation();
                  finishSearch();
                }
                if (event.key === 'Enter' && suggestionsOpen && query && suggestions[0]) {
                  event.preventDefault();
                  choose(suggestions[0].code);
                } else if (event.key === 'Enter' && suggestionsOpen && query) {
                  event.preventDefault();
                  finishSearch();
                }
              }}
            />
            {destinationMode && (
              <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10" cy="10" r="6" />
                <path d="m15 15 6 6" />
              </svg>
            )}
          </span>
          {missingDestination && <small id={requiredMessageId}>This field is required</small>}
        </label>
        {destinationMode ? (
          suggestionsOpen && (
            <div className={styles.suggestions} role="region" aria-label="Country suggestions">
              {!query ? (
                <p className={styles.empty}>Type a country or city.</p>
              ) : suggestions.length ? (
                suggestions.map((country) => (
                  <Button
                    key={country.code}
                    variant={ButtonVariant.Plain}
                    className={styles.result}
                    onPointerDown={(event) => {
                      // Keep search focused until click selects the result. Safari may
                      // otherwise blur to the document and unmount suggestions first.
                      event.preventDefault();
                    }}
                    onClick={() => choose(country.code)}
                    disabled={disabled}
                  >
                    <img className={styles.flag} src={flagAssetPath(country.code)} alt="" />
                    {country.name}
                  </Button>
                ))
              ) : (
                <p className={styles.empty} role="status">
                  No countries found. You can keep this as a city.
                </p>
              )}
              {query &&
                !suggestions.some((country) => normalizeCountryQuery(country.name) === query) && (
                  <Button
                    className={styles.useDestination}
                    variant={ButtonVariant.Quiet}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={finishSearch}
                  >
                    Use “{search.trim()}”
                  </Button>
                )}
            </div>
          )
        ) : waitingForSearch ? (
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
