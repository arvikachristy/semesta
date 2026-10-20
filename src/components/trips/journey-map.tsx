import { Fragment, useState } from 'react';
import type { ITrip } from '../../types/trip';
import { getPlanningStatus, PlanningStatus, planningStatusLabel } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { getDurationDays, getTripStops } from './trip-itinerary';
import { getJourneyMap } from './journey-map-model';
import type { IJourneyEntry } from './journey-map-model';
import { JourneyIcon } from './journey-icon';
import styles from './journey-map.module.css';

interface IJourneyMapProps {
  trip: ITrip;
  onEdit: (entry: IJourneyEntry) => void;
  onAddTravel: () => void;
  onAddStop: () => void;
  onEditStop: (id: string) => void;
}

export const JourneyMap = ({
  trip,
  onEdit,
  onAddTravel,
  onAddStop,
  onEditStop,
}: IJourneyMapProps) => {
  const [focusPending, setFocusPending] = useState(false);
  const entries = getJourneyMap(trip);
  const duration = getDurationDays(trip);
  const pending = entries.filter(
    (entry) => getPlanningStatus(entry.item) !== PlanningStatus.Booked,
  );
  const stays = pending.filter((entry) => entry.item.category === 'accommodation').length;
  const travel = pending.length - stays;
  const card = (entry: IJourneyEntry) => (
    <div
      key={entry.item.id}
      className={styles.event}
      data-muted={focusPending && getPlanningStatus(entry.item) === PlanningStatus.Booked}
    >
      <Button
        variant={ButtonVariant.Secondary}
        className={styles.card}
        data-journey-item={entry.item.id}
        onClick={() => onEdit(entry)}
        aria-label={`${entry.saved ? 'Edit' : 'Add'} ${entry.item.name}`}
        aria-description={`${entry.day ? `Day ${entry.day}. ` : ''}${entry.label}. ${planningStatusLabel(getPlanningStatus(entry.item), entry.item.category)}`}
      >
        <span className={styles.marker} aria-hidden="true">
          <JourneyIcon
            kind={
              entry.item.category === 'accommodation'
                ? 'stay'
                : entry.label === 'Transfer'
                  ? 'transfer'
                  : 'travel'
            }
          />
        </span>
        <span className={styles.caption}>{entry.label}</span>
        {entry.day && (
          <small>
            Day {entry.day}
            {entry.endDay ? `–${entry.endDay} · planned` : ''}
          </small>
        )}
        <span className={styles.name}>{entry.item.name}</span>
        <span className={styles.badge} data-status={getPlanningStatus(entry.item)}>
          {planningStatusLabel(getPlanningStatus(entry.item), entry.item.category)}
        </span>
        {!entry.saved && <small>Tap to add</small>}
      </Button>
      {entry.stopId && (
        <Button
          variant={ButtonVariant.Quiet}
          className={styles.stopAction}
          onClick={() => onEditStop(entry.stopId ?? '')}
          aria-label={`Edit stop ${entry.label}`}
        >
          Edit stop
        </Button>
      )}
    </div>
  );
  return (
    <section aria-label="Your journey" className={styles.journey}>
      <h2>Your journey</h2>
      <Button
        variant={ButtonVariant.Secondary}
        className={styles.summary}
        aria-pressed={focusPending}
        onClick={() => setFocusPending(!focusPending)}
      >
        <span>
          {pending.length ? 'Still to book' : 'All essentials booked'}
          <strong>
            {stays} {stays === 1 ? 'stay' : 'stays'} · {travel}{' '}
            {travel === 1 ? 'journey' : 'journeys'}
          </strong>
        </span>
        <span>
          {focusPending ? 'Show all' : 'Focus'} <span aria-hidden="true">›</span>
        </span>
      </Button>
      <p className={styles.hint}>Tap a stay or journey to add booking details.</p>
      <div className={styles.grid}>
        <span className={styles.dayHeading}>Day</span>
        <div className={styles.laneHeading} data-lane="stay">
          <span>
            <JourneyIcon kind="stay" /> Stay
          </span>
          {(getTripStops(trip).at(-1)?.nights ?? 0) > 1 && (
            <Button variant={ButtonVariant.Quiet} icon aria-label="Add a stop" onClick={onAddStop}>
              +
            </Button>
          )}
        </div>
        <div className={styles.laneHeading} data-lane="travel">
          <span>
            <JourneyIcon kind="travel" /> Travel
          </span>
          <Button variant={ButtonVariant.Quiet} icon aria-label="Add travel" onClick={onAddTravel}>
            +
          </Button>
        </div>
        {Array.from({ length: duration }, (_, index) => {
          const day = index + 1;
          return (
            <Fragment key={day}>
              <div className={styles.day} style={{ gridRow: day + 1, gridColumn: 1 }}>
                <strong>{String(day).padStart(2, '0')}</strong>
                {trip.startDate && (
                  <small>
                    {new Intl.DateTimeFormat('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(Date.parse(trip.startDate) + index * 86400000))}
                  </small>
                )}
              </div>
              <div
                className={styles.travelDay}
                data-lane="travel"
                style={{ gridRow: day + 1, gridColumn: 3 }}
              >
                {entries
                  .filter((entry) => entry.item.category === 'transportation' && entry.day === day)
                  .map(card)}
              </div>
              <div className={styles.stayDay} style={{ gridRow: day + 1, gridColumn: 2 }} />
            </Fragment>
          );
        })}
        {duration === 1 && (
          <p className={styles.hint} style={{ gridColumn: 2, gridRow: 2 }}>
            No overnight stay
          </p>
        )}
        {entries
          .filter(
            (entry) =>
              entry.item.category === 'accommodation' && entry.day !== undefined && entry.stopId,
          )
          .map((entry) => (
            <div
              key={entry.item.id}
              className={styles.stayRange}
              data-lane="stay"
              style={{
                gridColumn: 2,
                gridRow: `${(entry.day ?? 1) + 1} / ${Math.min(duration + 2, Math.max((entry.day ?? 1) + 2, (entry.endDay ?? entry.day ?? 1) + 1))}`,
              }}
            >
              {card(entry)}
            </div>
          ))}
      </div>
      {entries.some(
        (entry) =>
          entry.day === undefined || (entry.item.category === 'accommodation' && !entry.stopId),
      ) && (
        <div className={styles.unscheduled}>
          <h3>Other bookings</h3>
          <p className={styles.hint}>
            Extra stays and bookings without a matching trip day. All your details are kept here.
          </p>
          {entries
            .filter(
              (entry) =>
                entry.day === undefined ||
                (entry.item.category === 'accommodation' && !entry.stopId),
            )
            .map(card)}
        </div>
      )}
    </section>
  );
};
