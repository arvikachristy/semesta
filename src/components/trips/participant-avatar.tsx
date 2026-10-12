import { useState } from 'react';
import type { ITripParticipant } from '../../types/trip';
import styles from './trip-studio.module.css';
export const ParticipantAvatar = ({ participant }: { participant: ITripParticipant }) => {
  const [failed, setFailed] = useState(false);
  const initials = participant.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <span className={styles.avatar} title={participant.name} aria-label={participant.name}>
      {initials}
      {participant.avatarUrl && !failed && (
        <img src={participant.avatarUrl} alt="" onError={() => setFailed(true)} />
      )}
    </span>
  );
};
