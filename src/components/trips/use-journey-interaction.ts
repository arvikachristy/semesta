import { useEffect, useRef, useState } from 'react';
import interact from 'interactjs';
import type { ActionProps, DragEvent, Interaction, ResizeEvent } from '@interactjs/types';
import { blockRange } from './journey-blocks';
import type { TBlockAction } from './journey-blocks';

interface IBlockPreview {
  start: number;
  end: number;
  offset: number;
  height?: number;
}
interface IInteractionOptions {
  start: number;
  end: number;
  duration: number;
  stay: boolean;
  getBoundaries: () => number[];
  onChange: (start: number, end: number) => void;
}

const dayAt = (y: number, boundaries: number[], duration: number) => {
  const index = boundaries.findIndex((boundary) => y < boundary);
  return index < 0 ? duration : Math.max(1, index);
};

export const useJourneyInteraction = ({
  start,
  end,
  duration,
  stay,
  getBoundaries,
  onChange,
}: IInteractionOptions) => {
  const ref = useRef<HTMLDivElement>(null);
  const abort = useRef<() => void>(() => {});
  const suppressClick = useRef(false);
  const [preview, setPreview] = useState<IBlockPreview | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    let active: {
      action: TBlockAction;
      originDay: number;
      y: number;
      stop: () => void;
      range: { start: number; end: number };
    } | null = null;
    let container = element.parentElement;
    while (container && !/(auto|scroll)/.test(getComputedStyle(container).overflowY)) {
      container = container.parentElement;
    }
    const reset = () => {
      active = null;
      setPreview(null);
    };
    const cancel = () => {
      const current = active;
      reset();
      current?.stop();
    };
    abort.current = cancel;
    let initialInset = 0;
    const update = (y: number) => {
      if (!active) {
        return;
      }
      active.y = y;
      const boundaries = getBoundaries();
      const next = blockRange(
        start,
        end,
        dayAt(y, boundaries, duration) - active.originDay,
        active.action,
        duration,
      );
      active.range = next;
      const first = boundaries[next.start - 1] ?? 0;
      const last = boundaries[next.end - 1] ?? first;
      setPreview({
        ...next,
        offset: first - (boundaries[start - 1] ?? 0),
        ...(stay ? { height: Math.max(0, last - first - initialInset) } : {}),
      });
    };
    // Read the original rendered height once; preview resizing must not change its inset.
    const begin = (event: DragEvent | ResizeEvent, action: TBlockAction) => {
      suppressClick.current = true;
      const boundaries = getBoundaries();
      initialInset = Math.max(
        0,
        (boundaries[end - 1] ?? 0) -
          (boundaries[start - 1] ?? 0) -
          element.getBoundingClientRect().height,
      );
      active = {
        action,
        originDay: dayAt(event.clientY0, boundaries, duration),
        y: event.clientY,
        stop: () => event.interaction.stop(),
        range: { start, end },
      };
      const handle = element.querySelector(`[data-block-handle="${action}"]`);
      if (handle instanceof HTMLElement) {
        handle.focus({ preventScroll: true });
      }
      update(event.clientY);
    };
    const move = (event: DragEvent | ResizeEvent) => {
      update(event.clientY);
    };
    const finish = (event: DragEvent | ResizeEvent) => {
      if (!active) {
        return;
      }
      update(event.clientY);
      const next = active.range;
      reset();
      if (next.start !== start || next.end !== end) {
        onChange(next.start, next.end);
      }
    };
    const target = interact(element)
      .styleCursor(false)
      .draggable({
        ignoreFrom: '[data-block-action], [data-block-handle="start"], [data-block-handle="end"]',
        lockAxis: 'y',
        inertia: false,
        autoScroll: { enabled: true, ...(container ? { container } : {}), margin: 48, speed: 600 },
        listeners: { start: (event: DragEvent) => begin(event, 'move'), move, end: finish },
      })
      .resizable({
        enabled: stay,
        edges: {
          top: '[data-block-handle="start"]',
          bottom: '[data-block-handle="end"]',
          left: false,
          right: false,
        },
        inertia: false,
        invert: 'none',
        autoScroll: { enabled: true, ...(container ? { container } : {}), margin: 48, speed: 600 },
        listeners: {
          start: (event: ResizeEvent) => begin(event, event.edges?.top ? 'start' : 'end'),
          move,
          end: finish,
        },
      })
      .actionChecker(
        (
          _pointer: unknown,
          _event: unknown,
          action: ActionProps | null,
          interactable: ReturnType<typeof interact>,
          _element: Element,
          interaction: Interaction,
        ) => {
          // Interact's hold timer cancels when a finger moves before the hold completes.
          interactable.draggable({ hold: interaction.pointerType === 'touch' ? 350 : 0 });
          return action;
        },
      );
    const pointerDown = () => {
      suppressClick.current = false;
    };
    const touchMove = (event: TouchEvent) => {
      // Preserve native scrolling before activation; prevent native pan after the hold.
      if (active && event.cancelable) {
        event.preventDefault();
      }
    };
    const contextMenu = (event: Event) => {
      if (active) {
        event.preventDefault();
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && active) {
        event.preventDefault();
        cancel();
      }
    };
    const scroll = () => {
      if (active) {
        update(active.y);
      }
    };
    window.addEventListener('keydown', escape);
    element.addEventListener('pointerdown', pointerDown, true);
    element.addEventListener('touchstart', pointerDown, true);
    element.addEventListener('contextmenu', contextMenu);
    element.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('touchcancel', cancel, true);
    window.addEventListener('blur', cancel);
    container?.addEventListener('scroll', scroll);
    return () => {
      active?.stop();
      active = null;
      setPreview(null);
      target.unset();
      abort.current = () => {};
      window.removeEventListener('keydown', escape);
      element.removeEventListener('pointerdown', pointerDown, true);
      element.removeEventListener('touchstart', pointerDown, true);
      element.removeEventListener('contextmenu', contextMenu);
      element.removeEventListener('touchmove', touchMove);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('touchcancel', cancel, true);
      window.removeEventListener('blur', cancel);
      container?.removeEventListener('scroll', scroll);
    };
  }, [start, end, duration, stay, getBoundaries, onChange]);
  return { ref, preview, suppressClick, cancel: () => abort.current() };
};
