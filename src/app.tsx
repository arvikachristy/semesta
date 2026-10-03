import { FpsToken } from './components/fps-token';
import type { IFrameReading } from './performance/frame-monitor';
import { useEffect, useRef, useState } from 'react';
import { countries, defaultCountries, toggleCountry } from './data/countries';
import { CountrySelector } from './components/country-selector';
import type { CountryList } from './types/country';
import { CountryStatus } from './types/country-status';
import { continentDefinitions } from './types/continent';
import { startPlayground } from './three/playground';
import { glassParameters } from './three/glasses/glass-parameters';

export const App = () => {
  const [frameReading, setFrameReading] = useState<IFrameReading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const [showedCountries, setShowedCountries] = useState<CountryList[]>(() => [
    ...defaultCountries,
  ]);
  const [statuses, setStatuses] = useState<Partial<Record<CountryList, CountryStatus>>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    let active = true;
    const playground = startPlayground(canvas, {
      onFrameReading: (reading) => {
        if (active) {
          setFrameReading(reading);
        }
      },
      onCountryStatus: (country, status) => {
        if (!active) {
          return;
        }
        setStatuses((current) => ({ ...current, [country]: status }));
        if (status === CountryStatus.Error) {
          setShowedCountries((current) => current.filter((id) => id !== country));
        }
      },
    });
    playgroundRef.current = playground;
    return () => {
      active = false;
      playgroundRef.current = null;
      playground.dispose();
    };
  }, []);

  useEffect(() => {
    void playgroundRef.current?.setCountries(showedCountries);
  }, [showedCountries]);

  return (
    <main>
      <FpsToken reading={frameReading} />
      <CountrySelector
        showedCountries={showedCountries}
        statuses={statuses}
        onToggle={(country, checked) =>
          setShowedCountries((current) =>
            toggleCountry(current, country, checked, glassParameters.capacity),
          )
        }
      />
      <ul className="visually-hidden" id="continent-descriptions">
        {continentDefinitions.map((continent) => (
          <li key={continent.id}>
            {continent.name}: gold-marked amber glass. Selected countries:{' '}
            {showedCountries
              .filter((id) => countries[id].continent === continent.id)
              .map((id) => countries[id].name)
              .join(', ') || 'none'}
            .
          </li>
        ))}
      </ul>
      <canvas
        ref={canvasRef}
        aria-describedby="continent-descriptions"
        aria-label="Three playground: select countries below, grab their jellies inside the glasses, drag a glass to turn the circle, or drag the background to pan."
      />
    </main>
  );
};
