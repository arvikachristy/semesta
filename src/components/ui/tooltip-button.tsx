import { useId, useState } from 'react';
import type { ComponentProps } from 'react';
import { Button } from './button';
import ui from './ui.module.css';

interface ITooltipButtonProps extends ComponentProps<typeof Button> {
  label: string;
}

export const TooltipButton = ({ label, children, ...props }: ITooltipButtonProps) => {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span
      className={ui.tooltipAnchor}
      data-dismissed={dismissed}
      onMouseEnter={() => setDismissed(false)}
      onFocus={() => setDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setDismissed(true);
        }
      }}
    >
      <Button {...props} icon aria-label={label} aria-describedby={id}>
        {children}
      </Button>
      <span id={id} role="tooltip" className={ui.tooltip}>
        {label}
      </span>
    </span>
  );
};
