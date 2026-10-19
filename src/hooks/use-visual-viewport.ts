import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

interface IViewportStyle extends CSSProperties {
  '--visible-height': string;
  '--visible-top': string;
}

export const useVisualViewport = (active = true): IViewportStyle => {
  const measure = (): IViewportStyle => ({
    '--visible-height': `${window.visualViewport?.height ?? window.innerHeight}px`,
    '--visible-top': `${window.visualViewport?.offsetTop ?? 0}px`,
  });
  const [style, setStyle] = useState(measure);
  useEffect(() => {
    if (!active) {
      return;
    }
    const viewport = window.visualViewport;
    const update = () =>
      setStyle({
        '--visible-height': `${viewport?.height ?? window.innerHeight}px`,
        '--visible-top': `${viewport?.offsetTop ?? 0}px`,
      });
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [active]);
  return style;
};
