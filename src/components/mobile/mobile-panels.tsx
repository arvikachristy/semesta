import { AccountPanel } from '../account/account-panel';
import { useAccount } from '../../account/account-context';
import { useVisualViewport } from '../../hooks/use-visual-viewport';
import { MobilePanel } from '../../types/mobile-panel';
import type { TMobilePanel } from '../../types/mobile-panel';
import { memo, useEffect, useRef, useState } from 'react';
import { CountrySelector } from '../country-selector';
import type { ICountryBrowserProps } from '../shared/country-picker/country-browser';
import { UpcomingTrips } from '../trips/upcoming-trips';
import { Button, ButtonVariant } from '../ui/button';
import { TooltipButton } from '../ui/tooltip-button';
import { PanelIcon } from './panel-icon';
import ui from '../ui/ui.module.css';
import styles from './mobile-panels.module.css';
import type { ITrip } from '../../types/trip';
import type { useTrips } from '../../hooks/use-trips';

interface IMobilePanelsProps {
  countries: ICountryBrowserProps;
  panel: TMobilePanel | null;
  onPanelChange: (panel: TMobilePanel | null) => void;
  onBrowseAll: () => void;
  studioOpen?: boolean;
  tripStudioEnabled: boolean;
  onCollection?: () => void;
  onTrips?: () => void;

  tripSession?: ReturnType<typeof useTrips>;
  onOpenStudio: (trip: ITrip) => void;
}

const panelConfig = {
  breakpoint: 600,
  resizeEvent: 'resize',
  labels: {
    [MobilePanel.Countries]: 'Countries',
    [MobilePanel.Trips]: 'Trips',
    [MobilePanel.Account]: 'Account',
  },
};

export const MobilePanels = memo((props: IMobilePanelsProps) => {
  const account = useAccount();
  const viewportStyle = useVisualViewport();
  const [narrow, setNarrow] = useState(() => window.innerWidth <= panelConfig.breakpoint);
  const mobile = narrow || Boolean(props.studioOpen);
  const active = props.panel;
  const setActive = props.onPanelChange;
  const dialog = useRef<HTMLDialogElement>(null);
  const modal = useRef(false);

  const triggers = useRef<Partial<Record<TMobilePanel, HTMLButtonElement | null>>>({});
  const previous = useRef<TMobilePanel | null>(null);
  const dismiss = () => setActive(null);
  useEffect(() => {
    const resize = () => setNarrow(window.innerWidth <= panelConfig.breakpoint);
    window.addEventListener(panelConfig.resizeEvent, resize);
    return () => window.removeEventListener(panelConfig.resizeEvent, resize);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) {
      return;
    }
    const shouldBeModal = mobile && Boolean(active);
    // Reopening the desktop shell steals native dismissal from its country modal.
    // Only change dialog mode when the shell actually enters or leaves a sheet.
    if (!element.open || modal.current !== shouldBeModal) {
      if (element.open) {
        element.close();
      }
      if (shouldBeModal) {
        element.showModal();
      } else {
        element.show();
      }
      modal.current = shouldBeModal;
    }
    if (shouldBeModal) {
      const tripClose = element.querySelector('button[data-sheet-close]');
      if (tripClose instanceof HTMLButtonElement && active === MobilePanel.Trips) {
        tripClose.focus();
      } else {
        const close = element.querySelector('button[aria-label="Close countries"]');
        if (close instanceof HTMLButtonElement) {
          close.focus();
        }
      }
    } else {
      if (mobile && previous.current) {
        triggers.current[previous.current]?.focus();
      }
    }
    previous.current = active;
  }, [mobile, active]);

  return (
    <dialog
      ref={dialog}
      style={viewportStyle}
      className={`${ui.surface} ${styles.shell}`}
      data-mobile={mobile}
      data-studio={Boolean(props.studioOpen)}
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
      <div className={styles.contents}>
        <div className={styles.feature} hidden={mobile && active !== MobilePanel.Countries}>
          <CountrySelector
            {...props.countries}
            open={active === MobilePanel.Countries}
            onOpen={props.onBrowseAll}
            onClose={dismiss}
            hideLauncher={!mobile}
            mobilePanel={
              mobile ? { open: active === MobilePanel.Countries, onClose: dismiss } : undefined
            }
          />
        </div>
        <div
          className={styles.feature}
          hidden={!props.tripStudioEnabled || (mobile && active !== MobilePanel.Trips)}
        >
          {props.tripStudioEnabled && (
            <UpcomingTrips
              tripSession={props.tripSession}
              key={account.userId}
              onOpenStudio={(trip) => {
                dismiss();
                props.onOpenStudio(trip);
              }}
              mobilePanel={
                mobile ? { open: active === MobilePanel.Trips, onClose: dismiss } : undefined
              }
              desktopPanel={
                !mobile ? { open: active === MobilePanel.Trips, onClose: dismiss } : undefined
              }
            />
          )}
        </div>
        <div className={styles.feature} hidden={mobile && active !== MobilePanel.Account}>
          <AccountPanel
            desktopPanel={
              !mobile ? { open: active === MobilePanel.Account, onClose: dismiss } : undefined
            }
            mobilePanel={
              mobile ? { open: active === MobilePanel.Account, onClose: dismiss } : undefined
            }
          />
        </div>
      </div>
      {!mobile && (
        <nav className={styles.rail} aria-label="Desktop navigation">
          {Object.values(MobilePanel)
            .filter((panel) => props.tripStudioEnabled || panel !== MobilePanel.Trips)
            .map((panel) => (
              <TooltipButton
                key={panel}
                label={panelConfig.labels[panel]}
                variant={active === panel ? ButtonVariant.Primary : ButtonVariant.Quiet}
                aria-haspopup={panel === MobilePanel.Trips ? undefined : 'dialog'}
                aria-expanded={active === panel}
                disabled={panel === MobilePanel.Countries && props.countries.disabled}
                onClick={() => {
                  if (panel === MobilePanel.Countries && active !== panel) {
                    props.onBrowseAll();
                  } else {
                    setActive(active === panel ? null : panel);
                  }
                }}
              >
                <PanelIcon panel={panel} />
              </TooltipButton>
            ))}
        </nav>
      )}
      <nav className={styles.bar} aria-label="Explore and plan" hidden={!mobile}>
        {Object.values(MobilePanel)
          .filter((panel) => props.tripStudioEnabled || panel !== MobilePanel.Trips)
          .map((panel) => (
            <Button
              key={panel}
              ref={(element) => {
                triggers.current[panel] = element;
              }}
              variant={active === panel ? ButtonVariant.Primary : ButtonVariant.Quiet}
              aria-expanded={active === panel}
              disabled={panel === MobilePanel.Countries && props.countries.disabled}
              onClick={() => {
                if (props.studioOpen && panel === MobilePanel.Countries) {
                  setActive(MobilePanel.Countries);
                  props.onCollection?.();
                } else if (props.studioOpen && panel === MobilePanel.Trips) {
                  setActive(MobilePanel.Trips);
                  props.onTrips?.();
                } else if (panel === MobilePanel.Countries && active !== panel) {
                  props.onBrowseAll();
                } else {
                  setActive(active === panel ? null : panel);
                }
              }}
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
