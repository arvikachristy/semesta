import { FpsToken } from './components/fps-token';
import type { IFrameReading } from './performance/frame-monitor';
import { useEffect, useRef, useState } from 'react';
import { countries } from './data/countries';
import { useCountrySelection } from './hooks/use-country-selection';
import { MobilePanels } from './components/mobile/mobile-panels';
import type { CountryList } from './types/country';
import type { CountryStatus } from './types/country-status';
import { continentDefinitions } from './types/continent';
import { startPlayground } from './three/playground';

export const App = () => {
  const [frameReading, setFrameReading] = useState<IFrameReading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const { showedCountries, ready, onToggle, onClear } = useCountrySelection();
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
    if (ready) {
      void playgroundRef.current?.setCountries(showedCountries);
    }
  }, [ready, showedCountries]);

  return (
    <main>
      <FpsToken reading={frameReading} />
      <MobilePanels
        showedCountries={showedCountries}
        statuses={statuses}
        disabled={!ready}
        onToggle={onToggle}
        onClear={onClear}
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
