import { useEffect, useRef, useState } from 'react';
import type { ITrip } from '../../types/trip';
import { countries } from '../../data/countries';
import { flagAssetPath } from '../../data/flag-definitions';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import { getTripDates } from './trip-presentation';
import {
  getStudioProgress,
  previewParticipants,
  studioCategories,
  StudioCategory,
} from './studio-preview';
import type { TStudioCategory } from './studio-preview';
import { StudioCategorySection } from './studio-category';
import styles from './trip-studio.module.css';

interface ITripStudioProps {
  trip: ITrip;
  onBack: () => void;
}
export const TripStudio = ({ trip, onBack }: ITripStudioProps) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const [enabled, setEnabled] = useState<TStudioCategory[]>([
    StudioCategory.Flights,
    StudioCategory.Accommodation,
  ]);
  const activeCategories = studioCategories.filter((category) => enabled.includes(category.id));
  const progress = getStudioProgress(activeCategories.flatMap((category) => category.items));
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section className={styles.studio} aria-label="Trip Studio">
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <Button variant={ButtonVariant.Quiet} onClick={onBack}>
            ‹ Back to collection
          </Button>
          <span className={styles.eyebrow}>Trip Studio</span>
        </header>
        <div className={styles.introduction}>
          <div>
            <p className={styles.eyebrow}>Your next chapter</p>
            <h1 ref={heading} tabIndex={-1}>
              {trip.name}
            </h1>
            <div className={styles.destinations}>
              {trip.countryIds.map((id) => (
                <span key={id}>
                  <img src={flagAssetPath(id)} alt="" />
                  {countries[id].name}
                </span>
              ))}
              {!trip.countryIds.length && <span>Destinations to decide</span>}
            </div>
            <p className={styles.dates}>{getTripDates(trip).range}</p>
          </div>
          <div className={styles.group}>
            <div className={styles.avatars} aria-label="Example participants">
              {previewParticipants.map((participant) => (
                <span key={participant.id} title={participant.name} aria-label={participant.name}>
                  {participant.initials}
                </span>
              ))}
            </div>
            <small>Example travel group</small>
          </div>
        </div>
        <section
          className={`${ui.surface} ${styles.readiness}`}
          aria-label="Overall trip planning progress"
        >
          <div>
            <span className={styles.eyebrow}>Coming together</span>
            <h2>{progress.percent}% ready for takeoff</h2>
            <p>
              {progress.booked} of {progress.total} bookings collected across your enabled
              categories.
            </p>
          </div>
          <progress
            className={styles.progress}
            aria-label="Overall booking progress"
            value={progress.booked}
            max={progress.total || 1}
          />
        </section>
        <div className={styles.sectionHeading}>
          <h2>Your travel collection</h2>
          <span>Open a ticket to see what’s inside.</span>
        </div>
        <div className={styles.categories}>
          {activeCategories.map((category) => (
            <StudioCategorySection key={category.id} category={category} />
          ))}
        </div>
        {!activeCategories.length && (
          <p className={styles.empty}>
            A little space for possibilities. Choose a category below when you’re ready.
          </p>
        )}
        <details className={styles.options}>
          <summary>＋ Choose optional categories</summary>
          <p>Bring only what your trip needs. Removing a category hides its preview tickets.</p>
          <div className={styles.choices}>
            {studioCategories.map((category) => (
              <label key={category.id}>
                <input
                  className={ui.checkbox}
                  type="checkbox"
                  checked={enabled.includes(category.id)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setEnabled((current) =>
                      checked
                        ? [...current, category.id]
                        : current.filter((id) => id !== category.id),
                    );
                  }}
                />
                {category.label}
              </label>
            ))}
          </div>
        </details>
        <p className={styles.previewNote}>
          Booking and participant previews · Changes here are for exploring the layout and are not
          saved.
        </p>
      </div>
    </section>
  );
};
