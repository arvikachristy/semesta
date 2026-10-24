// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountContent } from './account-content';
import { AccountContext, guestRepositories } from '../../account/account-context';
import { accountConfig, BackupStatus } from '../../account/account-config';
import { ThemeId, themeStorage } from '../../styles/theme';

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(async () => ({ error: null })),
  verifyOtp: vi.fn<() => Promise<{ error: Error | null }>>(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
}));
vi.mock('../../account/client', () => ({ accountClient: { auth } }));
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
const context = {
  configured: true,
  userId: accountConfig.guestId,
  email: null,
  status: BackupStatus.Local,
  ...guestRepositories,
  hasTrips: false,
};
const fill = async (type: string, value: string) => {
  const field = host.querySelector(type);
  if (!(field instanceof HTMLInputElement)) {
    throw new Error('Missing field');
  }
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const submit = async () => {
  await act(async () =>
    host
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
};
const click = async (name: string) => {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === name);
  if (!button) {
    throw new Error(`Missing ${name}`);
  }
  await act(async () => button.click());
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.removeItem(themeStorage.key);
  document.documentElement.dataset.theme = ThemeId.Rose;
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  document.documentElement.dataset.theme = ThemeId.Rose;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('account appearance', () => {
  it('switches to Midnight Navy and saves the device preference', async () => {
    await act(async () =>
      root.render(
        <AccountContext value={context}>
          <AccountContent />
        </AccountContext>,
      ),
    );
    const select = host.querySelector('select[aria-label="Appearance"]');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error('Missing Appearance');
    }
    expect(select.value).toBe(ThemeId.Rose);
    await act(async () => {
      select.value = ThemeId.Midnight;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(document.documentElement.dataset.theme).toBe(ThemeId.Midnight);
    expect(localStorage.getItem(themeStorage.key)).toBe(ThemeId.Midnight);
  });
});
describe('account sign-in form', () => {
  it('sends an email code, throttles resend, and verifies against the address that received it', async () => {
    await act(async () =>
      root.render(
        <AccountContext value={context}>
          <AccountContent />
        </AccountContext>,
      ),
    );
    await fill('input[type="email"]', 'hello@example.com');
    await submit();
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'hello@example.com' });
    expect(host.textContent).toContain('Resend in 60s');
    await fill('input[autocomplete="one-time-code"]', '123456');
    await submit();
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'hello@example.com',
      token: '123456',
      type: accountConfig.provider.email,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(host.textContent).toContain('Resend in 59s');
  });
  it('keeps the code form and reports an expired code instead of claiming success', async () => {
    auth.verifyOtp.mockResolvedValueOnce({ error: new Error('Code expired') });
    await act(async () =>
      root.render(
        <AccountContext value={context}>
          <AccountContent />
        </AccountContext>,
      ),
    );
    await fill('input[type="email"]', 'hello@example.com');
    await submit();
    await fill('input[autocomplete="one-time-code"]', '000000');
    await submit();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe('Code expired');
    expect(host.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
  });
  it('starts only the Google provider and returns to the current route', async () => {
    await act(async () =>
      root.render(
        <AccountContext value={context}>
          <AccountContent />
        </AccountContext>,
      ),
    );
    await click('Continue with Google');
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: accountConfig.provider.google,
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
  });
  it('leaves guest access available and disables sign-in when services are unconfigured', async () => {
    await act(async () =>
      root.render(
        <AccountContext value={{ ...context, configured: false }}>
          <AccountContent />
        </AccountContext>,
      ),
    );
    expect(host.textContent).toContain('not connected yet');
    expect([...host.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });
});
