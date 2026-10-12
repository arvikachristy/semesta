import type { ITrip } from '../../types/trip';
import { countries } from '../../data/countries';
import styles from './trip-studio.module.css';

export const TripJourney = ({ trip }: { trip: ITrip }) => (
  <figure className={styles.journey} aria-label="Your journey route">
    <span className={styles.eyebrow}>A little further from ordinary</span>
    <svg viewBox="0 0 620 210" aria-hidden="true">
      <path
        className={styles.route}
        d="M45 150 C140 150 140 40 250 55 S330 185 430 155 S500 50 570 75"
      />
      <circle cx="45" cy="150" r="6" />
      <circle cx="570" cy="75" r="6" />
      <circle className={styles.routeRing} cx="570" cy="75" r="17" />
      <text x="295" y="85" className={styles.routePlane}>
        ↗
      </text>
      <path className={styles.routeTick} d="M310 30 L318 22 M325 35 L337 29" />
    </svg>
    <figcaption>
      <span>
        Departure<small>A new beginning</small>
      </span>
      <span>
        {trip.countryIds.map((id) => countries[id].name).join(' · ') || 'Somewhere new'}
        <small>{trip.startDate ? 'Your next stop' : 'Room for a plan'}</small>
      </span>
    </figcaption>
  </figure>
);
