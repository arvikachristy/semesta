export const StudioCategory = {
  Flights: 'flights',
  Accommodation: 'accommodation',
  Activities: 'activities',
  Restaurants: 'restaurants',
} as const;
export type TStudioCategory = (typeof StudioCategory)[keyof typeof StudioCategory];
export const BookingStatus = { Booked: 'Booked', Pending: 'To book', Idea: 'Idea' } as const;
export interface IStudioBooking {
  id: string;
  name: string;
  detail: string;
  status: (typeof BookingStatus)[keyof typeof BookingStatus];
}
export interface IStudioCategory {
  id: TStudioCategory;
  label: string;
  symbol: string;
  items: readonly IStudioBooking[];
}
export const studioCategories: readonly IStudioCategory[] = [
  {
    id: StudioCategory.Flights,
    label: 'Flights',
    symbol: '↗',
    items: [
      {
        id: 'outbound',
        name: 'The way there',
        detail: 'Outbound flight · Confirmation collected',
        status: BookingStatus.Booked,
      },
      {
        id: 'return',
        name: 'The way home',
        detail: 'Return flight · Find a time that feels right',
        status: BookingStatus.Pending,
      },
    ],
  },
  {
    id: StudioCategory.Accommodation,
    label: 'Accommodation',
    symbol: '⌂',
    items: [
      {
        id: 'stay',
        name: 'A place to settle in',
        detail: 'Your first stay · Reservation collected',
        status: BookingStatus.Booked,
      },
    ],
  },
  {
    id: StudioCategory.Activities,
    label: 'Activities',
    symbol: '✧',
    items: [
      {
        id: 'explore',
        name: 'A little local discovery',
        detail: 'A walking tour, a gallery, or something unexpected',
        status: BookingStatus.Idea,
      },
      {
        id: 'day-trip',
        name: 'A day further afield',
        detail: 'Leave a little room for adventure',
        status: BookingStatus.Pending,
      },
    ],
  },
  {
    id: StudioCategory.Restaurants,
    label: 'Restaurants',
    symbol: '◦',
    items: [
      {
        id: 'dinner',
        name: 'One memorable dinner',
        detail: 'A table worth making time for',
        status: BookingStatus.Idea,
      },
    ],
  },
];
export const previewParticipants = [
  { id: 'you', name: 'You', initials: 'Y' },
  { id: 'alex', name: 'Alex', initials: 'A' },
  { id: 'sam', name: 'Sam', initials: 'S' },
];
export const getStudioProgress = (items: readonly IStudioBooking[]) => {
  const booked = items.filter((item) => item.status === BookingStatus.Booked).length;
  return {
    booked,
    total: items.length,
    percent: items.length ? Math.round((booked / items.length) * 100) : 0,
  };
};
