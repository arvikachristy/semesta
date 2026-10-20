import type { ITrip } from '../../types/trip';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { PlanningStatus } from '../../types/trip-planning';
import { getDurationDays } from './trip-itinerary';
import { getJourneyMap } from './journey-map-model';
import type { IJourneyEntry } from './journey-map-model';

export type TBlockAction = 'move' | 'start' | 'end';
export const blockRange = (
  start: number,
  end: number,
  delta: number,
  action: TBlockAction,
  duration: number,
) => {
  if (action === 'start') {
    return { start: Math.max(1, Math.min(end - 1, start + delta)), end };
  }
  if (action === 'end') {
    return { start, end: Math.max(start + 1, Math.min(duration, end + delta)) };
  }
  const next = Math.max(1, Math.min(duration - (end - start), start + delta));
  return { start: next, end: next + end - start };
};
const saveItems = (trip: ITrip, items: ITripPlanningItem[]): ITrip => ({
  ...trip,
  planning: [
    ...(trip.planning ?? []).filter((item) => !items.some((next) => next.id === item.id)),
    ...items,
  ],
});
export const moveJourneyBlock = (
  trip: ITrip,
  entry: IJourneyEntry,
  start: number,
  end: number,
): ITrip => {
  const stay = entry.item.category === 'accommodation';
  const duration = getDurationDays(trip);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 1 ||
    start > duration ||
    (stay && (end <= start || end > duration))
  ) {
    return trip;
  }
  const item = { ...entry.item, dayNumber: start, ...(stay ? { endDayNumber: end } : {}) };
  if (item.dateTime && trip.startDate) {
    item.dateTime =
      new Date(Date.parse(trip.startDate) + (start - 1) * 86400000).toISOString().slice(0, 10) +
      item.dateTime.slice(10);
  }
  const updates: ITripPlanningItem[] = [item];
  if (stay) {
    for (const other of getJourneyMap(trip).filter(
      (candidate) =>
        candidate.item.category === 'accommodation' &&
        candidate.item.id !== entry.item.id &&
        candidate.day !== undefined &&
        candidate.endDay !== undefined,
    )) {
      const first = other.day ?? 1;
      const last = other.endDay ?? duration;
      if (start >= last || end <= first) {
        continue;
      }
      if (start <= first && end < last) {
        updates.push({ ...other.item, dayNumber: end, endDayNumber: last });
      } else if (start > first && end >= last) {
        updates.push({ ...other.item, dayNumber: first, endDayNumber: start });
      } else {
        return trip;
      }
    }
  }
  return saveItems(trip, updates);
};
export const addJourneyBlock = (
  trip: ITrip,
  category: 'accommodation' | 'transportation',
): ITrip => {
  const duration = getDurationDays(trip);
  if (category === 'accommodation' && duration < 2) {
    return trip;
  }
  const entries = getJourneyMap(trip).filter(
    (entry) =>
      entry.item.category === 'accommodation' &&
      entry.day !== undefined &&
      entry.endDay !== undefined,
  );
  const occupied = (day: number) =>
    entries.some((entry) => day >= (entry.day ?? 1) && day < (entry.endDay ?? 1));
  const free = Array.from({ length: duration - 1 }, (_, index) => index + 1).find(
    (day) => !occupied(day),
  );
  const longest = [...entries].sort(
    (a, b) => (b.endDay ?? 0) - (b.day ?? 0) - ((a.endDay ?? 0) - (a.day ?? 0)),
  )[0];
  if (
    category === 'accommodation' &&
    free === undefined &&
    longest &&
    (longest.endDay ?? 0) - (longest.day ?? 0) <= 1
  ) {
    return trip;
  }
  let start = free ?? 1;
  let end = start + 1;
  if (category === 'accommodation' && free !== undefined) {
    while (end < duration && !occupied(end)) {
      end += 1;
    }
  }
  const updates: ITripPlanningItem[] = [];
  if (
    category === 'accommodation' &&
    free === undefined &&
    longest &&
    (longest.endDay ?? 0) - (longest.day ?? 0) > 1
  ) {
    start = (longest.day ?? 1) + Math.ceil(((longest.endDay ?? duration) - (longest.day ?? 1)) / 2);
    end = longest.endDay ?? duration;
    updates.push({ ...longest.item, dayNumber: longest.day, endDayNumber: start });
  }
  updates.push({
    id: `${category === 'accommodation' ? 'stay-block' : 'journey-extra'}-${crypto.randomUUID()}`,
    category,
    name: category === 'accommodation' ? 'New stay' : 'New journey',
    details: '',
    completed: false,
    status: PlanningStatus.ToBook,
    dayNumber: category === 'accommodation' ? start : 1,
    ...(category === 'accommodation' ? { endDayNumber: end } : {}),
  });
  return saveItems(trip, updates);
};
