import { useState } from 'react';
import type { ITripParticipant } from '../../types/trip';
import { isBookingLink } from '../../types/trip-planning';
import { Button, ButtonVariant } from '../ui/button';
import { Overlay } from '../ui/overlay';
import { ParticipantAvatar } from './participant-avatar';
import ui from '../ui/ui.module.css';
import styles from './trip-studio.module.css';

interface ITripParticipantsProps {
  participants: readonly ITripParticipant[];
  onChange: (participants: ITripParticipant[]) => void;
}
export const TripParticipants = ({ participants, onChange }: ITripParticipantsProps) => {
  const [editing, setEditing] = useState(false);
  return (
    <div className={styles.group}>
      <div className={styles.avatars} aria-label="Travellers">
        {participants.map((participant) => (
          <ParticipantAvatar
            key={`${participant.id}:${participant.avatarUrl ?? ''}`}
            participant={participant}
          />
        ))}
      </div>
      <Button variant={ButtonVariant.Quiet} onClick={() => setEditing(true)}>
        {participants.length
          ? `${participants.length} ${participants.length === 1 ? 'traveller' : 'travellers'} · Manage`
          : 'Add travellers'}
      </Button>
      {editing && (
        <Overlay title="Travellers" onDismiss={() => setEditing(false)}>
          <ul className={styles.travellerList}>
            {participants.map((participant) => (
              <li key={participant.id}>
                <span>{participant.name}</span>
                <Button
                  variant={ButtonVariant.Quiet}
                  aria-label={`Remove traveller ${participant.name}`}
                  onClick={() =>
                    onChange(participants.filter((item) => item.id !== participant.id))
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <form
            className={styles.participantForm}
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fields = new FormData(form);
              const name = fields.get('name');
              const avatarUrl = fields.get('avatarUrl');
              if (typeof name === 'string' && name.trim() && isBookingLink(avatarUrl)) {
                onChange([
                  ...participants,
                  {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    ...(avatarUrl ? { avatarUrl } : {}),
                  },
                ]);
                form.reset();
              }
            }}
          >
            <label className={ui.field}>
              Traveller name
              <input className={ui.control} name="name" required maxLength={80} />
            </label>
            <label className={ui.field}>
              Avatar URL (optional)
              <input className={ui.control} name="avatarUrl" type="url" pattern="https?://.*" />
            </label>
            <Button type="submit" variant={ButtonVariant.Primary}>
              Add traveller
            </Button>
          </form>
        </Overlay>
      )}
    </div>
  );
};
