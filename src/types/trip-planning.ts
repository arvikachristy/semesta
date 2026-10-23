export const planningCategories = {
  transportation: 'Transportation',
  accommodation: 'Accommodation',
  activities: 'Activities',
  restaurants: 'Restaurants',
  essentials: 'Travel essentials',
} as const;

export type TPlanningCategory = keyof typeof planningCategories;
export const PlanningStatus = { Idea: 'idea', ToBook: 'to-book', Booked: 'booked' } as const;
export type TPlanningStatus = (typeof PlanningStatus)[keyof typeof PlanningStatus];
export const BookingTemplateId = {
  OutboundFlight: 'outbound-flight',
  ReturnFlight: 'return-flight',
  Stay: 'stay',
} as const;
export type TBookingTemplateId = (typeof BookingTemplateId)[keyof typeof BookingTemplateId];

export interface ITripPlanningItem {
  id: string;
  category: TPlanningCategory;
  name: string;
  details: string;
  completed: boolean;
  status?: TPlanningStatus;
  templateId?: TBookingTemplateId;
  dateTime?: string;
  bookingReference?: string;
  link?: string;
  dayNumber?: number;
  endDayNumber?: number;
}

export const isPlanningStatus = (value: unknown): value is TPlanningStatus =>
  Object.values(PlanningStatus).some((status) => status === value);
export const isBookingTemplateId = (value: unknown): value is TBookingTemplateId =>
  Object.values(BookingTemplateId).some((id) => id === value);
export const isBookingLink = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  if (!value) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};
export const isBookingDateTime = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  if (!value) {
    return true;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value;
};
export const getPlanningStatus = (item: ITripPlanningItem): TPlanningStatus =>
  item.status ?? (item.completed ? PlanningStatus.Booked : PlanningStatus.ToBook);
export const normalizePlanningItem = (item: ITripPlanningItem): ITripPlanningItem => {
  const status = getPlanningStatus(item);
  return { ...item, status, completed: status === PlanningStatus.Booked };
};
export const planningStatusLabel = (status: TPlanningStatus, category: TPlanningCategory) =>
  status === PlanningStatus.Booked
    ? category === 'essentials'
      ? 'Ready'
      : 'Booked'
    : status === PlanningStatus.ToBook
      ? category === 'essentials'
        ? 'To prepare'
        : 'To book'
      : 'Idea';

export const isPlanningCategory = (value: unknown): value is TPlanningCategory =>
  typeof value === 'string' && Object.hasOwn(planningCategories, value);

export const isTripPlanningItem = (value: unknown): value is ITripPlanningItem =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  value.id.length > 0 &&
  'category' in value &&
  isPlanningCategory(value.category) &&
  'name' in value &&
  typeof value.name === 'string' &&
  value.name.trim().length > 0 &&
  'details' in value &&
  typeof value.details === 'string' &&
  'completed' in value &&
  typeof value.completed === 'boolean' &&
  (!('status' in value) || isPlanningStatus(value.status)) &&
  (!('templateId' in value) || isBookingTemplateId(value.templateId)) &&
  (!('dateTime' in value) || isBookingDateTime(value.dateTime)) &&
  (!('bookingReference' in value) || typeof value.bookingReference === 'string') &&
  (!('link' in value) || isBookingLink(value.link)) &&
  (!('endDayNumber' in value) ||
    (typeof value.endDayNumber === 'number' &&
      Number.isInteger(value.endDayNumber) &&
      'dayNumber' in value &&
      typeof value.dayNumber === 'number' &&
      value.endDayNumber > value.dayNumber &&
      value.endDayNumber <= 365)) &&
  (!('dayNumber' in value) ||
    (typeof value.dayNumber === 'number' &&
      Number.isInteger(value.dayNumber) &&
      value.dayNumber >= 1 &&
      value.dayNumber <= 365));

export const getPlanningProgress = (
  items: readonly ITripPlanningItem[],
  activeCategories?: readonly TPlanningCategory[],
) => {
  const activeItems = activeCategories
    ? items.filter((item) => activeCategories.includes(item.category))
    : items;
  const completed = activeItems.filter(
    (item) => getPlanningStatus(item) === PlanningStatus.Booked,
  ).length;
  return {
    completed,
    total: activeItems.length,
    percent: activeItems.length ? Math.round((completed / activeItems.length) * 100) : 0,
  };
};
