import { useAccount } from './account/account-context';
import { FpsToken } from './components/fps-token';
import type { IFrameReading } from './performance/frame-monitor';
import { useEffect, useRef, useState } from 'react';
import { countries } from './data/countries';
import { useCountrySelection } from './hooks/use-country-selection';
import { MobilePanels } from './components/mobile/mobile-panels';
import { CountryOpportunity } from './components/country-opportunity';
import type { CountryList } from './types/country';
import type { CountryStatus } from './types/country-status';
import { continentDefinitions } from './types/continent';
import { startPlayground } from './three/playground';
import { TripStudio } from './components/trips/trip-studio';
import { useTrips } from './hooks/use-trips';

export const App = () => {
  const [studioTripId, setStudioTripId] = useState<string | null>(null);
  const [listRequest, setListRequest] = useState(0);
  const [collectionRequest, setCollectionRequest] = useState(0);
  const [focusedCountry, setFocusedCountry] = useState<CountryList | null>(null);
  const [planDraft, setPlanDraft] = useState<{
    country: CountryList;
    request: number;
  } | null>(null);
  const closeStudio = () => {
    setStudioTripId(null);
    setCollectionRequest((value) => value + 1);
  };
  const openTrips = () => {
    setStudioTripId(null);
    setListRequest((value) => value + 1);
  };
  const [frameReading, setFrameReading] = useState<IFrameReading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const account = useAccount();
  const selectionRepositoryRef = useRef(account.countries);
  const tripSession = useTrips(account.trips);
  const studioTrip = tripSession.trips.find((trip) => trip.id === studioTripId) ?? null;
  const { showedCountries, ready, onToggle, onClear } = useCountrySelection(account.countries);
  const [statuses, setStatuses] = useState<Partial<Record<CountryList, CountryStatus>>>({});
  const selectedCountry =
    focusedCountry && showedCountries.includes(focusedCountry)
      ? focusedCountry
      : (showedCountries[0] ?? null);
  const selectedTrip = selectedCountry
    ? tripSession.trips.find((trip) => trip.countryIds.includes(selectedCountry))
    : null;
  const toggleCountry = (country: CountryList, checked: boolean) => {
    onToggle(country, checked);
    if (checked) {
      setFocusedCountry(country);
    }
  };

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
      onCountrySelect: (country) => {
        if (active) {
          setFocusedCountry(country);
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
      const hydrate = selectionRepositoryRef.current !== account.countries;
      selectionRepositoryRef.current = account.countries;
      if (hydrate) {
        void playgroundRef.current?.setCountries(showedCountries, true);
      } else {
        void playgroundRef.current?.setCountries(showedCountries);
      }
    }
  }, [ready, showedCountries, account.countries]);

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
        <CountryOpportunity
          country={selectedCountry}
          disabled={!tripSession.ready}
          tripName={selectedTrip?.name}
          onPlan={(country) => {
            const existing = tripSession.trips.find((trip) => trip.countryIds.includes(country));
            if (existing) {
              setStudioTripId(existing.id);
              return;
            }
            setPlanDraft((current) => ({
              country,
              request: (current?.request ?? 0) + 1,
            }));
          }}
        />
      </div>
      <MobilePanels
        tripSession={tripSession}
        onOpenStudio={(trip) => setStudioTripId(trip.id)}
        studioOpen={Boolean(studioTrip)}
        onCollection={closeStudio}
        onTrips={openTrips}
        listRequest={listRequest}
        collectionRequest={collectionRequest}
        planCountry={planDraft?.country}
        planRequest={planDraft?.request}
        showedCountries={showedCountries}
        statuses={statuses}
        disabled={!ready}
        onToggle={toggleCountry}
        onClear={onClear}
      />
      {studioTrip && (
        <TripStudio
          key={studioTrip.id}
          trip={studioTrip}
          tripSession={tripSession}
          onBack={closeStudio}
          onTrips={openTrips}
        />
      )}
    </main>
  );
};
