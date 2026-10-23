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
import type { IJourneyEntry } from './journey-map-model';
import { useTripPlanningStore } from './use-trip-planning-store';
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
export const TripPlanning = ({ trip, onChange }: ITripPlanningProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<IJourneyEntry | null>(null);
  const store = useTripPlanningStore(trip, onChange);
  const editing = editingId ? store.byId.get(editingId) : undefined;
  const deleteEntry = (entry: IJourneyEntry) => {
    store.remove(entry);
    setDeleted(entry);
    setMessage(`${entry.item.name} deleted.`);
  };
  const [addingStop, setAddingStop] = useState(false);
  const [editingStop, setEditingStop] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const items = trip.planning ?? [];
  const duration = getDurationDays(trip);
  const addPlan = (category: TPlanningCategory, dayNumber?: number) => {
    const item: ITripPlanningItem = {
      id: crypto.randomUUID(),
      category,
      name: 'New plan',
      details: '',
      completed: false,
      status: PlanningStatus.Idea,
      ...(dayNumber ? { dayNumber } : {}),
    };
    store.save(item);
    setEditingId(item.id);
  };
  return (
    <section className={styles.planningWorkspace} aria-label="Trip Studio planning">
      <JourneyMap
        trip={trip}
        onEdit={(entry) => setEditingId(entry.item.id)}
        onDelete={deleteEntry}
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
              onClick={() => setEditingId(item.id)}
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
          key={editing.id}
          item={editing}
          tripDays={duration}
          allowDaySelection={editing.category !== 'accommodation'}
          title={
            editing.category === 'accommodation'
              ? 'Edit stay'
              : editing.category === 'transportation'
                ? 'Edit journey'
                : 'Edit plan'
          }
          onCancel={() => setEditingId(null)}
          onRemove={() => {
            deleteEntry(store.entry(editing.id) ?? { item: editing, saved: true, label: 'Plan' });
            setEditingId(null);
          }}
          onSave={(fields) => {
            if (!store.save({ ...editing, ...fields })) {
              return false;
            }
            setEditingId(null);
            setMessage('Plan saved.');
            return true;
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
      <div role="status" className={styles.muted}>
        <p>{message}</p>
        {deleted && (
          <Button
            variant={ButtonVariant.Quiet}
            onClick={() => {
              store.restore(deleted);
              setDeleted(null);
              setMessage('Block restored.');
            }}
          >
            Undo delete
          </Button>
        )}
      </div>
    </section>
  );
};
