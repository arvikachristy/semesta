export const planningCategories = {
  transportation: 'Transportation',
  accommodation: 'Accommodation',
  activities: 'Activities',
  restaurants: 'Restaurants',
  essentials: 'Travel essentials',
} as const;

export type TPlanningCategory = keyof typeof planningCategories;

export interface ITripPlanningItem {
  id: string;
  category: TPlanningCategory;
  name: string;
  details: string;
  completed: boolean;
}

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
  typeof value.completed === 'boolean';

export const getPlanningProgress = (items: readonly ITripPlanningItem[]) => {
  const completed = items.filter((item) => item.completed).length;
  return {
    completed,
    total: items.length,
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
  };
};
