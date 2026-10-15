import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultCountries, toggleCountry } from '../data/countries';
import { glassParameters } from '../three/glasses/glass-parameters';
import type { CountryList } from '../types/country';
import { createLocalCountrySelectionRepository } from '../storage/country-selection';
import type { ICountrySelectionRepository } from '../storage/country-selection';

const localRepository = createLocalCountrySelectionRepository();

interface ICountrySelectionOptions {
  initialCountries?: readonly CountryList[];
  limit?: number;
}
export const useCountrySelection = (
  repository: ICountrySelectionRepository = localRepository,
  {
    initialCountries = defaultCountries,
    limit = glassParameters.capacity,
  }: ICountrySelectionOptions = {},
) => {
  const [showedCountries, setShowedCountries] = useState<CountryList[]>([]);
  const [ready, setReady] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const loadedValue = useRef<typeof showedCountries | null>(null);
  const hydratedRepository = useRef<ICountrySelectionRepository | null>(null);
  const usableReady = ready && hydratedRepository.current === repository;
  useEffect(() => {
    let active = true;
    hydratedRepository.current = null;
    setReady(false);
    void repository
      .load()
      .catch(() => [...initialCountries])
      .then((countries) => {
        if (active) {
          hydratedRepository.current = repository;
          loadedValue.current = countries;
          setShowedCountries(countries);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [repository, initialCountries]);

  useEffect(() => {
    if (
      ready &&
      hydratedRepository.current === repository &&
      showedCountries !== loadedValue.current
    ) {
      // Preserve write order even if a future network adapter saves asynchronously.
      saveQueue.current = saveQueue.current
        .then(() => repository.save(showedCountries))
        .catch(() => {});
    }
  }, [ready, repository, showedCountries]);

  const onToggle = useCallback(
    (country: CountryList, checked: boolean) => {
      if (usableReady) {
        setShowedCountries((current) => toggleCountry(current, country, checked, limit));
      }
    },
    [usableReady, limit],
  );
  const onClear = useCallback(() => {
    if (usableReady) {
      setShowedCountries([]);
    }
  }, [usableReady]);
  return { showedCountries, ready: usableReady, onToggle, onClear };
};
