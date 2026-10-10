import { useCallback, useEffect, useRef, useState } from 'react';
import { createLocalTripRepository } from '../storage/trips';
import type { ITripRepository } from '../storage/trips';
import type { ITrip, TTripDetails } from '../types/trip';

const localRepository = createLocalTripRepository();
const tripMessages = {
  loadError: 'Saved trips could not be read. New changes will only last this session.',
  saveError: 'Could not save on this device. Your changes will only last this session.',
};

export const useTrips = (repository: ITripRepository = localRepository) => {
  const [trips, setTrips] = useState<ITrip[]>([]);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState('');
  const writableRepository = useRef<ITripRepository | null>(null);
  const saveQueue = useRef(Promise.resolve());
  const loadedValue = useRef<typeof trips | null>(null);
  useEffect(() => {
    let active = true;
    setReady(false);
    writableRepository.current = null;
    void repository
      .load()
      .then((stored) => {
        if (active) {
          loadedValue.current = stored;
          setTrips(stored);
          setWarning('');
          writableRepository.current = repository;
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setWarning(tripMessages.loadError);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [repository]);
  useEffect(() => {
    if (ready && writableRepository.current === repository && trips !== loadedValue.current) {
      saveQueue.current = saveQueue.current
        .then(() => repository.save(trips))
        .catch(() => {
          setWarning(tripMessages.saveError);
        });
    }
  }, [ready, repository, trips]);

  const saveTrip = useCallback(
    (id: string | null, details: TTripDetails) => {
      if (!ready) {
        return;
      }
      const trip: ITrip = { ...details, name: details.name.trim(), id: id ?? crypto.randomUUID() };
      setTrips((current) =>
        id === null ? [...current, trip] : current.map((item) => (item.id === id ? trip : item)),
      );
      return trip.id;
    },
    [ready],
  );
  const removeTrip = useCallback(
    (id: string) => {
      if (ready) {
        setTrips((current) => current.filter((trip) => trip.id !== id));
      }
    },
    [ready],
  );
  return { trips, ready, warning, saveTrip, removeTrip };
};
