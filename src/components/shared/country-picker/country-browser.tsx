import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { countries, countryGroups } from '../../../data/countries';
import { flagAssetPath } from '../../../data/flag-definitions';
import { continents } from '../../../three/glasses/continents';
import { CountryStatus } from '../../../types/country-status';
import type { CountryList } from '../../../types/country';
import type { ITrip } from '../../../types/trip';
import { Button, ButtonVariant } from '../../ui/button';
import ui from '../../ui/ui.module.css';
import { CountryFilter } from './country-browser-state';
import type { ICountryBrowserState } from './country-browser-state';
import { matchesCountryQuery } from './country-search';
import styles from './country-browser.module.css';

export interface ICountryBrowserProps {
  state: ICountryBrowserState;
  onStateChange: (state: ICountryBrowserState) => void;
  visitedCountryIds: readonly CountryList[];
  wishlistCountryIds: readonly CountryList[];
  trips: readonly ITrip[];
  statuses: Partial<Record<CountryList, CountryStatus>>;
  disabled: boolean;
  onVisited: (country: CountryList, visited: boolean) => void;
  onWishlist: (country: CountryList, saved: boolean) => void;
  onPlan: (country: CountryList) => void;
  onOpenTrip: (trip: ITrip) => void;
  onClose: () => void;
}

interface ICountryChange {
  country: CountryList;
  visited: boolean;
  wishlist: boolean;
  mode: typeof CountryFilter.Visited | typeof CountryFilter.Wishlist;
  message: string;
}

const filters = [
  { id: CountryFilter.Visited, label: 'Been to' },
  { id: CountryFilter.Wishlist, label: 'Bucket list' },
];

