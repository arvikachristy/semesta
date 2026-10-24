import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button, ButtonVariant } from './button';
import ui from './ui.module.css';

interface IOverlayProps {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
  modal?: boolean;
}
export const Overlay = ({
  title,
  onDismiss,
  children,
  className = '',
  hideHeader = false,
  modal = true,
}: IOverlayProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement;
    if (modal) {
      element?.showModal();
    } else {
      element?.show();
    }
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, [modal]);
  return (
    <dialog
      ref={ref}
      className={`${ui.surface} ${ui.raised} ${ui.dialog} ${className}`}
      aria-label={title}
      aria-modal={modal || undefined}
      onKeyDown={(event) => {
        if (!modal && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onDismiss();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            onDismiss();
          }
        }
      }}
    >
      {!hideHeader && (
        <header className={ui.dialogHeader}>
          <h2>{title}</h2>
          <Button variant={ButtonVariant.Quiet} onClick={onDismiss} aria-label={`Close ${title}`}>
            Close
          </Button>
        </header>
      )}
      {children}
    </dialog>
  );
};
