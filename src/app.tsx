import { useAccount } from './account/account-context';
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
import { TripStudio } from './components/trips/trip-studio';
import { useTrips } from './hooks/use-trips';

export const App = () => {
  const [studioTripId, setStudioTripId] = useState<string | null>(null);
  const [listRequest, setListRequest] = useState(0);
  const openTrips = () => {
    setStudioTripId(null);
    setListRequest((value) => value + 1);
  };
  const [frameReading, setFrameReading] = useState<IFrameReading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const account = useAccount();
  const tripSession = useTrips(account.trips);
  const studioTrip = tripSession.trips.find((trip) => trip.id === studioTripId) ?? null;
  const { showedCountries, ready, onToggle, onClear } = useCountrySelection(account.countries);
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
      <div hidden={Boolean(studioTrip)}>
        <FpsToken reading={frameReading} />
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
      </div>
      <MobilePanels
        tripSession={tripSession}
        onOpenStudio={(trip) => setStudioTripId(trip.id)}
        studioOpen={Boolean(studioTrip)}
        onCollection={openTrips}
        onTrips={openTrips}
        listRequest={listRequest}
        showedCountries={showedCountries}
        statuses={statuses}
        disabled={!ready}
        onToggle={onToggle}
        onClear={onClear}
      />
      {studioTrip && (
        <TripStudio
          key={studioTrip.id}
          trip={studioTrip}
          tripSession={tripSession}
          onBack={openTrips}
          onTrips={openTrips}
        />
      )}
    </main>
  );
};