export const CountryBrowser = (props: ICountryBrowserProps) => {
  const { state, onStateChange, visitedCountryIds, wishlistCountryIds, statuses } = props;
  const [change, setChange] = useState<ICountryChange | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const visited = new Set(visitedCountryIds);
  const wishlist = new Set(wishlistCountryIds);
  const continent = continents.find((item) => item.id === state.continent);
  const groups = countryGroups.filter((group) => !state.continent || group.id === state.continent);
  const total = groups.reduce((count, group) => count + group.countries.length, 0);
  const count = groups.reduce(
    (sum, group) => sum + group.countries.filter((country) => visited.has(country.code)).length,
    0,
  );
  const selected = state.selected ? countries[state.selected] : null;
  const selectedId = state.selected;
  const selectedTrips = selectedId
    ? props.trips.filter((trip) => trip.countryIds.includes(selectedId))
    : [];
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      countries: group.countries.filter((country) => matchesCountryQuery(country, state.query)),
    }))
    .filter((group) => group.countries.length > 0);

  const activeChange = change?.country === state.selected ? change : null;
  const wishlistMode = state.filter === CountryFilter.Wishlist;
  const keepSearchFocus = (event: PointerEvent<HTMLButtonElement>) => {
    // Avoid moving the tapped control before its click completes.
    if (document.activeElement === searchInput.current) {
      event.preventDefault();
    }
  };
  const toggleCountry = (country: CountryList) => {
    searchInput.current?.blur();
    const wasVisited = visited.has(country);
    const wasSaved = wishlist.has(country);
    onStateChange({ ...state, selected: country });
    if (wishlistMode) {
      props.onWishlist(country, !wasSaved);
    } else {
      props.onVisited(country, !wasVisited);
    }
    setChange({
      country,
      visited: wasVisited,
      wishlist: wasSaved,
      mode: state.filter,
      message: wishlistMode
        ? `${countries[country].name} ${wasSaved ? 'removed from' : 'saved to'} your bucket list.`
        : `${countries[country].name} ${wasVisited ? 'removed from' : 'added to'} Been to.`,
    });
  };
  const undo = () => {
    if (!activeChange) {
      return;
    }
    if (activeChange.mode === CountryFilter.Visited) {
      props.onVisited(activeChange.country, activeChange.visited);
    }
    // Restores a fulfilled wish too, after the visit callback has cleared it.
    props.onWishlist(activeChange.country, activeChange.wishlist);
    setChange(null);
  };

  return (
    <section className={styles.browser} aria-label="Country collection">
      <header className={styles.header}>
        {continent && (
          <div className={styles.thumbnail} aria-hidden="true">
            <img src={continent.artwork} alt="" />
          </div>
        )}
        <div className={styles.heading}>
          <h2>{continent?.name ?? 'Your countries'}</h2>
          <p>
            {count} {count === 1 ? 'country' : 'countries'} visited
            {total > 0 ? ` · ${Math.round((count / total) * 100)}%` : ''}
          </p>
          {total > 0 && <progress aria-label="Countries visited" value={count} max={total} />}
        </div>
        <Button
          variant={ButtonVariant.Quiet}
          icon
          aria-label="Close countries"
          onClick={props.onClose}
        >
          ×
        </Button>
      </header>
      <div className={styles.controls}>
        <label className={ui.field}>
          Search countries
          <input
            ref={searchInput}
            className={ui.control}
            type="search"
            value={state.query}
            placeholder="Search countries"
            onChange={(event) => onStateChange({ ...state, query: event.currentTarget.value })}
          />
        </label>
        <label className={ui.field}>
          Continent
          <select
            aria-label="Continent"
            className={ui.control}
            value={state.continent ?? ''}
            onChange={(event) => {
              const next = continents.find((item) => item.id === event.currentTarget.value);
              onStateChange({ ...state, continent: next?.id ?? null, selected: null });
            }}
          >
            <option value="">All continents</option>
            {continents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.filters} aria-label="Country filters">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={state.filter === filter.id ? ButtonVariant.Primary : ButtonVariant.Quiet}
              aria-pressed={state.filter === filter.id}
              onPointerDown={keepSearchFocus}
              onClick={() => {
                setChange(null);
                onStateChange({ ...state, filter: filter.id });
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      <p className={styles.instruction}>
        {wishlistMode ? 'Tap countries you’d love to visit' : 'Tap countries you’ve visited'}
      </p>
      <div className={styles.scroll}>
        {!visibleGroups.length && (
          <p className={styles.empty}>
            {total === 0
              ? 'There are no selectable country entries for this continent yet.'
              : 'No countries match your search.'}
          </p>
        )}
        {visibleGroups.map((group) => (
          <section key={group.id} className={styles.group} aria-label={group.name}>
            {!state.continent && <h3>{group.name}</h3>}
            <div className={styles.grid}>
              {group.countries.map((country) => {
                const checked = wishlistMode
                  ? wishlist.has(country.code)
                  : visited.has(country.code);
                return (
                  <Button
                    key={country.code}
                    variant={ButtonVariant.Secondary}
                    className={styles.tile}
                    disabled={props.disabled}
                    aria-label={
                      wishlistMode
                        ? `${checked ? 'Remove' : 'Save'} ${country.name} ${checked ? 'from' : 'to'} bucket list`
                        : checked
                          ? `Remove ${country.name} from Been to`
                          : `Mark ${country.name} visited`
                    }
                    aria-pressed={checked}
                    onPointerDown={keepSearchFocus}
                    onClick={() => toggleCountry(country.code)}
                  >
                    <span className={styles.flag}>
                      <img src={flagAssetPath(country.code)} alt="" loading="lazy" />
                      {visited.has(country.code) && (
                        <span className={styles.marker} aria-label="Visited">
                          ✓
                        </span>
                      )}
                      {wishlist.has(country.code) && (
                        <span className={styles.wishMarker} aria-label="On bucket list">
                          ◇
                        </span>
                      )}
                    </span>
                    <span className={styles.name}>{country.name}</span>
                    <span className={styles.continent}>{group.name}</span>
                  </Button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {selected && (
        <footer className={styles.selection} aria-label="Country actions">
          <div className={styles.feedback}>
            <p role="status">
              {activeChange?.message ??
                `${selected.name} · ${visited.has(selected.code) ? 'Been to' : 'Not visited'}${wishlist.has(selected.code) ? ' · On your bucket list' : ''}`}
            </p>
            {activeChange && (
              <Button disabled={props.disabled} onClick={undo}>
                Undo
              </Button>
            )}
            <Button
              variant={ButtonVariant.Primary}
              disabled={props.disabled}
              onClick={() => props.onPlan(selected.code)}
            >
              {selectedTrips.length ? 'Plan a new trip' : 'Plan trip'}
            </Button>
          </div>
          {statuses[selected.code] === CountryStatus.Error && (
            <p role="alert">The flag could not load. Remove the visit and add it again to retry.</p>
          )}
          {selectedTrips.length > 0 && (
            <details className={styles.savedTrips}>
              <summary>Trips ({selectedTrips.length})</summary>
              {selectedTrips.map((trip) => (
                <Button
                  variant={ButtonVariant.Quiet}
                  key={trip.id}
                  onClick={() => props.onOpenTrip(trip)}
                >
                  {trip.name} ›
                </Button>
              ))}
            </details>
          )}
        </footer>
      )}
    </section>
  );
};
