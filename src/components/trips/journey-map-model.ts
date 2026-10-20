import type { ITrip } from '../../types/trip';
import type { ITripPlanningItem } from '../../types/trip-planning';
import { BookingTemplateId, PlanningStatus } from '../../types/trip-planning';
import {
  getDurationDays,
  getEssentialSlots,
  getTripStops,
  getFirstRouteBooking,
} from './trip-itinerary';

export interface IJourneyEntry {
  item: ITripPlanningItem;
  day?: number;
  endDay?: number;
  label: string;
  stopId?: string;
  saved: boolean;
}

export const getJourneyMap = (trip: ITrip): IJourneyEntry[] => {
  const duration = getDurationDays(trip);
  const saved = trip.planning ?? [];
  const items = [...saved, ...getEssentialSlots(trip)];
  if (
    !items.some(
      (item) => item.id === 'departure' || item.templateId === BookingTemplateId.ReturnFlight,
    )
  ) {
    items.push({
      id: 'departure',
      category: 'transportation',
      name: 'Journey home',
      details: '',
      completed: false,
      status: PlanningStatus.ToBook,
    });
  }
  let day = 1;
  const stops = getTripStops(trip).map((stop) => {
    const start = day;
    day += stop.nights;
    return { ...stop, start, end: day };
  });
  const legacyStay = getFirstRouteBooking(trip, 'accommodation');
  const legacyArrival = getFirstRouteBooking(trip, 'transportation');
  return items
    .filter((item) => item.category === 'accommodation' || item.category === 'transportation')
    .map((item) => {
      const stay = stops.find(
        (stop, index) =>
          item.id === `stay-${stop.id}` || (index === 0 && item.id === legacyStay?.id),
      );
      const transfer = stops.find((stop) => item.id === `journey-${stop.id}`);
      const departure =
        item.id === 'departure' || item.templateId === BookingTemplateId.ReturnFlight;
      const arrival =
        item.id === 'arrival' ||
        item.templateId === BookingTemplateId.OutboundFlight ||
        item.id === legacyArrival?.id;
      const datedDay =
        item.dateTime && trip.startDate
          ? Math.round(
              (Date.parse(item.dateTime.slice(0, 10)) - Date.parse(trip.startDate)) / 86400000,
            ) + 1
          : undefined;
      const candidate =
        (item.endDayNumber ? item.dayNumber : undefined) ??
        stay?.start ??
        datedDay ??
        item.dayNumber ??
        transfer?.start ??
        (departure ? duration : arrival ? 1 : undefined);
      const entryDay =
        candidate !== undefined && candidate >= 1 && candidate <= duration ? candidate : undefined;
      return {
        item,
        day: entryDay,
        endDay: item.endDayNumber ?? stay?.end,
        stopId: stay?.id,
        label: stay
          ? `${stay.name} · ${stay.nights} ${stay.nights === 1 ? 'night' : 'nights'}`
          : transfer
            ? 'Transfer'
            : departure
              ? 'Depart'
              : arrival
                ? 'Arrive'
                : item.category === 'accommodation'
                  ? 'Stay'
                  : 'Travel',
        saved: saved.some((existing) => existing.id === item.id),
      };
    });
};
