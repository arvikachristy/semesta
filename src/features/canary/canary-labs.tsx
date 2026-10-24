import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { Button, ButtonVariant } from '../../components/ui/button';
import { canary_registry } from './canary-registry';
import { useDevMode } from './use-dev-mode';
import { setCanary } from '../../redux/canary/slice';
import styles from './canary-labs.module.css';

export const CanaryLabs = () => {
  const dispatch = useAppDispatch();
  const devMode = useDevMode();
  const overrides = useAppSelector((state) => state.canary.overrides);
  const [open, setOpen] = useState(false);

  if (!devMode) {
    return null;
  }

  return (
    <aside className={styles.root} aria-label="Canary features">
      <Button
        icon
        className={styles.trigger}
        variant={ButtonVariant.Secondary}
        aria-label="Open Canary features"
        aria-expanded={open}
        aria-controls="canary-features"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">⚗</span>
      </Button>
      {open && (
        <div
          id="canary-features"
          className={styles.panel}
          role="group"
          aria-label="Semesta Labs"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <h2 className={styles.heading}>Semesta Labs</h2>
          <p className={styles.description}>Experimental features on this device.</p>
          {Object.values(canary_registry).map((feature) => (
            <label className={styles.feature} key={feature.id}>
              <input
                type="checkbox"
                checked={overrides[feature.id] ?? feature.isEnabled}
                onChange={(event) =>
                  dispatch(setCanary({ id: feature.id, enabled: event.currentTarget.checked }))
                }
              />
              <span>
                <strong>{feature.id === 'trip-studio' ? 'Trip Studio' : feature.id}</strong>
                <small>{feature.description}</small>
              </span>
            </label>
          ))}
        </div>
      )}
    </aside>
  );
};
