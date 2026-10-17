import { useAccount, guestRepositories } from './account/account-context';
import { FpsToken } from './components/fps-token';
import type { IFrameReading } from './performance/frame-monitor';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router';
import { countries } from './data/countries';
import { useCountrySelection } from './hooks/use-country-selection';
import { MobilePanels } from './components/mobile/mobile-panels';
import type { CountryList } from './types/country';
import type { CountryStatus } from './types/country-status';
import { continentDefinitions } from './types/continent';
import { MobilePanel } from './types/mobile-panel';
import type { TMobilePanel } from './types/mobile-panel';
import { startPlayground } from './three/playground';
import { TripStudio } from './components/trips/trip-studio';
import { UpcomingTrips } from './components/trips/upcoming-trips';
import {
  standaloneTripStudioPath,
  standaloneTripStudioRoutePattern,
  tripStudioLandingPath,
  tripStudioPath,
  tripStudioRoutePattern,
} from './components/trips/trip-routes';
import { initialPlanningCategories } from './components/trips/trip-planning';
import { useTrips } from './hooks/use-trips';
import type { ITrip } from './types/trip';
import { emptyTripDetails } from './types/trip';
import { emptyWishlist } from './storage/country-wishlist';
import { initialCountryBrowser } from './components/shared/country-picker/country-browser-state';
import type { ICountryBrowserState } from './components/shared/country-picker/country-browser-state';
import styles from './app.module.css';

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const studioMatch = useMatch(tripStudioRoutePattern);
  const standaloneLandingMatch = useMatch(tripStudioLandingPath);
  const standaloneStudioMatch = useMatch(standaloneTripStudioRoutePattern);
  const standaloneStudio = Boolean(standaloneLandingMatch || standaloneStudioMatch);
  const studioTripId = studioMatch?.params.tripId ?? standaloneStudioMatch?.params.tripId ?? null;
  const [panel, setPanel] = useState<TMobilePanel | null>(null);
  const [returnPanel, setReturnPanel] = useState<TMobilePanel>(MobilePanel.Trips);
  const [browser, setBrowser] = useState<ICountryBrowserState>(initialCountryBrowser);
  const [sceneMessage, setSceneMessage] = useState('');
  const [frameReading, setFrameReading] = useState<IFrameReading | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playgroundRef = useRef<ReturnType<typeof startPlayground> | null>(null);
  const account = useAccount();
  const selectionRepositoryRef = useRef(account.countries);
  const tripSession = useTrips(account.trips);
  const studioTrip = tripSession.trips.find((trip) => trip.id === studioTripId) ?? null;
  const wasInStudio = useRef(Boolean(studioTripId));
  const { showedCountries, ready, onToggle } = useCountrySelection(account.countries);
  const wishlist = useCountrySelection(account.wishlist ?? guestRepositories.wishlist, {
    initialCountries: emptyWishlist,
    limit: Infinity,
  });
  const [statuses, setStatuses] = useState<Partial<Record<CountryList, CountryStatus>>>({});
  const openTrips = () => {
    if (standaloneStudio) {
      navigate(tripStudioLandingPath);
      setPanel(null);
    } else {
      navigate('/');
      setPanel(MobilePanel.Trips);
    }
  };
  const browseAll = () => {
    navigate('/');
    setBrowser(initialCountryBrowser);
    setPanel(MobilePanel.Countries);
  };
  const openStudio = (trip: ITrip, from: TMobilePanel, standalone = false) => {
    setReturnPanel(from);
    setPanel(null);
    navigate(standalone ? standaloneTripStudioPath(trip.id) : tripStudioPath(trip.id));
  };
  const markVisited = (country: CountryList, visited: boolean) => {
    onToggle(country, visited);
    if (visited) {
      wishlist.onToggle(country, false);
    }
  };

  useEffect(() => {
    if (standaloneStudio) {
      return;
    }
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
        if (active) {
          setStatuses((current) => ({ ...current, [country]: status }));
        }
      },
      onContinentSelect: (continent) => {
        if (active) {
          setBrowser({ ...initialCountryBrowser, continent });
          setPanel(MobilePanel.Countries);
        }
      },
      onCountrySelect: (country) => {
        if (active) {
          setBrowser({
            ...initialCountryBrowser,
            continent: countries[country].continent,
            selected: country,
          });
          setPanel(MobilePanel.Countries);
        }
      },
    });
    playgroundRef.current = playground;
    return () => {
      active = false;
      playgroundRef.current = null;
      playground.dispose();
    };
  }, [standaloneStudio]);

  useEffect(() => {
    if (ready) {
      const hydrate = selectionRepositoryRef.current !== account.countries;
      selectionRepositoryRef.current = account.countries;
      void playgroundRef.current?.setCountries(showedCountries, hydrate);
    }
  }, [ready, showedCountries, account.countries]);

  useEffect(() => {
    if (wasInStudio.current && !studioTripId && panel === null && !standaloneStudio) {
      setPanel(returnPanel);
    }
    wasInStudio.current = Boolean(studioTripId);
  }, [studioTripId, panel, returnPanel, standaloneStudio]);

  useEffect(() => {
    if (location.pathname !== '/' && !studioTripId && location.pathname !== tripStudioLandingPath) {
      navigate('/', { replace: true });
      return;
    }
    if (
      studioTripId &&
      tripSession.ready &&
      !tripSession.trips.some((trip) => trip.id === studioTripId)
    ) {
      setPanel(MobilePanel.Trips);
      setReturnPanel(MobilePanel.Trips);
      navigate(standaloneStudioMatch ? tripStudioLandingPath : '/', { replace: true });
    }
  }, [location.pathname, navigate, studioTripId, tripSession.ready, tripSession.trips]);

  return (
    <main>
      {!standaloneStudio && (
        <div hidden={Boolean(studioTripId)}>
          {import.meta.env.DEV && <FpsToken reading={frameReading} />}
          <header className={styles.intro}>
            <h1>Your world</h1>
            <p>{showedCountries.length} countries I've been to</p>
            <span>Tap a glass to explore</span>
          </header>
          <ul className="visually-hidden" id="continent-descriptions">
            {continentDefinitions.map((continent) => (
              <li key={continent.id}>
                {continent.name}: visited countries:{' '}
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
            aria-label="Your visited-country glasses. Tap a glass to explore its countries, drag a glass to rotate, or drag a jelly to play. Use All countries for keyboard access."
          />
          {sceneMessage && (
            <p className={styles.message} role="status">
              {sceneMessage}
            </p>
          )}
        </div>
      )}
      {!standaloneStudio && (
        <MobilePanels
          tripSession={tripSession}
          panel={panel}
          onPanelChange={setPanel}
          onBrowseAll={browseAll}
          onOpenStudio={(trip) => openStudio(trip, MobilePanel.Trips)}
          studioOpen={Boolean(studioTripId)}
          onCollection={browseAll}
          onTrips={openTrips}
          countries={{
            state: browser,
            onStateChange: setBrowser,
            visitedCountryIds: showedCountries,
            wishlistCountryIds: wishlist.showedCountries,
            statuses,
            trips: tripSession.trips,
            disabled: !ready || !wishlist.ready || !tripSession.ready,
            onVisited: markVisited,
            onWishlist: wishlist.onToggle,
            onClose: () => setPanel(null),
            onOpenTrip: (trip) => openStudio(trip, MobilePanel.Countries),
            onPlan: (country) => {
              const details = {
                ...emptyTripDetails,
                name: `${countries[country].name} trip`,
                countryIds: [country],
                activePlanningCategories: initialPlanningCategories,
              };
              const id = tripSession.saveTrip(null, {
                ...details,
                activePlanningCategories: [...details.activePlanningCategories],
              });
              if (id) {
                openStudio(
                  {
                    ...details,
                    activePlanningCategories: [...details.activePlanningCategories],
                    id,
                  },
                  MobilePanel.Countries,
                );
              }
            },
          }}
        />
      )}
      {standaloneLandingMatch && (
        <UpcomingTrips
          fullPage
          tripSession={tripSession}
          onOpenStudio={(trip) => openStudio(trip, MobilePanel.Trips, true)}
        />
      )}
      {studioTrip && (
        <TripStudio
          key={studioTrip.id}
          trip={studioTrip}
          tripSession={tripSession}
          backLabel={
            returnPanel === MobilePanel.Countries
              ? `Back to ${continentDefinitions.find((item) => item.id === browser.continent)?.name ?? 'your countries'}`
              : 'Back to trips'
          }
          visitedCountryIds={showedCountries}
          onConfirmVisits={(ids) => {
            ids.forEach((country) => markVisited(country, true));
            tripSession.saveTrip(studioTrip.id, {
              ...studioTrip,
              visitedCountryIds: [...new Set([...(studioTrip.visitedCountryIds ?? []), ...ids])],
            });
            const added = ids.filter((country) => !showedCountries.includes(country));
            setSceneMessage(
              added.length
                ? `${added.map((country) => countries[country].name).join(', ')} added to Been to. Your world has grown.`
                : 'Visit confirmed. Your collection is up to date.',
            );
            navigate(standaloneStudioMatch ? tripStudioLandingPath : '/', { replace: true });
            setPanel(null);
          }}
          onBack={() => {
            if (standaloneStudioMatch) {
              navigate(tripStudioLandingPath, { replace: true });
              setPanel(null);
            } else {
              navigate('/', { replace: true });
              setPanel(returnPanel);
            }
          }}
          onTrips={openTrips}
        />
      )}
      {studioTripId && !studioTrip && !tripSession.ready && (
        <p role="status" aria-live="polite">
          Loading trip…
        </p>
      )}
    </main>
  );
};
