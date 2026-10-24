import { CountryBrowser } from './shared/country-picker/country-browser';
import type { ICountryBrowserProps } from './shared/country-picker/country-browser';
import type { IMobilePanelState } from '../types/mobile-panel';
import { Button } from './ui/button';
import { Overlay } from './ui/overlay';
import styles from './shared/country-picker/country-browser.module.css';
import modalStyles from './country-selector.module.css';

export interface ICountrySelectorProps extends ICountryBrowserProps {
  mobilePanel?: IMobilePanelState;
  open: boolean;
  onOpen: () => void;
  hideLauncher?: boolean;
}

export const CountrySelector = ({
  mobilePanel,
  open,
  onOpen,
  hideLauncher = false,
  ...props
}: ICountrySelectorProps) => {
  if (mobilePanel) {
    return <CountryBrowser {...props} onClose={mobilePanel.onClose} />;
  }
  return (
    <>
      <div className="country-selector" hidden={hideLauncher}>
        <Button
          className="country-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={props.disabled}
          onClick={onOpen}
          hidden={open}
        >
          All countries <span>{props.visitedCountryIds.length} visited</span>
        </Button>
      </div>
      {open && (
        <Overlay
          title={props.state.continent ? 'Continent countries' : 'All countries'}
          hideHeader
          modal={false}
          className={modalStyles.modal}
          onDismiss={props.onClose}
        >
          <div className={styles.browser} data-country-sidebar>
            <CountryBrowser {...props} />
          </div>
        </Overlay>
      )}
    </>
  );
};
