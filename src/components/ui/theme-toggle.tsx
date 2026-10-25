import { Button, ButtonVariant } from './button';
import { ThemeId } from '../../styles/theme';
import type { TTheme } from '../../styles/theme';
import styles from './theme-toggle.module.css';

interface IThemeToggleProps {
  theme: TTheme;
  onToggle: () => void;
  placement: 'rail' | 'floating';
  studioOpen?: boolean;
}

export const ThemeToggle = ({
  theme,
  onToggle,
  placement,
  studioOpen = false,
}: IThemeToggleProps) => (
  <Button
    icon
    variant={ButtonVariant.Quiet}
    className={`${styles.toggle} ${placement === 'floating' ? styles.floating : styles.rail}`}
    data-studio-open={studioOpen}
    onClick={onToggle}
    aria-label={theme === ThemeId.Rose ? 'Switch to Dusk' : 'Switch to Dawn'}
    title={theme === ThemeId.Rose ? 'Dusk' : 'Dawn'}
  >
    {theme === ThemeId.Rose ? (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none">
        <path
          d="M20.5 14.6A8.8 8.8 0 0 1 9.4 3.5 8.8 8.8 0 1 0 20.5 14.6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    )}
  </Button>
);
