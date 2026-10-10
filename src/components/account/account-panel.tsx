import { useEffect, useRef, useState } from 'react';
import { useAccount } from '../../account/account-context';
import { accountConfig } from '../../account/account-config';
import { backupInvitation } from '../../account/device-storage';
import { Button, ButtonVariant } from '../ui/button';
import type { IMobilePanelState } from '../../types/mobile-panel';
import { AccountContent } from './account-content';
import ui from '../ui/ui.module.css';
import styles from './account.module.css';

export const AccountPanel = ({ mobilePanel }: { mobilePanel?: IMobilePanelState }) => {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(backupInvitation.isDismissed);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => setOpen(false);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) {
      element?.showModal();
    } else if (!open && element?.open) {
      element.close();
    }
  }, [open, mobilePanel]);
  const invitation =
    account.configured &&
    account.userId === accountConfig.guestId &&
    account.hasTrips &&
    !dismissed;
  const contents = (
    <>
      <header className={styles.header}>
        <h2>Save your plans</h2>
        <Button variant={ButtonVariant.Quiet} onClick={mobilePanel?.onClose ?? close}>
          Close
        </Button>
      </header>
      <AccountContent key={account.userId} />
    </>
  );
  if (mobilePanel) {
    return (
      <section className={styles.mobile} aria-label="Account backup">
        {contents}
      </section>
    );
  }
  return (
    <>
      <div className={styles.launcher}>
        <Button className={ui.surface} onClick={() => setOpen(true)}>
          {' '}
          {account.userId === accountConfig.guestId ? 'Save my plans' : 'My account'}{' '}
        </Button>
        {invitation && (
          <aside
            className={`${ui.surface} ${ui.raised} ${styles.invitation}`}
            aria-label="Back up your plans"
          >
            <p>Keep your trips with you.</p>
            <div className={ui.actions}>
              <Button onClick={() => setOpen(true)}>Back up</Button>
              <Button
                variant={ButtonVariant.Quiet}
                onClick={() => {
                  backupInvitation.dismiss();
                  setDismissed(true);
                }}
              >
                Not now
              </Button>
            </div>
          </aside>
        )}
      </div>
      <dialog
        ref={dialog}
        className={`${ui.surface} ${ui.raised} ${styles.dialog}`}
        aria-label="Account backup"
        onCancel={close}
        onClose={close}
      >
        {contents}
      </dialog>
    </>
  );
};
