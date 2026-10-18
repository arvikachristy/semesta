import { countries, countryIds } from '../../data/countries';
import type { ITrip, ITripStop, TTripDetails } from '../../types/trip';
import { emptyTripDetails } from '../../types/trip';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { PlanningStatus } from '../../types/trip-planning';
import { normalizeCountryQuery } from '../shared/country-picker/country-search';
import { rangeDays } from './date-range';

export const tripDuration = { defaultDays: 7, maxDays: 365 };
export const getDurationDays = (trip: TTripDetails) => {
  if (trip.startDate && trip.endDate) {
    return rangeDays(trip.startDate, trip.endDate);
  }
  return trip.durationDays ?? tripDuration.defaultDays;
};
export const getDestination = (trip: TTripDetails) =>
  trip.destination || trip.countryIds.map((id) => countries[id].name).join(' & ') || trip.name;
export const getTripStops = (trip: ITrip): ITripStop[] =>
  trip.stops?.length
    ? trip.stops
    : [{ id: 'first-stop', name: getDestination(trip), nights: getDurationDays(trip) - 1 }];

export const destinationCountries = (destination: string) =>
  countryIds.filter((id) => {
    const country = countries[id];
    return [country.name, country.code, ...(country.aliases ?? [])].some(
      (name) => normalizeCountryQuery(name) === normalizeCountryQuery(destination),
    );
  });

export const createTripDetails = (
  destination: string,
  durationDays: number,
  startDate = '',
  endDate = '',
): TTripDetails => ({
  ...emptyTripDetails,
  name: destination.trim(),
  destination: destination.trim(),
  countryIds: destinationCountries(destination),
  durationDays,
  startDate,
  endDate,
  stops: [{ id: crypto.randomUUID(), name: destination.trim(), nights: durationDays - 1 }],
});

// Slots are presentation defaults, never invented reservations in persisted data.
export const getEssentialSlots = (trip: ITrip): ITripPlanningItem[] => {
  const stops = getTripStops(trip);
  const items = trip.planning ?? [];
  const slot = (
    id: string,
    category: ITripPlanningItem['category'],
    name: string,
  ): ITripPlanningItem => ({
    id,
    category,
    name,
    details: '',
    completed: false,
    status: PlanningStatus.ToBook,
  });
  const slots: ITripPlanningItem[] = [];
  if (
    !items.some((item) => item.category === 'transportation' && !item.id.startsWith('journey-'))
  ) {
    slots.push(slot('arrival', 'transportation', `Transport to ${getDestination(trip)}`));
  }
  stops.forEach((stop, index) => {
    const stayId = `stay-${stop.id}`;
    if (
      stop.nights > 0 &&
      !items.some(
        (item) =>
          item.id === stayId ||
          (index === 0 && item.category === 'accommodation' && !item.id.startsWith('stay-')),
      )
    ) {
      slots.push(slot(stayId, 'accommodation', `Stay in ${stop.name}`));
    }
    const journeyId = `journey-${stop.id}`;
    if (index > 0 && !items.some((item) => item.id === journeyId)) {
      slots.push(slot(journeyId, 'transportation', `${stops[index - 1].name} → ${stop.name}`));
    }
  });
  return slots;
};

export const splitLastStop = (trip: ITrip, name: string, nights: number): ITripStop[] | null => {
  const stops = getTripStops(trip);
  const last = stops.at(-1);
  if (!last || !name.trim() || !Number.isInteger(nights) || nights < 1 || nights >= last.nights) {
    return null;
  }
  return [
    ...stops.slice(0, -1),
    { ...last, nights: last.nights - nights },
    { id: crypto.randomUUID(), name: name.trim(), nights },
  ];
};

export const updateTripStop = (
  trip: ITrip,
  stopId: string,
  name: string,
  nights: number,
): ITripStop[] | null => {
  const stops = getTripStops(trip);
  const index = stops.findIndex((stop) => stop.id === stopId);
  const stop = stops[index];
  const neighbourIndex = index === stops.length - 1 ? index - 1 : index + 1;
  const neighbour = stops[neighbourIndex];
  if (
    !stop ||
    !name.trim() ||
    !Number.isInteger(nights) ||
    nights < 0 ||
    (!neighbour && nights !== stop.nights) ||
    (neighbour && (nights < 1 || neighbour.nights + stop.nights - nights < 1))
  ) {
    return null;
  }
  return stops.map((current, currentIndex) =>
    currentIndex === index
      ? { ...current, name: name.trim(), nights }
      : currentIndex === neighbourIndex
        ? { ...current, nights: current.nights + stop.nights - nights }
        : current,
  );
};
