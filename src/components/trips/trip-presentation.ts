import type { ITrip } from '../../types/trip';

const tripDateText = { undecided: 'Dates to decide', month: 'TBC', separator: ' – ' };
const toDate = (value: string) => new Date(`${value}T12:00:00`);
const format = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', options).format(toDate(value));

export const sortTrips = (trips: readonly ITrip[]) =>
  [...trips].sort((left, right) => {
    if (!left.startDate) {
      return right.startDate ? 1 : 0;
    }
    if (!right.startDate) {
      return -1;
    }
    return left.startDate.localeCompare(right.startDate);
  });

export const getTripDates = ({ startDate, endDate }: ITrip) => {
  const anchor = startDate || endDate;
  if (!anchor) {
    return { month: tripDateText.month, days: '—', range: tripDateText.undecided };
  }
  const full = (value: string) =>
    format(value, { day: 'numeric', month: 'short', year: 'numeric' });
  const sameMonth = startDate && endDate && startDate.slice(0, 7) === endDate.slice(0, 7);
  const differentDates = startDate && endDate && startDate !== endDate;
  return {
    month: format(anchor, { month: 'short' }),
    days:
      differentDates && sameMonth
        ? `${toDate(startDate).getDate()}${tripDateText.separator}${toDate(endDate).getDate()}`
        : String(toDate(anchor).getDate()),
    range: differentDates
      ? `${sameMonth ? toDate(startDate).getDate() : full(startDate)}${tripDateText.separator}${full(endDate)}`
      : startDate
        ? full(startDate)
        : `Until ${full(endDate)}`,
  };
};
