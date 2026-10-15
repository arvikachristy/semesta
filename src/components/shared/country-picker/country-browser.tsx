import { useState } from 'react';
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

const filters = [
  { id: CountryFilter.All, label: 'All' },
  { id: CountryFilter.Visited, label: 'Been to' },
  { id: CountryFilter.Wishlist, label: 'Bucket list' },
];

export const CountryBrowser = (props: ICountryBrowserProps) => {
  const { state, onStateChange, visitedCountryIds, wishlistCountryIds, statuses } = props;
  const [message, setMessage] = useState('');
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
      countries: group.countries.filter(
        (country) =>
          matchesCountryQuery(country, state.query) &&
          (state.filter === CountryFilter.All ||
            (state.filter === CountryFilter.Visited
              ? visited.has(country.code)
              : wishlist.has(country.code))),
      ),
    }))
    .filter((group) => group.countries.length > 0);

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
              onClick={() => onStateChange({ ...state, filter: filter.id, selected: null })}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      <div className={styles.scroll}>
        {!visibleGroups.length && (
          <p className={styles.empty}>
            {total === 0
              ? 'There are no selectable country entries for this continent yet.'
              : state.query
                ? 'No countries match your search.'
                : state.filter === CountryFilter.Wishlist
                  ? 'Your next adventure starts here. Choose All, then save a country to your bucket list.'
                  : 'No visits added yet. Choose All to explore.'}
          </p>
        )}
        {visibleGroups.map((group) => (
          <section key={group.id} className={styles.group} aria-label={group.name}>
            {!state.continent && <h3>{group.name}</h3>}
            {(state.filter === CountryFilter.All
              ? [true, false]
              : [state.filter === CountryFilter.Visited]
            ).map((visitedSection) => {
              const entries = group.countries.filter(
                (country) =>
                  state.filter !== CountryFilter.All ||
                  visited.has(country.code) === visitedSection,
              );
              if (!entries.length) {
                return null;
              }
              return (
                <div key={String(visitedSection)}>
                  <p className={styles.sectionLabel}>
                    {state.filter === CountryFilter.Wishlist
                      ? 'On your bucket list'
                      : visitedSection
                        ? 'Been to'
                        : 'Still to explore'}
                  </p>
                  <div className={styles.grid}>
                    {entries.map((country) => (
                      <Button
                        key={country.code}
                        variant={ButtonVariant.Plain}
                        className={styles.tile}
                        aria-label={`Explore ${country.name}`}
                        aria-pressed={state.selected === country.code}
                        onClick={() => onStateChange({ ...state, selected: country.code })}
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
                        <span>{country.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
      {selected && (
        <footer className={styles.selection} aria-label="Country actions">
          <div className={styles.selectedHeading}>
            <img src={flagAssetPath(selected.code)} alt="" />
            <div>
              <h3>{selected.name}</h3>
              <p>
                {visited.has(selected.code) ? 'Been to' : 'Not visited'}
                {wishlist.has(selected.code) ? ' · On your bucket list' : ''}
              </p>
            </div>
          </div>
          {statuses[selected.code] === CountryStatus.Error && (
            <p role="alert">The flag could not load. Remove the visit and add it again to retry.</p>
          )}
          <div className={ui.actions}>
            <Button
              disabled={props.disabled}
              aria-pressed={visited.has(selected.code)}
              onClick={() => {
                props.onVisited(selected.code, !visited.has(selected.code));
                setMessage(
                  visited.has(selected.code)
                    ? `${selected.name} removed from Been to.`
                    : `${selected.name} added to Been to.`,
                );
              }}
            >
              {visited.has(selected.code) ? 'Remove visit' : 'Mark visited'}
            </Button>
            <Button
              disabled={props.disabled}
              aria-pressed={wishlist.has(selected.code)}
              onClick={() => {
                props.onWishlist(selected.code, !wishlist.has(selected.code));
                setMessage(
                  wishlist.has(selected.code)
                    ? `${selected.name} removed from your bucket list.`
                    : `${selected.name} saved to your bucket list.`,
                );
              }}
            >
              {wishlist.has(selected.code) ? 'Remove wish' : 'Save to bucket list'}
            </Button>
          </div>
          <Button
            variant={ButtonVariant.Primary}
            disabled={props.disabled}
            onClick={() => props.onPlan(selected.code)}
          >
            {selectedTrips.length ? 'Plan a new trip' : 'Plan a trip'}
          </Button>
          {selectedTrips.length > 0 && (
            <div className={styles.savedTrips}>
              <span>Saved trips</span>
              {selectedTrips.map((trip) => (
                <Button
                  variant={ButtonVariant.Quiet}
                  key={trip.id}
                  onClick={() => props.onOpenTrip(trip)}
                >
                  {trip.name} ›
                </Button>
              ))}
            </div>
          )}
        </footer>
      )}
      <p className={styles.live} role="status">
        {message}
      </p>
    </section>
  );
};
