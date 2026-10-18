import { useEffect, useRef, useState } from 'react';
import { Button, ButtonVariant } from '../ui/button';
import { tripDuration } from './trip-itinerary';
import {
  addDays,
  changeMonth,
  dateAt,
  monthStart,
  rangeDays,
  rangeLabel,
  todayKey,
} from './date-range';
import styles from './duration-controls.module.css';

interface IDateRangeCalendarProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DateRangeCalendar = ({ start, end, onChange }: IDateRangeCalendarProps) => {
  const [month, setMonth] = useState(() => monthStart(start || todayKey()));
  const [focused, setFocused] = useState(start || todayKey());
  const focusRequested = useRef(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const first = addDays(month, -dateAt(month).getUTCDay());
  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateAt(month));
  useEffect(() => {
    if (focusRequested.current) {
      buttons.current.get(focused)?.focus();
      focusRequested.current = false;
    }
  }, [focused, month]);
  const select = (day: string) => {
    if (!start || end || day < start) {
      onChange(day, '');
    } else if (rangeDays(start, day) <= tripDuration.maxDays) {
      onChange(start, day);
    }
    setFocused(day);
    setMonth(monthStart(day));
  };
  return (
    <section className={styles.calendar} aria-label="Trip date range">
      <header className={styles.calendarHeader}>
        <Button
          icon
          variant={ButtonVariant.Quiet}
          aria-label="Previous month"
          onClick={() => {
            const next = changeMonth(month, -1);
            setMonth(next);
            setFocused(next);
          }}
        >
          ‹
        </Button>
        <h3 aria-live="polite">{monthLabel}</h3>
        <Button
          icon
          variant={ButtonVariant.Quiet}
          aria-label="Next month"
          onClick={() => {
            const next = changeMonth(month, 1);
            setMonth(next);
            setFocused(next);
          }}
        >
          ›
        </Button>
      </header>
      <p className={styles.hint} role="status">
        {start && !end ? 'Choose your last day' : 'Choose your first day'}
      </p>
      <table className={styles.calendarGrid} role="grid" aria-label={monthLabel}>
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th key={day} scope="col" abbr={day}>
                {day.slice(0, 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: 7 }, (_, col) => {
                const day = addDays(first, row * 7 + col);
                const isStart = day === start;
                const isEnd = day === end;
                const inRange = Boolean(start && end && day >= start && day <= end);
                const outside = day.slice(0, 7) !== month.slice(0, 7);
                const disabled = Boolean(
                  start && !end && day >= start && rangeDays(start, day) > tripDuration.maxDays,
                );
                const label = new Intl.DateTimeFormat('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(dateAt(day));
                return (
                  <td
                    key={day}
                    aria-selected={inRange || isStart}
                    data-range={inRange}
                    data-start={isStart}
                    data-end={isEnd}
                    data-outside={outside}
                  >
                    <Button
                      variant={ButtonVariant.Plain}
                      ref={(element) => {
                        if (element) {
                          buttons.current.set(day, element);
                        } else {
                          buttons.current.delete(day);
                        }
                      }}
                      aria-label={label}
                      aria-current={day === todayKey() ? 'date' : undefined}
                      disabled={disabled}
                      tabIndex={day === focused ? 0 : -1}
                      onClick={() => select(day)}
                      onKeyDown={(event) => {
                        const weekday = dateAt(day).getUTCDay();
                        const offsets = {
                          ArrowRight: 1,
                          ArrowLeft: -1,
                          ArrowDown: 7,
                          ArrowUp: -7,
                          Home: -weekday,
                          End: 6 - weekday,
                        };
                        const offset = Object.entries(offsets).find(([key]) => key === event.key);
                        const next = offset
                          ? addDays(day, offset[1])
                          : event.key === 'PageDown'
                            ? changeMonth(day, 1)
                            : event.key === 'PageUp'
                              ? changeMonth(day, -1)
                              : null;
                        if (next) {
                          event.preventDefault();
                          focusRequested.current = true;
                          setMonth(monthStart(next));
                          setFocused(next);
                        }
                      }}
                    >
                      {dateAt(day).getUTCDate()}
                    </Button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.rangeSummary} aria-live="polite">
        <span aria-hidden="true">▦</span>
        {rangeLabel(start, end)}
      </p>
    </section>
  );
};
