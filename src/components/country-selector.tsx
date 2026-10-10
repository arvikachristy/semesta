import type { IMobilePanelState } from '../types/mobile-panel';
import { Button, ButtonVariant } from './ui/button';
import ui from './ui/ui.module.css';
import { memo, useEffect, useRef, useState } from 'react';
import type { CountryList } from '../types/country';
import type { CountryStatus } from '../types/country-status';
import { CountryPicker, CountryPickerMode } from './shared/country-picker/country-picker';

enum SelectorEvent {
  KeyDown = 'keydown',
  PointerDown = 'pointerdown',
}
const SelectorKey = { Escape: 'Escape' };
const selectorText = { clear: 'Clear all', cancel: 'Keep flags' };
export interface ICountrySelectorProps {
  mobilePanel?: IMobilePanelState;
  disabled?: boolean;
  showedCountries: readonly CountryList[];
  statuses: Partial<Record<CountryList, CountryStatus>>;
  onClear: () => void;
  onToggle: (country: CountryList, checked: boolean) => void;
}

export const CountrySelector = memo(
  ({
    disabled = false,
    showedCountries,
    statuses,
    onToggle,
    onClear,
    mobilePanel,
  }: ICountrySelectorProps) => {
    const [desktopOpen, setOpen] = useState(false);
    const open = mobilePanel?.open ?? desktopOpen;
    const [confirming, setConfirming] = useState(false);
    const dialog = useRef<HTMLDialogElement>(null);
    const clearButton = useRef<HTMLButtonElement>(null);
    const closeConfirmation = () => {
      setConfirming(false);
      clearButton.current?.focus();
    };
    useEffect(() => {
      if (confirming) {
        dialog.current?.showModal();
      }
    }, [confirming]);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    useEffect(() => {
      if (!open || mobilePanel) {
        return;
      }
      const outside = (event: PointerEvent) => {
        if (dialog.current?.open) {
          return;
        }
        if (event.target instanceof Node && !root.current?.contains(event.target)) {
          setOpen(false);
        }
      };
      const keyDown = (event: KeyboardEvent) => {
        if (!dialog.current?.open && event.key === SelectorKey.Escape) {
          setOpen(false);
          trigger.current?.focus();
        }
      };
      document.addEventListener(SelectorEvent.PointerDown, outside);
      document.addEventListener(SelectorEvent.KeyDown, keyDown);
      return () => {
        document.removeEventListener(SelectorEvent.PointerDown, outside);
        document.removeEventListener(SelectorEvent.KeyDown, keyDown);
      };
    }, [open, mobilePanel]);

    return (
      <div className="country-selector" data-mobile={Boolean(mobilePanel)} ref={root}>
        <Button
          type="button"
          disabled={disabled}
          className="country-trigger"
          hidden={Boolean(mobilePanel)}
          ref={trigger}
          aria-expanded={open}
          aria-controls="country-checklist"
          onClick={() => setOpen((value) => !value)}
        >
          Countries <span>{showedCountries.length} selected</span>
          <span aria-hidden="true">{open ? '⌄' : '⌃'}</span>
        </Button>
        {open && (
          <div className={`${ui.surface} ${ui.raised} country-checklist`} id="country-checklist">
            <div className="country-actions">
              <span>{showedCountries.length} selected</span>
              <Button
                type="button"
                ref={clearButton}
                disabled={disabled || showedCountries.length === 0}
                onClick={() => setConfirming(true)}
              >
                {selectorText.clear}
              </Button>
            </div>
            <CountryPicker
              mode={CountryPickerMode.Checklist}
              selectedCountries={showedCountries}
              statuses={statuses}
              disabled={disabled}
              onToggle={onToggle}
            />
          </div>
        )}
        {confirming && (
          <dialog
            className={`${ui.surface} ${ui.raised} country-confirmation`}
            ref={dialog}
            aria-labelledby="clear-country-title"
            aria-describedby="clear-country-description"
            onCancel={closeConfirmation}
          >
            <h2 id="clear-country-title">Clear all flags?</h2>
            <p id="clear-country-description">
              This removes every selected jelly. You can add countries again anytime.
            </p>
            <div className={`${ui.actions} country-confirmation-actions`}>
              <Button type="button" autoFocus onClick={closeConfirmation}>
                {selectorText.cancel}
              </Button>
              <Button
                type="button"
                variant={ButtonVariant.Primary}
                disabled={disabled}
                onClick={() => {
                  onClear();
                  closeConfirmation();
                }}
              >
                {selectorText.clear}
              </Button>
            </div>
          </dialog>
        )}
      </div>
    );
  },
);
