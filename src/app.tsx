import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { startPlayground } from './three/playground';
import { flags } from './three/flags';
import type { TCountryCode } from './three/flags';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const [leftCountry, setLeftCountry] = useState<TCountryCode>('ID');
  const [rightCountry, setRightCountry] = useState<TCountryCode>('FR');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const playground = startPlayground(canvas);
    playgroundRef.current = playground;
    void playground.setCountries('ID', 'FR').catch(() => setLoadError(true));

    return () => {
      playgroundRef.current = null;
      playground.dispose();
    };
  }, []);

  const onLeftCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = event.target.value as TCountryCode;
    setLeftCountry(selectedCountry);
    setLoadError(false);
    void playgroundRef.current
      ?.setCountries(selectedCountry, rightCountry)
      .catch(() => setLoadError(true));
  };

  const onRightCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = event.target.value as TCountryCode;
    setRightCountry(selectedCountry);
    setLoadError(false);
    void playgroundRef.current
      ?.setCountries(leftCountry, selectedCountry)
      .catch(() => setLoadError(true));
  };

  return (
    <main>
      <div className="country-selector left-country">
        <label>
          Left Flag
          <select value={leftCountry} onChange={onLeftCountryChange}>
            {Object.values(flags).map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="country-selector right-country">
        <label>
          Right Flag
          <select value={rightCountry} onChange={onRightCountryChange}>
            {Object.values(flags).map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
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
