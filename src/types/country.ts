export enum CountryCode {
  ID = 'ID',
  NP = 'NP',
  FR = 'FR',
  DE = 'DE',
  PL = 'PL',
  KZ = 'KZ',
  BN = 'BN',
}

export type TCountryCode = CountryCode;

export interface ICountryMeta {
  code: TCountryCode;
  name: string;
}

export const COUNTRY_META: Record<TCountryCode, ICountryMeta> = {
  [CountryCode.ID]: { code: CountryCode.ID, name: 'Indonesia' },
  [CountryCode.NP]: { code: CountryCode.NP, name: 'Nepal' },
  [CountryCode.FR]: { code: CountryCode.FR, name: 'France' },
  [CountryCode.DE]: { code: CountryCode.DE, name: 'Germany' },
  [CountryCode.PL]: { code: CountryCode.PL, name: 'Poland' },
  [CountryCode.KZ]: { code: CountryCode.KZ, name: 'Kazakhstan' },
  [CountryCode.BN]: { code: CountryCode.BN, name: 'Brunei' },
};

export const COUNTRY_CODES = Object.values(CountryCode) as TCountryCode[];
export const COUNTRY_NAME_BY_CODE = Object.fromEntries(
  Object.values(COUNTRY_META).map(({ code, name }) => [code, name]),
) as Record<TCountryCode, string>;
export const COUNTRY_CODE_BY_NAME = Object.fromEntries(
  Object.values(COUNTRY_META).map(({ code, name }) => [name, code]),
) as Record<string, TCountryCode>;
