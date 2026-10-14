import type { CountryList } from '../types/country';
import { countries } from '../data/countries';
import { flagAssetPath } from '../data/flag-definitions';
import { continentDefinitions } from '../types/continent';
import { Button, ButtonVariant } from './ui/button';
import ui from './ui/ui.module.css';
import styles from './country-opportunity.module.css';

interface ICountryOpportunityProps {
  country: CountryList | null;
  disabled: boolean;
  onPlan: (country: CountryList) => void;
}

export const CountryOpportunity = ({ country, disabled, onPlan }: ICountryOpportunityProps) => {
  const definition = country ? countries[country] : null;
  const continent = definition
    ? continentDefinitions.find((item) => item.id === definition.continent)
    : null;

  return (
    <>
      <header className={styles.intro}>
        <span className={styles.brand}>Semesta</span>
        <span>Your country bucket list</span>
      </header>
      {country && definition && (
        <aside
          className={`${ui.surface} ${ui.raised} ${styles.card}`}
          aria-label="Selected country"
        >
          <img src={flagAssetPath(country)} alt="" />
          <div className={styles.copy}>
            <strong>{definition.name}</strong>
            <span>In your {continent?.name ?? 'continent'} glass</span>
          </div>
          <Button
            variant={ButtonVariant.Primary}
            disabled={disabled}
            onClick={() => onPlan(country)}
          >
            Plan a trip
          </Button>
        </aside>
      )}
    </>
  );
};
