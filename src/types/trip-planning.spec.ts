import { describe, expect, it } from 'vitest';
import { getPlanningProgress } from './trip-planning';
import type { ITripPlanningItem } from './trip-planning';

describe('trip readiness', () => {
  it('counts actual planned items, including essentials, without counting empty categories', () => {
    expect(getPlanningProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
    const items: ITripPlanningItem[] = [
      { id: 'flight', category: 'transportation', name: 'Flight', details: '', completed: true },
      { id: 'hotel', category: 'accommodation', name: 'Hotel', details: '', completed: false },
      { id: 'passport', category: 'essentials', name: 'Passport', details: '', completed: true },
    ];
    expect(getPlanningProgress(items)).toEqual({ completed: 2, total: 3, percent: 67 });
    expect(getPlanningProgress(items.map((item) => ({ ...item, completed: true })))).toEqual({
      completed: 3,
      total: 3,
      percent: 100,
    });
  });
});
