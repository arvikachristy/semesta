import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  COUNTRY_CODES,
  COUNTRY_META,
  CountryCode,
  isCountryCode,
  type TCountryCode,
} from './types/country';
import { startPlayground } from './three/playground';
import { continents } from './three/glasses/continents';

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
    const selectedCountry = event.target.value;
    if (!isCountryCode(selectedCountry)) {
      return;
    }
    setLeftCountry(selectedCountry);
    setLoadError(false);
    void playgroundRef.current
      ?.setCountries(selectedCountry, rightCountry)
      .catch(() => setLoadError(true));
  };

  const onRightCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedCountry = event.target.value;
    if (!isCountryCode(selectedCountry)) {
      return;
    }
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
                {COUNTRY_META[code].name}
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
                {COUNTRY_META[code].name}
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
      <ul className="visually-hidden" id="continent-descriptions">
        {continents.map((continent) => (
          <li key={continent.id}>
            {continent.name}: an empty amber-tinted glass with a gold continent map and name.
          </li>
        ))}
      </ul>
      <canvas
        ref={canvasRef}
        aria-describedby="continent-descriptions"
        aria-label="Three playground: select a flag, grab a flag to stretch its jelly, or drag the background to move around."
      />
    </main>
  );
};
