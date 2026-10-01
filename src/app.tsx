import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  COUNTRY_CODES,
  COUNTRY_NAME_BY_CODE,
  CountryCode,
  type TCountryCode,
} from './types/country';
import { startPlayground } from './three/playground';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const [leftCountry, setLeftCountry] = useState<TCountryCode>(CountryCode.ID);
  const [rightCountry, setRightCountry] = useState<TCountryCode>(CountryCode.FR);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const playground = startPlayground(canvas);
    playgroundRef.current = playground;
    void playground.setCountries(CountryCode.ID, CountryCode.FR).catch(() => setLoadError(true));

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
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_NAME_BY_CODE[code]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="country-selector right-country">
        <label>
          Right Flag
          <select value={rightCountry} onChange={onRightCountryChange}>
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_NAME_BY_CODE[code]}
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
        aria-label="Three playground: select a flag, grab a flag to stretch its jelly, or drag the background to move around."
      />
    </main>
  );
};
