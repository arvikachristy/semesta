import { useState } from 'react';
import type { ITrip } from '../../types/trip';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { getPlanningStatus, PlanningStatus, planningStatusLabel } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { BookingEditor } from './booking-editor';
import { getDurationDays } from './trip-itinerary';
import { JourneyMap } from './journey-map';
import { addJourneyBlock, moveJourneyBlock } from './journey-blocks';
import { TripStopEditor } from './trip-stop-editor';
import { getJourneyMap } from './journey-map-model';
import styles from './trip-studio.module.css';

export const initialPlanningCategories: TPlanningCategory[] = [
  'transportation',
  'accommodation',
  'activities',
];
interface ITripPlanningProps {
  trip: ITrip;
  onChange: (trip: ITrip) => void;
}
interface IEditingPlan {
  item: ITripPlanningItem;
  saved: boolean;
}
export const TripPlanning = ({ trip, onChange }: ITripPlanningProps) => {
  const [editing, setEditing] = useState<IEditingPlan | null>(null);
  const [addingStop, setAddingStop] = useState(false);
  const [editingStop, setEditingStop] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const items = trip.planning ?? [];
  const duration = getDurationDays(trip);
  const addPlan = (category: TPlanningCategory, dayNumber?: number) => {
    setEditing({
      saved: false,
      item: {
        id: crypto.randomUUID(),
        category,
        name: '',
        details: '',
        completed: false,
        status: PlanningStatus.Idea,
        ...(dayNumber ? { dayNumber } : {}),
      },
    });
  };
  return (
    <section className={styles.planningWorkspace} aria-label="Trip Studio planning">
      <JourneyMap
        trip={trip}
        onEdit={(entry) => setEditing({ item: entry.item, saved: entry.saved })}
        onAddTravel={() => {
          onChange(addJourneyBlock(trip, 'transportation'));
          setMessage('Journey added. Drag to move or tap to edit.');
        }}
        onAddStop={() => {
          const next = addJourneyBlock(trip, 'accommodation');
          onChange(next);
          setMessage(
            next === trip
              ? 'Every night already has its own stay. Resize an existing block first.'
              : 'Stay added. Drag to move or pull an edge to resize.',
          );
        }}
        onMove={(entry, start, end) => {
          const next = moveJourneyBlock(trip, entry, start, end);
          onChange(next);
          setMessage(
            next === trip
              ? 'That would cover an entire stay. Shorten or move the other stay first.'
              : 'Timing updated. Check any existing reservations against your new plan.',
          );
        }}
        onEditStop={(id) => {
          setEditingStop(id);
          setAddingStop(true);
        }}
      />
      <details className={styles.morePlans}>
        <summary>Other plans</summary>
        <Button
          variant={ButtonVariant.Quiet}
          onClick={() => {
            setEditingStop(undefined);
            setAddingStop(true);
          }}
        >
          Add a stop
        </Button>
        {items
          .filter((item) => item.category !== 'transportation' && item.category !== 'accommodation')
          .map((item) => (
            <Button
              key={item.id}
              className={styles.planRow}
              variant={ButtonVariant.Quiet}
              onClick={() => setEditing({ item, saved: true })}
            >
              <span>
                {item.name}
                {item.dayNumber ? ` · Day ${item.dayNumber}` : ''}
              </span>
              <small>{planningStatusLabel(getPlanningStatus(item), item.category)} ›</small>
            </Button>
          ))}
        <Button variant={ButtonVariant.Quiet} onClick={() => addPlan('activities', 1)}>
          ＋ Add a plan
        </Button>
      </details>
      {editing && (
        <BookingEditor
          item={editing.item}
          tripDays={duration}
          allowDaySelection={editing.item.category !== 'accommodation'}
          title={
            editing.saved
              ? 'Edit plan'
              : editing.item.category === 'transportation'
                ? 'Add transport'
                : editing.item.category === 'accommodation'
                  ? 'Add stay'
                  : 'Add a plan'
          }
          onCancel={() => setEditing(null)}
          onRemove={
            editing.saved
              ? () => {
                  const entry = getJourneyMap(trip).find(
                    (candidate) => candidate.item.id === editing.item.id,
                  );
                  const keepRange = entry?.stopId && editing.item.endDayNumber;
                  onChange({
                    ...trip,
                    planning: keepRange
                      ? items.map((item) =>
                          item.id === editing.item.id
                            ? {
                                id: editing.item.id,
                                category: 'accommodation',
                                name: 'Stay to plan',
                                details: '',
                                completed: false,
                                status: PlanningStatus.ToBook,
                                dayNumber: entry.day,
                                endDayNumber: entry.endDay,
                              }
                            : item,
                        )
                      : items.filter((item) => item.id !== editing.item.id),
                  });
                  setEditing(null);
                  setMessage(
                    keepRange
                      ? 'Booking removed. Your planned stay range is kept.'
                      : 'Plan removed.',
                  );
                }
              : undefined
          }
          onSave={(fields) => {
            const next = { ...editing.item, ...fields };
            onChange({
              ...trip,
              planning: editing.saved
                ? items.map((item) => (item.id === next.id ? next : item))
                : [...items, next],
              activePlanningCategories: [
                ...new Set([
                  ...initialPlanningCategories,
                  ...items.map((item) => item.category),
                  next.category,
                ]),
              ],
            });
            setEditing(null);
            setMessage('Plan saved.');
          }}
        />
      )}
      {addingStop && (
        <TripStopEditor
          trip={trip}
          stopId={editingStop}
          onCancel={() => setAddingStop(false)}
          onSave={(next) => {
            onChange(next);
            setAddingStop(false);
            setMessage('Route updated. Review any existing stay dates against your updated route.');
          }}
        />
      )}
      <p role="status" className={styles.muted}>
        {message}
      </p>
    </section>
  );
};
