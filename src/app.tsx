import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { startPlayground } from './three/playground';
import { flags } from './three/flags';
import type { TCountryCode } from './three/flags';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const [country, setCountry] = useState<TCountryCode>('ID');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const playground = startPlayground(canvas);
    playgroundRef.current = playground;
    void playground.setCountry('ID').catch(() => setLoadError(true));

    return () => {
      playgroundRef.current = null;
      playground.dispose();
    };
  }, []);

  const onCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = event.target.value as TCountryCode;
    setCountry(selectedCountry);
    setLoadError(false);
    void playgroundRef.current?.setCountry(selectedCountry).catch(() => setLoadError(true));
  };

  return (
    <main>
      <label className="country-selector">
        Flag
        <select value={country} onChange={onCountryChange}>
          {Object.values(flags).map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {loadError && (
        <span className="load-error" role="alert">
          Could not load the flag.
        </span>
      )}
      <canvas
        ref={canvasRef}
        aria-label="Three playground: select a flag, tap the solid to rotate it, or drag the background to move around."
      />
    </main>
  );
};
