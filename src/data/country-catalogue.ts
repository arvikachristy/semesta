// Pinned source and catalogue scope: public/flags/README.md.
import { CountryList } from '../types/country';
import { ContinentId } from '../types/continent';

import { createCountryDefinition } from './flag-definitions';
import type { ICountryDefinition } from './flag-definitions';

export const countryCatalogue: Record<CountryList, ICountryDefinition> = {
  [CountryList.Indonesia]: createCountryDefinition(CountryList.Indonesia, {
    name: 'Indonesia',
    continent: ContinentId.Asia,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Nepal]: createCountryDefinition(CountryList.Nepal, {
    name: 'Nepal',
    continent: ContinentId.Asia,
    size: { width: 71.571, height: 87.246 },
  }),
  [CountryList.France]: createCountryDefinition(CountryList.France, {
    name: 'France',
    continent: ContinentId.Europe,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Germany]: createCountryDefinition(CountryList.Germany, {
    name: 'Germany',
    continent: ContinentId.Europe,
    size: { width: 5.0, height: 3.0 },
  }),
  [CountryList.Poland]: createCountryDefinition(CountryList.Poland, {
    name: 'Poland',
    continent: ContinentId.Europe,
    size: { width: 16.0, height: 10.0 },
  }),
  [CountryList.Kazakhstan]: createCountryDefinition(CountryList.Kazakhstan, {
    name: 'Kazakhstan',
    continent: ContinentId.Asia,
    size: { width: 2000.0, height: 1000.0 },
  }),
  [CountryList.Brunei]: createCountryDefinition(CountryList.Brunei, {
    name: 'Brunei',
    continent: ContinentId.Asia,
    size: { width: 1440.0, height: 720.0 },
  }),
  [CountryList.Afghanistan]: createCountryDefinition(CountryList.Afghanistan, {
    name: 'Afghanistan',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Albania]: createCountryDefinition(CountryList.Albania, {
    name: 'Albania',
    continent: ContinentId.Europe,
    size: { width: 980.0, height: 700.0 },
  }),
  [CountryList.Algeria]: createCountryDefinition(CountryList.Algeria, {
    name: 'Algeria',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Andorra]: createCountryDefinition(CountryList.Andorra, {
    name: 'Andorra',
    continent: ContinentId.Europe,
    size: { width: 1000.0, height: 700.0 },
  }),
  [CountryList.Angola]: createCountryDefinition(CountryList.Angola, {
    name: 'Angola',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.AntiguaAndBarbuda]: createCountryDefinition(CountryList.AntiguaAndBarbuda, {
    name: 'Antigua and Barbuda',
    continent: ContinentId.NorthAmerica,
    size: { width: 138.0, height: 92.0 },
  }),
  [CountryList.Argentina]: createCountryDefinition(CountryList.Argentina, {
    name: 'Argentina',
    continent: ContinentId.SouthAmerica,
    size: { width: 800.0, height: 500.0 },
  }),
  [CountryList.Armenia]: createCountryDefinition(CountryList.Armenia, {
    name: 'Armenia',
    continent: ContinentId.Asia,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Australia]: createCountryDefinition(CountryList.Australia, {
    name: 'Australia',
    continent: ContinentId.Oceania,
    size: { width: 10080.0, height: 5040.0 },
  }),
  [CountryList.Austria]: createCountryDefinition(CountryList.Austria, {
    name: 'Austria',
    continent: ContinentId.Europe,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.Azerbaijan]: createCountryDefinition(CountryList.Azerbaijan, {
    name: 'Azerbaijan',
    continent: ContinentId.Asia,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Bahamas]: createCountryDefinition(CountryList.Bahamas, {
    name: 'Bahamas',
    continent: ContinentId.NorthAmerica,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Bahrain]: createCountryDefinition(CountryList.Bahrain, {
    name: 'Bahrain',
    continent: ContinentId.Asia,
    size: { width: 1500.0, height: 900.0 },
  }),
  [CountryList.Bangladesh]: createCountryDefinition(CountryList.Bangladesh, {
    name: 'Bangladesh',
    continent: ContinentId.Asia,
    size: { width: 20.0, height: 12.0 },
  }),
  [CountryList.Barbados]: createCountryDefinition(CountryList.Barbados, {
    name: 'Barbados',
    continent: ContinentId.NorthAmerica,
    size: { width: 24000.0, height: 16000.0 },
  }),
  [CountryList.Belarus]: createCountryDefinition(CountryList.Belarus, {
    name: 'Belarus',
    continent: ContinentId.Europe,
    size: { width: 900.0, height: 450.0 },
  }),
  [CountryList.Belgium]: createCountryDefinition(CountryList.Belgium, {
    name: 'Belgium',
    continent: ContinentId.Europe,
    size: { width: 45.0, height: 39.0 },
  }),
  [CountryList.Belize]: createCountryDefinition(CountryList.Belize, {
    name: 'Belize',
    continent: ContinentId.NorthAmerica,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Benin]: createCountryDefinition(CountryList.Benin, {
    name: 'Benin',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Bhutan]: createCountryDefinition(CountryList.Bhutan, {
    name: 'Bhutan',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Bolivia]: createCountryDefinition(CountryList.Bolivia, {
    name: 'Bolivia',
    continent: ContinentId.SouthAmerica,
    size: { width: 291.042, height: 198.438 },
  }),
  [CountryList.BosniaAndHerzegovina]: createCountryDefinition(CountryList.BosniaAndHerzegovina, {
    name: 'Bosnia and Herzegovina',
    continent: ContinentId.Europe,
    size: { width: 16.0, height: 8.0 },
  }),
  [CountryList.Botswana]: createCountryDefinition(CountryList.Botswana, {
    name: 'Botswana',
    continent: ContinentId.Africa,
    size: { width: 36.0, height: 24.0 },
  }),
  [CountryList.Brazil]: createCountryDefinition(CountryList.Brazil, {
    name: 'Brazil',
    continent: ContinentId.SouthAmerica,
    size: { width: 4200.0, height: 2940.0 },
  }),
  [CountryList.Bulgaria]: createCountryDefinition(CountryList.Bulgaria, {
    name: 'Bulgaria',
    continent: ContinentId.Europe,
    size: { width: 5.0, height: 3.0 },
  }),
  [CountryList.BurkinaFaso]: createCountryDefinition(CountryList.BurkinaFaso, {
    name: 'Burkina Faso',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Burundi]: createCountryDefinition(CountryList.Burundi, {
    name: 'Burundi',
    continent: ContinentId.Africa,
    size: { width: 500.0, height: 300.0 },
  }),
  [CountryList.Cambodia]: createCountryDefinition(CountryList.Cambodia, {
    name: 'Cambodia',
    continent: ContinentId.Asia,
    size: { width: 625.0, height: 400.0 },
  }),
  [CountryList.Cameroon]: createCountryDefinition(CountryList.Cameroon, {
    name: 'Cameroon',
    continent: ContinentId.Africa,
    size: { width: 90.0, height: 60.0 },
  }),
  [CountryList.Canada]: createCountryDefinition(CountryList.Canada, {
    name: 'Canada',
    continent: ContinentId.NorthAmerica,
    size: { width: 9600.0, height: 4800.0 },
  }),
  [CountryList.CapeVerde]: createCountryDefinition(CountryList.CapeVerde, {
    name: 'Cape Verde',
    continent: ContinentId.Africa,
    size: { width: 510.0, height: 300.0 },
  }),
  [CountryList.CentralAfricanRepublic]: createCountryDefinition(
    CountryList.CentralAfricanRepublic,
    {
      name: 'Central African Republic',
      continent: ContinentId.Africa,
      size: { width: 12.0, height: 8.0 },
    },
  ),
  [CountryList.Chad]: createCountryDefinition(CountryList.Chad, {
    name: 'Chad',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Chile]: createCountryDefinition(CountryList.Chile, {
    name: 'Chile',
    continent: ContinentId.SouthAmerica,
    size: { width: 24.0, height: 16.0 },
  }),
  [CountryList.China]: createCountryDefinition(CountryList.China, {
    name: 'China',
    continent: ContinentId.Asia,
    size: { width: 30.0, height: 20.0 },
  }),
  [CountryList.Colombia]: createCountryDefinition(CountryList.Colombia, {
    name: 'Colombia',
    continent: ContinentId.SouthAmerica,
    size: { width: 6.0, height: 4.0 },
  }),
  [CountryList.Comoros]: createCountryDefinition(CountryList.Comoros, {
    name: 'Comoros',
    continent: ContinentId.Africa,
    size: { width: 500.0, height: 300.0 },
  }),
  [CountryList.Congo]: createCountryDefinition(CountryList.Congo, {
    name: 'Congo',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.CostaRica]: createCountryDefinition(CountryList.CostaRica, {
    name: 'Costa Rica',
    continent: ContinentId.NorthAmerica,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Croatia]: createCountryDefinition(CountryList.Croatia, {
    name: 'Croatia',
    continent: ContinentId.Europe,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Cuba]: createCountryDefinition(CountryList.Cuba, {
    name: 'Cuba',
    continent: ContinentId.NorthAmerica,
    size: { width: 800.0, height: 400.0 },
  }),
  [CountryList.Cyprus]: createCountryDefinition(CountryList.Cyprus, {
    name: 'Cyprus',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Czechia]: createCountryDefinition(CountryList.Czechia, {
    name: 'Czechia',
    continent: ContinentId.Europe,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.DRCongo]: createCountryDefinition(CountryList.DRCongo, {
    name: 'DR Congo',
    continent: ContinentId.Africa,
    size: { width: 800.0, height: 600.0 },
  }),
  [CountryList.Denmark]: createCountryDefinition(CountryList.Denmark, {
    name: 'Denmark',
    continent: ContinentId.Europe,
    size: { width: 370.0, height: 280.0 },
  }),
  [CountryList.Djibouti]: createCountryDefinition(CountryList.Djibouti, {
    name: 'Djibouti',
    continent: ContinentId.Africa,
    size: { width: 15.0, height: 10.0 },
  }),
  [CountryList.Dominica]: createCountryDefinition(CountryList.Dominica, {
    name: 'Dominica',
    continent: ContinentId.NorthAmerica,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.DominicanRepublic]: createCountryDefinition(CountryList.DominicanRepublic, {
    name: 'Dominican Republic',
    continent: ContinentId.NorthAmerica,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Ecuador]: createCountryDefinition(CountryList.Ecuador, {
    name: 'Ecuador',
    continent: ContinentId.SouthAmerica,
    size: { width: 1440.0, height: 960.0 },
  }),
  [CountryList.Egypt]: createCountryDefinition(CountryList.Egypt, {
    name: 'Egypt',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.ElSalvador]: createCountryDefinition(CountryList.ElSalvador, {
    name: 'El Salvador',
    continent: ContinentId.NorthAmerica,
    size: { width: 1005.0, height: 567.0 },
  }),
  [CountryList.EquatorialGuinea]: createCountryDefinition(CountryList.EquatorialGuinea, {
    name: 'Equatorial Guinea',
    continent: ContinentId.Africa,
    size: { width: 3600.0, height: 2400.0 },
  }),
  [CountryList.Eritrea]: createCountryDefinition(CountryList.Eritrea, {
    name: 'Eritrea',
    continent: ContinentId.Africa,
    size: { width: 14400.0, height: 7200.0 },
  }),
  [CountryList.Estonia]: createCountryDefinition(CountryList.Estonia, {
    name: 'Estonia',
    continent: ContinentId.Europe,
    size: { width: 33.0, height: 21.0 },
  }),
  [CountryList.Eswatini]: createCountryDefinition(CountryList.Eswatini, {
    name: 'Eswatini',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Ethiopia]: createCountryDefinition(CountryList.Ethiopia, {
    name: 'Ethiopia',
    continent: ContinentId.Africa,
    size: { width: 720.0, height: 360.0 },
  }),
  [CountryList.Fiji]: createCountryDefinition(CountryList.Fiji, {
    name: 'Fiji',
    continent: ContinentId.Oceania,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Finland]: createCountryDefinition(CountryList.Finland, {
    name: 'Finland',
    continent: ContinentId.Europe,
    size: { width: 1800.0, height: 1100.0 },
  }),
  [CountryList.Gabon]: createCountryDefinition(CountryList.Gabon, {
    name: 'Gabon',
    continent: ContinentId.Africa,
    size: { width: 400.0, height: 300.0 },
  }),
  [CountryList.Gambia]: createCountryDefinition(CountryList.Gambia, {
    name: 'Gambia',
    continent: ContinentId.Africa,
    size: { width: 27.0, height: 18.0 },
  }),
  [CountryList.Georgia]: createCountryDefinition(CountryList.Georgia, {
    name: 'Georgia',
    continent: ContinentId.Asia,
    size: { width: 300.0, height: 200.0 },
  }),
  [CountryList.Ghana]: createCountryDefinition(CountryList.Ghana, {
    name: 'Ghana',
    continent: ContinentId.Africa,
    size: { width: 450.0, height: 300.0 },
  }),
  [CountryList.Greece]: createCountryDefinition(CountryList.Greece, {
    name: 'Greece',
    continent: ContinentId.Europe,
    size: { width: 27.0, height: 18.0 },
  }),
  [CountryList.Grenada]: createCountryDefinition(CountryList.Grenada, {
    name: 'Grenada',
    continent: ContinentId.NorthAmerica,
    size: { width: 500.0, height: 300.0 },
  }),
  [CountryList.Guatemala]: createCountryDefinition(CountryList.Guatemala, {
    name: 'Guatemala',
    continent: ContinentId.NorthAmerica,
    size: { width: 960.0, height: 600.0 },
  }),
  [CountryList.Guinea]: createCountryDefinition(CountryList.Guinea, {
    name: 'Guinea',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.GuineaBissau]: createCountryDefinition(CountryList.GuineaBissau, {
    name: 'Guinea-Bissau',
    continent: ContinentId.Africa,
    size: { width: 12.0, height: 6.0 },
  }),
  [CountryList.Guyana]: createCountryDefinition(CountryList.Guyana, {
    name: 'Guyana',
    continent: ContinentId.SouthAmerica,
    size: { width: 500.0, height: 300.0 },
  }),
  [CountryList.Haiti]: createCountryDefinition(CountryList.Haiti, {
    name: 'Haiti',
    continent: ContinentId.NorthAmerica,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Honduras]: createCountryDefinition(CountryList.Honduras, {
    name: 'Honduras',
    continent: ContinentId.NorthAmerica,
    size: { width: 1260.0, height: 630.0 },
  }),
  [CountryList.Hungary]: createCountryDefinition(CountryList.Hungary, {
    name: 'Hungary',
    continent: ContinentId.Europe,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Iceland]: createCountryDefinition(CountryList.Iceland, {
    name: 'Iceland',
    continent: ContinentId.Europe,
    size: { width: 25.0, height: 18.0 },
  }),
  [CountryList.India]: createCountryDefinition(CountryList.India, {
    name: 'India',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Iran]: createCountryDefinition(CountryList.Iran, {
    name: 'Iran',
    continent: ContinentId.Asia,
    size: { width: 630.0, height: 360.0 },
  }),
  [CountryList.Iraq]: createCountryDefinition(CountryList.Iraq, {
    name: 'Iraq',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Ireland]: createCountryDefinition(CountryList.Ireland, {
    name: 'Ireland',
    continent: ContinentId.Europe,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Israel]: createCountryDefinition(CountryList.Israel, {
    name: 'Israel',
    continent: ContinentId.Asia,
    size: { width: 1100.0, height: 800.0 },
  }),
  [CountryList.Italy]: createCountryDefinition(CountryList.Italy, {
    name: 'Italy',
    continent: ContinentId.Europe,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.IvoryCoast]: createCountryDefinition(CountryList.IvoryCoast, {
    name: 'Ivory Coast',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Jamaica]: createCountryDefinition(CountryList.Jamaica, {
    name: 'Jamaica',
    continent: ContinentId.NorthAmerica,
    size: { width: 12.0, height: 6.0 },
  }),
  [CountryList.Japan]: createCountryDefinition(CountryList.Japan, {
    name: 'Japan',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Jordan]: createCountryDefinition(CountryList.Jordan, {
    name: 'Jordan',
    continent: ContinentId.Asia,
    size: { width: 840.0, height: 420.0 },
  }),
  [CountryList.Kenya]: createCountryDefinition(CountryList.Kenya, {
    name: 'Kenya',
    continent: ContinentId.Africa,
    size: { width: 240.0, height: 160.0 },
  }),
  [CountryList.Kiribati]: createCountryDefinition(CountryList.Kiribati, {
    name: 'Kiribati',
    continent: ContinentId.Oceania,
    size: { width: 600.0, height: 300.0 },
  }),
  [CountryList.Kuwait]: createCountryDefinition(CountryList.Kuwait, {
    name: 'Kuwait',
    continent: ContinentId.Asia,
    size: { width: 12.0, height: 6.0 },
  }),
  [CountryList.Kyrgyzstan]: createCountryDefinition(CountryList.Kyrgyzstan, {
    name: 'Kyrgyzstan',
    continent: ContinentId.Asia,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Laos]: createCountryDefinition(CountryList.Laos, {
    name: 'Laos',
    continent: ContinentId.Asia,
    size: { width: 6.0, height: 4.0 },
  }),
  [CountryList.Latvia]: createCountryDefinition(CountryList.Latvia, {
    name: 'Latvia',
    continent: ContinentId.Europe,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Lebanon]: createCountryDefinition(CountryList.Lebanon, {
    name: 'Lebanon',
    continent: ContinentId.Asia,
    size: { width: 750.0, height: 500.0 },
  }),
  [CountryList.Lesotho]: createCountryDefinition(CountryList.Lesotho, {
    name: 'Lesotho',
    continent: ContinentId.Africa,
    size: { width: 450.0, height: 300.0 },
  }),
  [CountryList.Liberia]: createCountryDefinition(CountryList.Liberia, {
    name: 'Liberia',
    continent: ContinentId.Africa,
    size: { width: 209.0, height: 110.0 },
  }),
  [CountryList.Libya]: createCountryDefinition(CountryList.Libya, {
    name: 'Libya',
    continent: ContinentId.Africa,
    size: { width: 960.0, height: 480.0 },
  }),
  [CountryList.Liechtenstein]: createCountryDefinition(CountryList.Liechtenstein, {
    name: 'Liechtenstein',
    continent: ContinentId.Europe,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Lithuania]: createCountryDefinition(CountryList.Lithuania, {
    name: 'Lithuania',
    continent: ContinentId.Europe,
    size: { width: 5.0, height: 3.0 },
  }),
  [CountryList.Luxembourg]: createCountryDefinition(CountryList.Luxembourg, {
    name: 'Luxembourg',
    continent: ContinentId.Europe,
    size: { width: 10.0, height: 6.0 },
  }),
  [CountryList.Madagascar]: createCountryDefinition(CountryList.Madagascar, {
    name: 'Madagascar',
    continent: ContinentId.Africa,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Malawi]: createCountryDefinition(CountryList.Malawi, {
    name: 'Malawi',
    continent: ContinentId.Africa,
    size: { width: 450.0, height: 300.0 },
  }),
  [CountryList.Malaysia]: createCountryDefinition(CountryList.Malaysia, {
    name: 'Malaysia',
    continent: ContinentId.Asia,
    size: { width: 13440.0, height: 6720.0 },
  }),
  [CountryList.Maldives]: createCountryDefinition(CountryList.Maldives, {
    name: 'Maldives',
    continent: ContinentId.Asia,
    size: { width: 720.0, height: 480.0 },
  }),
  [CountryList.Mali]: createCountryDefinition(CountryList.Mali, {
    name: 'Mali',
    continent: ContinentId.Africa,
    size: { width: 450.0, height: 300.0 },
  }),
  [CountryList.Malta]: createCountryDefinition(CountryList.Malta, {
    name: 'Malta',
    continent: ContinentId.Europe,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.MarshallIslands]: createCountryDefinition(CountryList.MarshallIslands, {
    name: 'Marshall Islands',
    continent: ContinentId.Oceania,
    size: { width: 57.0, height: 30.0 },
  }),
  [CountryList.Mauritania]: createCountryDefinition(CountryList.Mauritania, {
    name: 'Mauritania',
    continent: ContinentId.Africa,
    size: { width: 3000.0, height: 2000.0 },
  }),
  [CountryList.Mauritius]: createCountryDefinition(CountryList.Mauritius, {
    name: 'Mauritius',
    continent: ContinentId.Africa,
    size: { width: 6.0, height: 4.0 },
  }),
  [CountryList.Mexico]: createCountryDefinition(CountryList.Mexico, {
    name: 'Mexico',
    continent: ContinentId.NorthAmerica,
    size: { width: 980.0, height: 560.0 },
  }),
  [CountryList.Micronesia]: createCountryDefinition(CountryList.Micronesia, {
    name: 'Micronesia',
    continent: ContinentId.Oceania,
    size: { width: 38.0, height: 20.0 },
  }),
  [CountryList.Moldova]: createCountryDefinition(CountryList.Moldova, {
    name: 'Moldova',
    continent: ContinentId.Europe,
    size: { width: 1800.0, height: 900.0 },
  }),
  [CountryList.Monaco]: createCountryDefinition(CountryList.Monaco, {
    name: 'Monaco',
    continent: ContinentId.Europe,
    size: { width: 5.0, height: 4.0 },
  }),
  [CountryList.Mongolia]: createCountryDefinition(CountryList.Mongolia, {
    name: 'Mongolia',
    continent: ContinentId.Asia,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Montenegro]: createCountryDefinition(CountryList.Montenegro, {
    name: 'Montenegro',
    continent: ContinentId.Europe,
    size: { width: 640.0, height: 320.0 },
  }),
  [CountryList.Morocco]: createCountryDefinition(CountryList.Morocco, {
    name: 'Morocco',
    continent: ContinentId.Africa,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.Mozambique]: createCountryDefinition(CountryList.Mozambique, {
    name: 'Mozambique',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Myanmar]: createCountryDefinition(CountryList.Myanmar, {
    name: 'Myanmar',
    continent: ContinentId.Asia,
    size: { width: 18.0, height: 12.0 },
  }),
  [CountryList.Namibia]: createCountryDefinition(CountryList.Namibia, {
    name: 'Namibia',
    continent: ContinentId.Africa,
    size: { width: 90.0, height: 60.0 },
  }),
  [CountryList.Nauru]: createCountryDefinition(CountryList.Nauru, {
    name: 'Nauru',
    continent: ContinentId.Oceania,
    size: { width: 600.0, height: 300.0 },
  }),
  [CountryList.Netherlands]: createCountryDefinition(CountryList.Netherlands, {
    name: 'Netherlands',
    continent: ContinentId.Europe,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.NewZealand]: createCountryDefinition(CountryList.NewZealand, {
    name: 'New Zealand',
    continent: ContinentId.Oceania,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Nicaragua]: createCountryDefinition(CountryList.Nicaragua, {
    name: 'Nicaragua',
    continent: ContinentId.NorthAmerica,
    size: { width: 1000.0, height: 600.0 },
  }),
  [CountryList.Niger]: createCountryDefinition(CountryList.Niger, {
    name: 'Niger',
    continent: ContinentId.Africa,
    size: { width: 700.0, height: 600.0 },
  }),
  [CountryList.Nigeria]: createCountryDefinition(CountryList.Nigeria, {
    name: 'Nigeria',
    continent: ContinentId.Africa,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.NorthKorea]: createCountryDefinition(CountryList.NorthKorea, {
    name: 'North Korea',
    continent: ContinentId.Asia,
    size: { width: 72.0, height: 36.0 },
  }),
  [CountryList.NorthMacedonia]: createCountryDefinition(CountryList.NorthMacedonia, {
    name: 'North Macedonia',
    continent: ContinentId.Europe,
    size: { width: 280.0, height: 140.0 },
  }),
  [CountryList.Norway]: createCountryDefinition(CountryList.Norway, {
    name: 'Norway',
    continent: ContinentId.Europe,
    size: { width: 22.0, height: 16.0 },
  }),
  [CountryList.Oman]: createCountryDefinition(CountryList.Oman, {
    name: 'Oman',
    continent: ContinentId.Asia,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Pakistan]: createCountryDefinition(CountryList.Pakistan, {
    name: 'Pakistan',
    continent: ContinentId.Asia,
    size: { width: 120.0, height: 80.0 },
  }),
  [CountryList.Palau]: createCountryDefinition(CountryList.Palau, {
    name: 'Palau',
    continent: ContinentId.Oceania,
    size: { width: 16.0, height: 10.0 },
  }),
  [CountryList.Palestine]: createCountryDefinition(CountryList.Palestine, {
    name: 'Palestine',
    continent: ContinentId.Asia,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.Panama]: createCountryDefinition(CountryList.Panama, {
    name: 'Panama',
    continent: ContinentId.NorthAmerica,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.PapuaNewGuinea]: createCountryDefinition(CountryList.PapuaNewGuinea, {
    name: 'Papua New Guinea',
    continent: ContinentId.Oceania,
    size: { width: 768.0, height: 576.0 },
  }),
  [CountryList.Paraguay]: createCountryDefinition(CountryList.Paraguay, {
    name: 'Paraguay',
    continent: ContinentId.SouthAmerica,
    size: { width: 1200.0, height: 660.0 },
  }),
  [CountryList.Peru]: createCountryDefinition(CountryList.Peru, {
    name: 'Peru',
    continent: ContinentId.SouthAmerica,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Philippines]: createCountryDefinition(CountryList.Philippines, {
    name: 'Philippines',
    continent: ContinentId.Asia,
    size: { width: 180.0, height: 90.0 },
  }),
  [CountryList.Portugal]: createCountryDefinition(CountryList.Portugal, {
    name: 'Portugal',
    continent: ContinentId.Europe,
    size: { width: 600.0, height: 400.0 },
  }),
  [CountryList.Qatar]: createCountryDefinition(CountryList.Qatar, {
    name: 'Qatar',
    continent: ContinentId.Asia,
    size: { width: 1400.0, height: 550.0 },
  }),
  [CountryList.Romania]: createCountryDefinition(CountryList.Romania, {
    name: 'Romania',
    continent: ContinentId.Europe,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.Russia]: createCountryDefinition(CountryList.Russia, {
    name: 'Russia',
    continent: ContinentId.Europe,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.Rwanda]: createCountryDefinition(CountryList.Rwanda, {
    name: 'Rwanda',
    continent: ContinentId.Africa,
    size: { width: 1080.0, height: 720.0 },
  }),
  [CountryList.SaintKittsAndNevis]: createCountryDefinition(CountryList.SaintKittsAndNevis, {
    name: 'Saint Kitts and Nevis',
    continent: ContinentId.NorthAmerica,
    size: { width: 750.0, height: 500.0 },
  }),
  [CountryList.SaintLucia]: createCountryDefinition(CountryList.SaintLucia, {
    name: 'Saint Lucia',
    continent: ContinentId.NorthAmerica,
    size: { width: 600.0, height: 300.0 },
  }),
  [CountryList.SaintVincentAndTheGrenadines]: createCountryDefinition(
    CountryList.SaintVincentAndTheGrenadines,
    {
      name: 'Saint Vincent and the Grenadines',
      continent: ContinentId.NorthAmerica,
      size: { width: 192.0, height: 128.0 },
    },
  ),
  [CountryList.Samoa]: createCountryDefinition(CountryList.Samoa, {
    name: 'Samoa',
    continent: ContinentId.Oceania,
    size: { width: 2880.0, height: 1440.0 },
  }),
  [CountryList.SanMarino]: createCountryDefinition(CountryList.SanMarino, {
    name: 'San Marino',
    continent: ContinentId.Europe,
    size: { width: 800.0, height: 600.0 },
  }),
  [CountryList.SaudiArabia]: createCountryDefinition(CountryList.SaudiArabia, {
    name: 'Saudi Arabia',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Senegal]: createCountryDefinition(CountryList.Senegal, {
    name: 'Senegal',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Serbia]: createCountryDefinition(CountryList.Serbia, {
    name: 'Serbia',
    continent: ContinentId.Europe,
    size: { width: 756.13, height: 504.09 },
  }),
  [CountryList.Seychelles]: createCountryDefinition(CountryList.Seychelles, {
    name: 'Seychelles',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 450.0 },
  }),
  [CountryList.SierraLeone]: createCountryDefinition(CountryList.SierraLeone, {
    name: 'Sierra Leone',
    continent: ContinentId.Africa,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.Singapore]: createCountryDefinition(CountryList.Singapore, {
    name: 'Singapore',
    continent: ContinentId.Asia,
    size: { width: 4320.0, height: 2880.0 },
  }),
  [CountryList.Slovakia]: createCountryDefinition(CountryList.Slovakia, {
    name: 'Slovakia',
    continent: ContinentId.Europe,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Slovenia]: createCountryDefinition(CountryList.Slovenia, {
    name: 'Slovenia',
    continent: ContinentId.Europe,
    size: { width: 12.0, height: 6.0 },
  }),
  [CountryList.SolomonIslands]: createCountryDefinition(CountryList.SolomonIslands, {
    name: 'Solomon Islands',
    continent: ContinentId.Oceania,
    size: { width: 800.0, height: 400.0 },
  }),
  [CountryList.Somalia]: createCountryDefinition(CountryList.Somalia, {
    name: 'Somalia',
    continent: ContinentId.Africa,
    size: { width: 81.0, height: 54.0 },
  }),
  [CountryList.SouthAfrica]: createCountryDefinition(CountryList.SouthAfrica, {
    name: 'South Africa',
    continent: ContinentId.Africa,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.SouthKorea]: createCountryDefinition(CountryList.SouthKorea, {
    name: 'South Korea',
    continent: ContinentId.Asia,
    size: { width: 72.0, height: 48.0 },
  }),
  [CountryList.SouthSudan]: createCountryDefinition(CountryList.SouthSudan, {
    name: 'South Sudan',
    continent: ContinentId.Africa,
    size: { width: 20.0, height: 10.0 },
  }),
  [CountryList.Spain]: createCountryDefinition(CountryList.Spain, {
    name: 'Spain',
    continent: ContinentId.Europe,
    size: { width: 750.0, height: 500.0 },
  }),
  [CountryList.SriLanka]: createCountryDefinition(CountryList.SriLanka, {
    name: 'Sri Lanka',
    continent: ContinentId.Asia,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Sudan]: createCountryDefinition(CountryList.Sudan, {
    name: 'Sudan',
    continent: ContinentId.Africa,
    size: { width: 12.0, height: 6.0 },
  }),
  [CountryList.Suriname]: createCountryDefinition(CountryList.Suriname, {
    name: 'Suriname',
    continent: ContinentId.SouthAmerica,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Sweden]: createCountryDefinition(CountryList.Sweden, {
    name: 'Sweden',
    continent: ContinentId.Europe,
    size: { width: 16.0, height: 10.0 },
  }),
  [CountryList.Switzerland]: createCountryDefinition(CountryList.Switzerland, {
    name: 'Switzerland',
    continent: ContinentId.Europe,
    size: { width: 32.0, height: 32.0 },
  }),
  [CountryList.Syria]: createCountryDefinition(CountryList.Syria, {
    name: 'Syria',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.SaoTomeAndPrincipe]: createCountryDefinition(CountryList.SaoTomeAndPrincipe, {
    name: 'São Tomé and Príncipe',
    continent: ContinentId.Africa,
    size: { width: 2800.0, height: 1400.0 },
  }),
  [CountryList.Tajikistan]: createCountryDefinition(CountryList.Tajikistan, {
    name: 'Tajikistan',
    continent: ContinentId.Asia,
    size: { width: 1400.0, height: 700.0 },
  }),
  [CountryList.Tanzania]: createCountryDefinition(CountryList.Tanzania, {
    name: 'Tanzania',
    continent: ContinentId.Africa,
    size: { width: 72.0, height: 48.0 },
  }),
  [CountryList.Thailand]: createCountryDefinition(CountryList.Thailand, {
    name: 'Thailand',
    continent: ContinentId.Asia,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.TimorLeste]: createCountryDefinition(CountryList.TimorLeste, {
    name: 'Timor-Leste',
    continent: ContinentId.Asia,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Togo]: createCountryDefinition(CountryList.Togo, {
    name: 'Togo',
    continent: ContinentId.Africa,
    size: { width: 809.0, height: 500.0 },
  }),
  [CountryList.Tonga]: createCountryDefinition(CountryList.Tonga, {
    name: 'Tonga',
    continent: ContinentId.Oceania,
    size: { width: 96.0, height: 48.0 },
  }),
  [CountryList.TrinidadAndTobago]: createCountryDefinition(CountryList.TrinidadAndTobago, {
    name: 'Trinidad and Tobago',
    continent: ContinentId.NorthAmerica,
    size: { width: 30.0, height: 18.0 },
  }),
  [CountryList.Tunisia]: createCountryDefinition(CountryList.Tunisia, {
    name: 'Tunisia',
    continent: ContinentId.Africa,
    size: { width: 120.0, height: 80.0 },
  }),
  [CountryList.Turkmenistan]: createCountryDefinition(CountryList.Turkmenistan, {
    name: 'Turkmenistan',
    continent: ContinentId.Asia,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Tuvalu]: createCountryDefinition(CountryList.Tuvalu, {
    name: 'Tuvalu',
    continent: ContinentId.Oceania,
    size: { width: 1200.0, height: 600.0 },
  }),
  [CountryList.Turkiye]: createCountryDefinition(CountryList.Turkiye, {
    name: 'Türkiye',
    continent: ContinentId.Asia,
    size: { width: 12.0, height: 8.0 },
  }),
  [CountryList.Uganda]: createCountryDefinition(CountryList.Uganda, {
    name: 'Uganda',
    continent: ContinentId.Africa,
    size: { width: 900.0, height: 600.0 },
  }),
  [CountryList.Ukraine]: createCountryDefinition(CountryList.Ukraine, {
    name: 'Ukraine',
    continent: ContinentId.Europe,
    size: { width: 3.0, height: 2.0 },
  }),
  [CountryList.UnitedArabEmirates]: createCountryDefinition(CountryList.UnitedArabEmirates, {
    name: 'United Arab Emirates',
    continent: ContinentId.Asia,
    size: { width: 6.0, height: 3.0 },
  }),
  [CountryList.UnitedKingdom]: createCountryDefinition(CountryList.UnitedKingdom, {
    name: 'United Kingdom',
    continent: ContinentId.Europe,
    size: { width: 60.0, height: 30.0 },
  }),
  [CountryList.UnitedStates]: createCountryDefinition(CountryList.UnitedStates, {
    name: 'United States',
    continent: ContinentId.NorthAmerica,
    size: { width: 7410.0, height: 3900.0 },
  }),
  [CountryList.Uruguay]: createCountryDefinition(CountryList.Uruguay, {
    name: 'Uruguay',
    continent: ContinentId.SouthAmerica,
    size: { width: 945.0, height: 630.0 },
  }),
  [CountryList.Uzbekistan]: createCountryDefinition(CountryList.Uzbekistan, {
    name: 'Uzbekistan',
    continent: ContinentId.Asia,
    size: { width: 500.0, height: 250.0 },
  }),
  [CountryList.Vanuatu]: createCountryDefinition(CountryList.Vanuatu, {
    name: 'Vanuatu',
    continent: ContinentId.Oceania,
    size: { width: 950.0, height: 570.0 },
  }),
  [CountryList.HolySee]: createCountryDefinition(CountryList.HolySee, {
    name: 'Holy See',
    continent: ContinentId.Europe,
    size: { width: 2500.0, height: 2500.0 },
  }),
  [CountryList.Venezuela]: createCountryDefinition(CountryList.Venezuela, {
    name: 'Venezuela',
    continent: ContinentId.SouthAmerica,
    size: { width: 180.0, height: 120.0 },
  }),
  [CountryList.Vietnam]: createCountryDefinition(CountryList.Vietnam, {
    name: 'Vietnam',
    continent: ContinentId.Asia,
    size: { width: 30.0, height: 20.0 },
  }),
  [CountryList.Yemen]: createCountryDefinition(CountryList.Yemen, {
    name: 'Yemen',
    continent: ContinentId.Asia,
    size: { width: 9.0, height: 6.0 },
  }),
  [CountryList.Zambia]: createCountryDefinition(CountryList.Zambia, {
    name: 'Zambia',
    continent: ContinentId.Africa,
    size: { width: 2100.0, height: 1400.0 },
  }),
  [CountryList.Zimbabwe]: createCountryDefinition(CountryList.Zimbabwe, {
    name: 'Zimbabwe',
    continent: ContinentId.Africa,
    size: { width: 1260.0, height: 630.0 },
  }),
};
