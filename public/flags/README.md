# Flag assets

The catalogue includes 195 sovereign states: 193 UN members plus the Holy See (VA) and Palestine (PS). It also includes England (GB-ENG), Northern Ireland (GB-NIR), Scotland (GB-SCT), and Wales (GB-WLS) as selectable constituent nations while retaining the United Kingdom (GB) entry.

SVGs copied from hampusborgos/country-flags at commit `c09927e63705529bbf59ca6684cd9b23225dddad`: https://github.com/hampusborgos/country-flags/tree/c09927e63705529bbf59ca6684cd9b23225dddad/svg
The provider identifies the artwork as public domain, sourced from Wikimedia Commons. Its README discusses other possible flag usage restrictions.

Country metadata derived from mledoze/countries at `c2ac0049c14edcf2436c7aa1b2493222a020b462`, selecting unMember plus VA/PS. Source: https://github.com/mledoze/countries/tree/c2ac0049c14edcf2436c7aa1b2493222a020b462
Metadata is ODbL licensed; see COUNTRY-DATA-LICENSE.txt. Our derived metadata is available in src/data/country-catalogue.ts. Names use Holy See and Türkiye; Cyprus is assigned to Asia to match UN M49. Caribbean and Central American states go in North America. Sovereign-state counts: Africa 54, Asia 48, Europe 44, North America 23, South America 12, Oceania 14. Antarctica has no state in this catalogue.

The four UK constituent-nation SVGs are from `country-flag-icons@1.6.20` (MIT); see COUNTRY-FLAG-ICONS-LICENSE.txt. Their ISO 3166-2-style codes follow the UK government’s extended country-code list. The selector shows the United Kingdom plus these four constituent entries, for 48 selectable Europe flags.

Assets are served on demand, not inlined into the JavaScript bundle. National artwork keeps its aspect ratio inside identical jelly slabs. Existing procedural palettes remain explicit overrides in flag-definitions.ts. Update the pinned assets and catalogue together, then run the catalogue coverage specs.
