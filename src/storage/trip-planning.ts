import type { ITrip } from '../types/trip';
import type { ITripPlanningItem } from '../types/trip-planning';
import { normalizePlanningItem } from '../types/trip-planning';

// One ID-based mutation path for booking forms, calendar gestures and Undo.
export const savePlanningItems = (trip: ITrip, updates: readonly ITripPlanningItem[]): ITrip => {
  const byId = new Map((trip.planning ?? []).map((item) => [item.id, item]));
  updates.forEach((item) => byId.set(item.id, normalizePlanningItem(item)));
  return {
    ...trip,
    planning: [...byId.values()],
    ...(trip.dismissedPlanningIds
      ? { dismissedPlanningIds: trip.dismissedPlanningIds.filter((id) => !byId.has(id)) }
      : {}),
  };
};

export const deletePlanningItem = (trip: ITrip, id: string, slotId?: string): ITrip => ({
  ...trip,
  planning: (trip.planning ?? []).filter((item) => item.id !== id),
  // Remember explicit deletion of a derived slot so it stays gone after reload.
  dismissedPlanningIds: [
    ...new Set([...(trip.dismissedPlanningIds ?? []), id, ...(slotId ? [slotId] : [])]),
  ],
});

export const restorePlanningItem = (
  trip: ITrip,
  item: ITripPlanningItem,
  saved: boolean,
  slotId?: string,
): ITrip => {
  const next = {
    ...trip,
    dismissedPlanningIds: (trip.dismissedPlanningIds ?? []).filter(
      (id) => id !== item.id && id !== slotId,
    ),
  };
  return saved ? savePlanningItems(next, [item]) : next;
};
