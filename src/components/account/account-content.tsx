import { useEffect, useState } from 'react';
import { useAccount } from '../../account/account-context';
import { accountClient } from '../../account/client';
import { accountConfig, BackupStatus } from '../../account/account-config';
import { Button, ButtonVariant } from '../ui/button';
import ui from '../ui/ui.module.css';
import styles from './account.module.css';

const AccountAction = { Delete: 'delete', Reload: 'reload', SignOut: 'sign-out' } as const;
type TAccountAction = (typeof AccountAction)[keyof typeof AccountAction];
const actionText = {
  [AccountAction.Delete]:
    'Delete your account and cloud backup? Guest plans on this device are kept.',
  [AccountAction.Reload]:
    'Restore the cloud backup? This replaces your account’s local changes on this device.',
  [AccountAction.SignOut]:
    'Sign out on this device? Any changes not yet backed up will be removed from this device.',
};

export const AccountContent = () => {
  const account = useAccount();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState<TAccountAction | null>(null);
  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await operation();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not complete this. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  const sendCode = async () => {
    if (!accountClient) {
      return;
    }
    const address = email.trim();
    const { error } = await accountClient.auth.signInWithOtp({ email: address });
    if (error) {
      throw error;
    }
    setSentTo(address);
    setCode('');
    setCooldown(accountConfig.resendSeconds);
  };
  const signedIn = account.userId !== accountConfig.guestId;
  return (
    <div className={styles.content}>
      {signedIn ? (
        <>
          <p className={styles.email}>{account.email}</p>
          <p role="status">{account.status}</p>
          {account.status !== BackupStatus.Saved && account.retry && (
            <Button disabled={busy} onClick={() => void run(account.retry ?? (async () => {}))}>
              Retry backup
            </Button>
          )}
          {account.importGuest && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await account.importGuest?.();
                  setNotice('Plans from this device imported.');
                })
              }
            >
              Import guest plans from this device
            </Button>
          )}
          {account.status === BackupStatus.Conflict && (
            <Button disabled={busy} onClick={() => setConfirmation(AccountAction.Reload)}>
              Restore cloud version
            </Button>
          )}
          <div className={ui.actions}>
            <Button
              disabled={busy || !account.signOut}
              onClick={() => setConfirmation(AccountAction.SignOut)}
            >
              Sign out
            </Button>
            <Button
              variant={ButtonVariant.Quiet}
              disabled={busy || !account.deleteAccount}
              onClick={() => setConfirmation(AccountAction.Delete)}
            >
              Delete account
            </Button>
          </div>
          {confirmation && (
            <section role="alert" className={styles.confirmation}>
              <p>{actionText[confirmation]}</p>
              <div className={ui.actions}>
                <Button disabled={busy} onClick={() => setConfirmation(null)}>
                  Cancel
                </Button>
                <Button
                  variant={ButtonVariant.Primary}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const actions = {
                        [AccountAction.Delete]: account.deleteAccount,
                        [AccountAction.Reload]: account.reloadCloud,
                        [AccountAction.SignOut]: account.signOut,
                      };
                      await actions[confirmation]?.();
                      setConfirmation(null);
                    })
                  }
                >
                  Confirm
                </Button>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <p>Keep your countries and trips across devices.</p>
          {!account.configured && (
            <p role="status">
              Account backup is not connected yet. Your plans still save on this device.
            </p>
          )}
          <Button
            disabled={busy || !account.configured}
            onClick={() =>
              void run(async () => {
                if (!accountClient) {
                  return;
                }
                const { error } = await accountClient.auth.signInWithOAuth({
                  provider: accountConfig.provider.google,
                  options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
                });
                if (error) {
                  throw error;
                }
              })
            }
          >
            Continue with Google
          </Button>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!sentTo) {
                  await sendCode();
                  return;
                }
                if (!accountClient) {
                  return;
                }
                const { error } = await accountClient.auth.verifyOtp({
                  email: sentTo,
                  token: code.trim(),
                  type: accountConfig.provider.email,
                });
                if (error) {
                  throw error;
                }
              });
            }}
          >
            {sentTo ? (
              <>
                <p>Enter the code sent to {sentTo}.</p>
                <label className={ui.field}>
                  Verification code
                  <input
                    autoFocus
                    className={ui.control}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    disabled={busy}
                  />
                </label>
                <Button type="submit" variant={ButtonVariant.Primary} disabled={busy}>
                  Verify email
                </Button>
                <div className={ui.actions}>
                  <Button disabled={busy || cooldown > 0} onClick={() => void run(sendCode)}>
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </Button>
                  <Button
                    disabled={busy}
                    variant={ButtonVariant.Quiet}
                    onClick={() => {
                      setSentTo('');
                      setCode('');
                      setError('');
                    }}
                  >
                    Change email
                  </Button>
                </div>
              </>
            ) : (
              <>
                <label className={ui.field}>
                  Email address
                  <input
                    className={ui.control}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy || !account.configured}
                  />
                </label>
                <Button
                  type="submit"
                  variant={ButtonVariant.Primary}
                  disabled={busy || !account.configured || cooldown > 0}
                >
                  {cooldown > 0 ? `Send code in ${cooldown}s` : 'Continue with email'}
                </Button>
              </>
            )}
          </form>
          <p className={styles.hint}>
            No password. You can always keep using Semesta without an account.
          </p>
        </>
      )}
      {busy && <p role="status">One moment…</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
};
