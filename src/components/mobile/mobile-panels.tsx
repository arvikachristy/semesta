import { AccountPanel } from '../account/account-panel';
import { useAccount } from '../../account/account-context';
import { MobilePanel, mobilePanelText } from '../../types/mobile-panel';
import type { TMobilePanel } from '../../types/mobile-panel';
import { memo, useEffect, useRef, useState } from 'react';
import { CountrySelector } from '../country-selector';
import type { ICountrySelectorProps } from '../country-selector';
import { UpcomingTrips } from '../trips/upcoming-trips';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import styles from './mobile-panels.module.css';

const panelConfig = {
  breakpoint: 600,
  resizeEvent: 'resize',
  viewportScrollEvent: 'scroll',
  labels: {
    [MobilePanel.Countries]: 'Countries',
    [MobilePanel.Trips]: 'Trips',
    [MobilePanel.Account]: 'Account',
  },
};

export const MobilePanels = memo((props: ICountrySelectorProps) => {
  const account = useAccount();
  const [mobile, setMobile] = useState(() => window.innerWidth <= panelConfig.breakpoint);
  const [active, setActive] = useState<TMobilePanel | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Partial<Record<TMobilePanel, HTMLButtonElement | null>>>({});
  const previous = useRef<TMobilePanel | null>(null);
  const dismiss = () => setActive(null);

  useEffect(() => {
    const resize = () => setMobile(window.innerWidth <= panelConfig.breakpoint);
    window.addEventListener(panelConfig.resizeEvent, resize);
    return () => window.removeEventListener(panelConfig.resizeEvent, resize);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) {
      return;
    }
    if (element.open) {
      element.close();
    }
    if (mobile && active) {
      element.showModal();
      const tripClose = element.querySelector('button[data-sheet-close]');
      if (tripClose instanceof HTMLButtonElement && active === MobilePanel.Trips) {
        tripClose.focus();
      } else {
        closeButton.current?.focus();
      }
    } else {
      element.show();
      if (mobile && previous.current) {
        triggers.current[previous.current]?.focus();
      }
    }
    previous.current = active;
  }, [mobile, active]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      const element = dialog.current;
      if (element && viewport) {
        element.style.setProperty('--visible-height', `${viewport.height}px`);
        element.style.setProperty('--visible-top', `${viewport.offsetTop}px`);
      }
    };
    update();
    viewport?.addEventListener(panelConfig.resizeEvent, update);
    viewport?.addEventListener(panelConfig.viewportScrollEvent, update);
    return () => {
      viewport?.removeEventListener(panelConfig.resizeEvent, update);
      viewport?.removeEventListener(panelConfig.viewportScrollEvent, update);
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`${ui.surface} ${styles.shell}`}
      data-mobile={mobile}
      data-active={mobile ? (active ?? '') : ''}
      role={mobile && active ? undefined : 'presentation'}
      aria-label={mobile && active ? panelConfig.labels[active] : undefined}
      onCancel={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
          dismiss();
        }
      }}
      onClick={(event) => {
        if (mobile && active && event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom ||
            event.clientX < bounds.left ||
            event.clientX > bounds.right
          ) {
            dismiss();
          }
        }
      }}
    >
      {mobile && active === MobilePanel.Countries && (
        <header className={styles.sheetHeader}>
          <span>{active ? panelConfig.labels[active] : ''}</span>
          <Button
            ref={closeButton}
            variant={ButtonVariant.Quiet}
            onClick={dismiss}
            aria-label={mobilePanelText.close}
          >
            {mobilePanelText.closeLabel}
          </Button>
        </header>
      )}
      <div className={styles.contents}>
        <div className={styles.feature} hidden={mobile && active !== MobilePanel.Countries}>
          <CountrySelector
            {...props}
            mobilePanel={
              mobile ? { open: active === MobilePanel.Countries, onClose: dismiss } : undefined
            }
          />
        </div>
        <div className={styles.feature} hidden={mobile && active !== MobilePanel.Trips}>
          <UpcomingTrips
            key={account.userId}
            mobilePanel={
              mobile ? { open: active === MobilePanel.Trips, onClose: dismiss } : undefined
            }
          />
        </div>
        <div className={styles.feature} hidden={mobile && active !== MobilePanel.Account}>
          <AccountPanel
            mobilePanel={
              mobile ? { open: active === MobilePanel.Account, onClose: dismiss } : undefined
            }
          />
        </div>
      </div>
      <nav className={styles.bar} aria-label="Explore and plan" hidden={!mobile}>
        {Object.values(MobilePanel).map((panel) => (
          <Button
            key={panel}
            ref={(element) => {
              triggers.current[panel] = element;
            }}
            variant={active === panel ? ButtonVariant.Primary : ButtonVariant.Quiet}
            aria-expanded={active === panel}
            disabled={panel === MobilePanel.Countries && props.disabled}
            onClick={() => setActive((current) => (current === panel ? null : panel))}
          >
            {panel === MobilePanel.Account && account.hasTrips && account.email === null
              ? 'Save plans'
              : panelConfig.labels[panel]}
          </Button>
        ))}
      </nav>
    </dialog>
  );
});
