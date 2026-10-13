import type { ITrip } from '../../types/trip';
import { BookingTemplateId } from '../../types/trip-planning';
import type {
  ITripPlanningItem,
  TBookingTemplateId,
  TPlanningCategory,
} from '../../types/trip-planning';

export interface IBookingSuggestion {
  id: TBookingTemplateId;
  category: TPlanningCategory;
  title: string;
  dateLabel: string;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  );

const stayDates = ({ startDate, endDate }: ITrip) => {
  if (startDate && endDate) {
    if (startDate === endDate) {
      return formatDate(startDate);
    }
    if (startDate.slice(0, 7) === endDate.slice(0, 7)) {
      return `${Number(startDate.slice(8))}–${formatDate(endDate)}`;
    }
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `Until ${formatDate(endDate)}`;
  }
  return 'Dates to decide';
};

export const getBookingSuggestions = (trip: ITrip): IBookingSuggestion[] => [
  {
    id: BookingTemplateId.OutboundFlight,
    category: 'transportation',
    title: 'Outbound flight',
    dateLabel: trip.startDate ? formatDate(trip.startDate) : 'Date to decide',
  },
  {
    id: BookingTemplateId.ReturnFlight,
    category: 'transportation',
    title: 'Return flight',
    dateLabel: trip.endDate ? formatDate(trip.endDate) : 'Date to decide',
  },
  {
    id: BookingTemplateId.Stay,
    category: 'accommodation',
    title: 'Your stay',
    dateLabel: stayDates(trip),
  },
];

const legacyNames: Record<TBookingTemplateId, readonly string[]> = {
  [BookingTemplateId.OutboundFlight]: ['outbound flight', 'departure flight', 'flight out'],
  [BookingTemplateId.ReturnFlight]: ['return flight', 'inbound flight', 'flight home'],
  [BookingTemplateId.Stay]: ['your stay', 'hotel', 'accommodation', 'stay'],
};

const normalizedName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

export const findSuggestedBooking = (
  items: readonly ITripPlanningItem[],
  suggestion: IBookingSuggestion,
  trip: ITrip,
): ITripPlanningItem | undefined => {
  const sameCategory = items.filter((item) => item.category === suggestion.category);
  const bound = sameCategory.find((item) => item.templateId === suggestion.id);
  if (bound) {
    return bound;
  }
  const unbound = sameCategory.filter((item) => !item.templateId);
  const named = unbound.filter((item) =>
    legacyNames[suggestion.id].includes(normalizedName(item.name)),
  );
  if (named.length === 1) {
    return named[0];
  }
  if (suggestion.id === BookingTemplateId.Stay) {
    return unbound.length === 1 ? unbound[0] : undefined;
  }
  const date = suggestion.id === BookingTemplateId.OutboundFlight ? trip.startDate : trip.endDate;
  if (!date || trip.startDate === trip.endDate) {
    return undefined;
  }
  const matchingFlights = unbound.filter(
    (item) => /\bflight\b/i.test(item.name) && item.dateTime?.slice(0, 10) === date,
  );
  return matchingFlights.length === 1 ? matchingFlights[0] : undefined;
};
