import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ITrip } from '../../types/trip';
import {
  getPlanningProgress,
  getPlanningStatus,
  planningCategories,
  isPlanningCategory,
  PlanningStatus,
} from '../../types/trip-planning';
import type { ITripPlanningItem, TPlanningCategory } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import { BookingEditor } from './booking-editor';
import { StudioCategorySection, studioCategoryLabels } from './studio-category';
import { findSuggestedBooking, getBookingSuggestions } from './booking-suggestions';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

interface ITripPlanningProps {
  trip: ITrip;
  items: readonly ITripPlanningItem[];
  onChange: (items: ITripPlanningItem[], activeCategories?: TPlanningCategory[]) => void;
  activeCategories?: readonly TPlanningCategory[];
  onCategoriesChange?: (categories: TPlanningCategory[]) => void;
  journey?: ReactNode;
}
export const TripPlanning = ({
  trip,
  items,
  onChange,
  activeCategories,
  onCategoriesChange,
  journey,
}: ITripPlanningProps) => {
  const [localCategories, setLocalCategories] = useState<TPlanningCategory[]>(() => [
    ...new Set(items.map((item) => item.category)),
  ]);
  const active = activeCategories ?? localCategories;
  const progress = getPlanningProgress(items, active);
  const suggestions = getBookingSuggestions(trip);
  const [message, setMessage] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [adding, setAdding] = useState<TPlanningCategory | null>(null);
  return (
    <section className={styles.planningWorkspace} aria-label="Trip Studio planning">
      <div className={journey ? styles.hero : undefined}>
        {journey}
        <section
          className={`${ui.surface} ${styles.readiness}`}
          aria-label="Trip readiness"
          data-complete={progress.total > 0 && progress.completed === progress.total}
        >
          <span className={styles.eyebrow}>
            {progress.total > 0 && progress.completed === progress.total
              ? 'All tracked plans confirmed'
              : 'Coming together'}
          </span>
          <div className={styles.readinessTitle}>
            <h2>
              {progress.total > 0 && progress.completed === progress.total
                ? 'All set.'
                : 'Ready when you are.'}
            </h2>
            <span>
              {progress.percent}
              <small>%</small>
            </span>
          </div>
          <p role="status">
            {progress.completed} of {progress.total} items booked or ready · {progress.percent}%
          </p>
          <progress
            className={styles.progress}
            aria-label="Overall trip planning progress"
            value={progress.completed}
            max={progress.total || 1}
          />
          <div className={styles.compactProgress}>
            {active.map((category) => {
              const result = getPlanningProgress(
                items.filter((item) => item.category === category),
              );
              return (
                <div key={category}>
                  <span>{studioCategoryLabels[category]}</span>
                  <small>{result.percent}%</small>
                  <progress
                    className={styles.progress}
                    aria-label={`${planningCategories[category]} readiness`}
                    value={result.completed}
                    max={result.total || 1}
                  />
                </div>
              );
            })}
            {!active.length && (
              <p className={styles.eyebrow}>Choose only what this journey needs.</p>
            )}
          </div>
        </section>
      </div>
      <section className={styles.suggestions} aria-label="Your plans">
        <div className={styles.suggestionsHeading}>
          <div>
            <span className={styles.eyebrow}>A simple place to begin</span>
            <h2>Your plans</h2>
          </div>
          <p>Booked something? Mark it here. Details can come later.</p>
        </div>
        <div className={styles.suggestionGroups}>
          {(['transportation', 'accommodation'] as const).map((category) => (
            <div key={category} className={styles.suggestionGroup}>
              <h3>{studioCategoryLabels[category]}</h3>
              <ul>
                {suggestions
                  .filter((suggestion) => suggestion.category === category)
                  .map((suggestion) => {
                    const item = findSuggestedBooking(items, suggestion, trip);
                    const confirmed = Boolean(
                      item &&
                      getPlanningStatus(item) === PlanningStatus.Booked &&
                      active.includes(category),
                    );
                    const supportingText =
                      item && item.name !== suggestion.title
                        ? `${item.name} · ${suggestion.dateLabel}`
                        : suggestion.dateLabel;
                    return (
                      <li
                        key={suggestion.id}
                        className={styles.suggestion}
                        data-confirmed={confirmed}
                      >
                        <span className={styles.suggestionLabel}>
                          <span>{suggestion.title}</span>
                          <small>{supportingText}</small>
                        </span>
                        <span className={styles.suggestionAction}>
                          {confirmed && (
                            <small className={styles.suggestionConfirmed}>
                              <span className={styles.confirmationStamp} aria-hidden="true">
                                ✓
                              </span>{' '}
                              Booked
                            </small>
                          )}
                          <Button
                            variant={confirmed ? ButtonVariant.Quiet : ButtonVariant.Primary}
                            aria-label={
                              confirmed
                                ? `Undo ${suggestion.title} booking`
                                : `Mark ${suggestion.title.toLowerCase()} booked`
                            }
                            onClick={() => {
                              if (confirmed && item) {
                                onChange(
                                  items.map((entry) =>
                                    entry.id === item.id
                                      ? {
                                          ...entry,
                                          status: PlanningStatus.ToBook,
                                          completed: false,
                                        }
                                      : entry,
                                  ),
                                );
                                setMessage(`${suggestion.title} is no longer marked booked.`);
                                return;
                              }
                              const nextItems = item
                                ? items.map((entry) =>
                                    entry.id === item.id
                                      ? {
                                          ...entry,
                                          templateId: suggestion.id,
                                          status: PlanningStatus.Booked,
                                          completed: true,
                                        }
                                      : entry,
                                  )
                                : [
                                    ...items,
                                    {
                                      id: crypto.randomUUID(),
                                      templateId: suggestion.id,
                                      category: suggestion.category,
                                      name: suggestion.title,
                                      details: '',
                                      status: PlanningStatus.Booked,
                                      completed: true,
                                    },
                                  ];
                              onChange(
                                nextItems,
                                active.includes(category) ? [...active] : [...active, category],
                              );
                              setMessage(`${suggestion.title} marked booked.`);
                            }}
                          >
                            {confirmed ? 'Undo' : 'Mark booked'}
                          </Button>
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
        <p className={styles.eyebrow}>
          Flights and hotels are suggestions. You can plan trains, transfers or another kind of stay
          below.
        </p>
      </section>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>Your reservation collection</span>
          <h2>A few things to look forward to.</h2>
        </div>
        <Button variant={ButtonVariant.Quiet} onClick={() => setChoosing(true)}>
          Choose optional categories
        </Button>
      </div>
      <div className={styles.categories}>
        {active.map((category) => (
          <StudioCategorySection
            key={category}
            category={category}
            items={items.filter((item) => item.category === category)}
            onAdd={() => setAdding(category)}
            onChange={(updated) =>
              onChange(items.map((item) => (item.id === updated.id ? updated : item)))
            }
            onRemove={(id) => {
              const removed = items.find((item) => item.id === id);
              onChange(items.filter((item) => item.id !== id));
              setMessage(`${removed?.name ?? 'Booking'} removed.`);
            }}
          />
        ))}
      </div>
      {!active.length && (
        <p className={styles.empty}>
          A little space for possibilities. Add a category when you’re ready.
        </p>
      )}
      {choosing && (
        <Overlay title="Choose optional categories" onDismiss={() => setChoosing(false)}>
          <p>Turning a category off keeps its items saved. Turn it back on any time.</p>
          <div className={styles.choices}>
            {Object.entries(planningCategories).map(
              ([category, label]) =>
                isPlanningCategory(category) && (
                  <label key={category}>
                    <input
                      className={ui.checkbox}
                      type="checkbox"
                      checked={active.includes(category)}
                      onChange={(event) => {
                        const next = event.currentTarget.checked
                          ? [...active, category]
                          : active.filter((id) => id !== category);
                        setLocalCategories(next);
                        onCategoriesChange?.(next);
                      }}
                    />
                    {label}
                  </label>
                ),
            )}
          </div>
          <Button variant={ButtonVariant.Primary} onClick={() => setChoosing(false)}>
            Done
          </Button>
        </Overlay>
      )}
      {adding && (
        <BookingEditor
          title={`Add ${planningCategories[adding].toLowerCase()}`}
          onCancel={() => setAdding(null)}
          onSave={(fields) => {
            onChange([
              ...items,
              {
                id: crypto.randomUUID(),
                category: adding,
                ...fields,
                completed: false,
                status: PlanningStatus.Idea,
              },
            ]);
            setAdding(null);
            setMessage(`${fields.name} added.`);
          }}
        />
      )}
      <p className={styles.eyebrow} role="status">
        {message}
      </p>
    </section>
  );
};
