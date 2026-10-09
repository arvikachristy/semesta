import type { ComponentProps } from 'react';
import styles from './ui.module.css';

export const ButtonVariant = {
  Secondary: 'secondary',
  Primary: 'primary',
  Quiet: 'quiet',
  Plain: 'plain',
} as const;
type TButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
interface IButtonProps extends ComponentProps<'button'> {
  variant?: TButtonVariant;
  icon?: boolean;
}
const variantClasses = {
  [ButtonVariant.Secondary]: '',
  [ButtonVariant.Primary]: styles.primary,
  [ButtonVariant.Quiet]: styles.quiet,
  [ButtonVariant.Plain]: styles.plain,
};

export const Button = ({
  variant = ButtonVariant.Secondary,
  icon = false,
  className = '',
  type = 'button',
  ...props
}: IButtonProps) => (
  <button
    {...props}
    type={type}
    className={[styles.button, variantClasses[variant], icon ? styles.icon : '', className]
      .filter(Boolean)
      .join(' ')}
  />
);
