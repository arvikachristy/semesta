import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultCountries, toggleCountry } from '../data/countries';
import { glassParameters } from '../three/glasses/glass-parameters';
import type { CountryList } from '../types/country';
import { createLocalCountrySelectionRepository } from '../storage/country-selection';
import type { ICountrySelectionRepository } from '../storage/country-selection';

const localRepository = createLocalCountrySelectionRepository();

export const useCountrySelection = (repository: ICountrySelectionRepository = localRepository) => {
  const [showedCountries, setShowedCountries] = useState<CountryList[]>([]);
  const [ready, setReady] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const hydratedRepository = useRef<ICountrySelectionRepository | null>(null);
  useEffect(() => {
    let active = true;
    hydratedRepository.current = null;
    setReady(false);
    void repository
      .load()
      .catch(() => [...defaultCountries])
      .then((countries) => {
        if (active) {
          hydratedRepository.current = repository;
          setShowedCountries(countries);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (ready && hydratedRepository.current === repository) {
      // Preserve write order even if a future network adapter saves asynchronously.
      saveQueue.current = saveQueue.current
        .then(() => repository.save(showedCountries))
        .catch(() => {});
    }
  }, [ready, repository, showedCountries]);

  const onToggle = useCallback(
    (country: CountryList, checked: boolean) => {
      if (ready) {
        setShowedCountries((current) =>
          toggleCountry(current, country, checked, glassParameters.capacity),
        );
      }
    },
    [ready],
  );
  const onClear = useCallback(() => {
    if (ready) {
      setShowedCountries([]);
    }
  }, [ready]);
  return { showedCountries, ready, onToggle, onClear };
};
