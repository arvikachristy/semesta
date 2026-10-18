import { useState } from 'react';
import type { ITrip } from '../../types/trip';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { getPlanningStatus, PlanningStatus, planningStatusLabel } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { BookingEditor } from './booking-editor';
import { getDestination, getDurationDays, getEssentialSlots, getTripStops } from './trip-itinerary';
import { TripStopEditor } from './trip-stop-editor';
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
  const slots = getEssentialSlots(trip);
  const essentials = [
    ...items.filter(
      (item) => item.category === 'transportation' || item.category === 'accommodation',
    ),
    ...slots,
  ];
  const stops = getTripStops(trip);
  const duration = getDurationDays(trip);
  const destination = getDestination(trip);
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
      <section aria-label="Your essentials">
        <h2>Your essentials</h2>
        <div className={styles.essentials}>
          {essentials.map((item) => {
            const saved = items.some((existing) => existing.id === item.id);
            const stop = stops.find((candidate) => item.id === `stay-${candidate.id}`);
            return (
              <Button
                key={item.id}
                className={styles.essential}
                variant={ButtonVariant.Secondary}
                onClick={() => setEditing({ item, saved })}
              >
                <span className={styles.essentialIcon} aria-hidden="true">
                  {item.category === 'transportation' ? '↗' : '⌂'}
                </span>
                <span className={styles.essentialText}>
                  <span>{item.name}</span>
                  <small>
                    {stop ? `${stop.nights} ${stop.nights === 1 ? 'night' : 'nights'} · ` : ''}
                    {saved
                      ? planningStatusLabel(getPlanningStatus(item), item.category)
                      : 'Not added yet'}
                  </small>
                </span>
                <span className={styles.cardAction}>
                  {saved
                    ? 'Edit'
                    : item.category === 'transportation'
                      ? 'Add transport'
                      : 'Add stay'}{' '}
                  <span aria-hidden="true">›</span>
                </span>
              </Button>
            );
          })}
        </div>
        <details className={styles.morePlans}>
          <summary>More journeys or stays</summary>
          <div className={styles.inlineActions}>
            <Button variant={ButtonVariant.Quiet} onClick={() => addPlan('transportation')}>
              ＋ Add another journey
            </Button>
            <Button variant={ButtonVariant.Quiet} onClick={() => addPlan('accommodation')}>
              ＋ Add another stay
            </Button>
          </div>
        </details>
      </section>
      <section className={styles.routeSection} aria-label="Your route">
        {stops.length > 0 && (
          <ol className={styles.stopList}>
            {stops.map((stop) => (
              <li key={stop.id}>
                <Button
                  variant={ButtonVariant.Quiet}
                  onClick={() => {
                    setEditingStop(stop.id);
                    setAddingStop(true);
                  }}
                >
                  {stop.name}
                </Button>
                <small>{stop.nights} nights</small>
              </li>
            ))}
          </ol>
        )}
        <Button
          variant={ButtonVariant.Quiet}
          onClick={() => {
            setEditingStop(undefined);
            setAddingStop(true);
          }}
        >
          ＋ Add a stop
        </Button>
      </section>
      <section aria-label="Your itinerary">
        <h2>Your itinerary</h2>
        <div className={styles.dayList}>
          {Array.from({ length: duration }, (_, index) => {
            const day = index + 1;
            let elapsed = 0;
            const stop =
              stops.find((candidate) => {
                elapsed += candidate.nights;
                return day <= elapsed;
              }) ?? stops.at(-1);
            const dayItems = items.filter(
              (item) =>
                item.dayNumber === day &&
                item.category !== 'transportation' &&
                item.category !== 'accommodation',
            );
            return (
              <details key={day} className={styles.day}>
                <summary>
                  <span>Day {day}</span>
                  <span>
                    {day === 1
                      ? `Arrive in ${stop?.name ?? destination}`
                      : day === duration && duration > 1
                        ? 'Head home'
                        : `Explore ${stop?.name ?? destination}`}
                  </span>
                  <span aria-hidden="true">⌄</span>
                </summary>
                {trip.startDate && (
                  <p className={styles.muted}>
                    {new Intl.DateTimeFormat('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(Date.parse(trip.startDate) + index * 86400000))}
                  </p>
                )}
                {dayItems.map((item) => (
                  <Button
                    key={item.id}
                    className={styles.planRow}
                    variant={ButtonVariant.Quiet}
                    onClick={() => setEditing({ item, saved: true })}
                  >
                    {item.name}
                    <small>{planningStatusLabel(getPlanningStatus(item), item.category)} ›</small>
                  </Button>
                ))}
                <Button variant={ButtonVariant.Quiet} onClick={() => addPlan('activities', day)}>
                  ＋ Add a plan
                </Button>
              </details>
            );
          })}
        </div>
      </section>
      {items.some(
        (item) =>
          item.category !== 'transportation' &&
          item.category !== 'accommodation' &&
          (!item.dayNumber || item.dayNumber > duration),
      ) && (
        <details className={styles.morePlans}>
          <summary>Saved for this trip</summary>
          {items
            .filter(
              (item) =>
                item.category !== 'transportation' &&
                item.category !== 'accommodation' &&
                (!item.dayNumber || item.dayNumber > duration),
            )
            .map((item) => (
              <Button
                key={item.id}
                className={styles.planRow}
                variant={ButtonVariant.Quiet}
                onClick={() => setEditing({ item, saved: true })}
              >
                {item.name}
                <span>›</span>
              </Button>
            ))}
        </details>
      )}
      {editing && (
        <BookingEditor
          item={editing.item}
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
                  onChange({
                    ...trip,
                    planning: items.filter((item) => item.id !== editing.item.id),
                  });
                  setEditing(null);
                  setMessage('Plan removed.');
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
