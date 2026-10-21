import type { ITrip } from '../../types/trip';
import type { ITripPlanningItem } from '../../types/trip-planning';
import {
  deletePlanningItem,
  restorePlanningItem,
  savePlanningItems,
} from '../../storage/trip-planning';
import { getJourneyMap } from './journey-map-model';
import type { IJourneyEntry } from './journey-map-model';
import { moveJourneyBlock } from './journey-blocks';

// A view over the existing useTrips store. No second persistent component state.
export const useTripPlanningStore = (trip: ITrip, onChange: (trip: ITrip) => void) => {
  const entries = getJourneyMap(trip);
  const byId = new Map((trip.planning ?? []).map((item) => [item.id, item]));
  for (const entry of entries) {
    byId.set(entry.item.id, {
      ...entry.item,
      ...(entry.day !== undefined ? { dayNumber: entry.day } : {}),
      ...(entry.endDay !== undefined ? { endDayNumber: entry.endDay } : {}),
    });
  }
  return {
    byId,
    entry: (id: string): IJourneyEntry | undefined => entries.find((entry) => entry.item.id === id),
    save: (item: ITripPlanningItem) => {
      const entry = entries.find((entry) => entry.item.id === item.id);
      let next = trip;
      const timingChanged =
        entry &&
        item.dayNumber !== undefined &&
        (item.dayNumber !== entry.day || item.endDayNumber !== entry.endDay);
      if (entry && timingChanged && item.dayNumber !== undefined) {
        next = moveJourneyBlock(trip, entry, item.dayNumber, item.endDayNumber ?? item.dayNumber);
        if (next === trip) {
          return false;
        }
        const moved = next.planning?.find((candidate) => candidate.id === item.id);
        if (moved && item.dateTime === entry.item.dateTime) {
          item = { ...item, dateTime: moved.dateTime };
        }
      }
      next = savePlanningItems(next, [item]);
      onChange({
        ...next,
        activePlanningCategories: [
          ...new Set([
            ...(trip.activePlanningCategories ?? []),
            ...(next.planning?.map((item) => item.category) ?? []),
          ]),
        ],
      });
      return true;
    },
    remove: (entry: IJourneyEntry) =>
      onChange(deletePlanningItem(trip, entry.item.id, entry.slotId)),
    restore: (entry: IJourneyEntry) =>
      onChange(restorePlanningItem(trip, entry.item, entry.saved, entry.slotId)),
  };
};
