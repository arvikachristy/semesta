# Country catalogue sources and scope

The travel picker contains 199 destinations. Its baseline is the 193 UN member
states plus the two UN observer entries, Palestine and the Holy See. Hong Kong is
included separately as a travel destination. England, Northern Ireland, Scotland
and Wales replace the United Kingdom in the picker; GB stays valid for old trips.
This is a documented travel-destination policy, not a complete list of all ISO
territories and not a count of sovereign states.

## Authoritative references

- [UN membership](https://www.un.org/en/about-us/member-states) defines the baseline.
- [UN observer states](https://www.un.org/en/about-us/non-member-states) covers PS and VA.
- [ISO 3166](https://www.iso.org/iso-3166-country-codes.html) defines the country and area codes; a separate code does not imply independent statehood.
- [UN M49](https://unstats.un.org/unsd/methodology/m49/overview/) supplies geographical groups and cross-checks ISO codes. Caribbean and Central American entries belong to the app's North America group.

Hong Kong is a Special Administrative Region of China, with the separate ISO code
HK and UN M49 code 344. It is selectable independently of CN. Its previous absence
came from the `unMember` filter in the original import.

VA's official UN entry is Holy See. The Holy See is the central governing authority
of the Catholic Church; Vatican City State is its territorial state. For a travel
interface, the display name is **Vatican City**. Searching Holy See also finds it.
Its stored ID remains VA. See the [official Vatican explanation](https://www.vaticanstate.va/en/state-and-government/general-informations.html).

## Pinned implementation sources and audit

Names and membership metadata come from
[mledoze/countries at c2ac0049](https://github.com/mledoze/countries/tree/c2ac0049c14edcf2436c7aa1b2493222a020b462).
The source is a community dataset; the UN and ISO references above define the
policy and codes. Flags come from the pinned providers in
[the flag asset README](../public/flags/README.md), with their licences retained.

The 2026-10-13 audit found no missing or unexpected entries in the original
195-entry baseline. All baseline codes and HK were cross-checked against the
official UN M49 table. `src/data/country-source.spec.ts` keeps an independent
reference of the source scope and geographical grouping, and checks the complete
registry against it. Asset coverage checks require a local SVG for every picker
entry. Names, IDs, artwork and both pickers continue to use one enum-keyed registry.

Selectable totals: Europe 47, Asia 49, Africa 54, Oceania 14, South America 12,
North America 23, Antarctica 0. Larger catalogue policy changes must update the
reference, assets and capacity checks together.
