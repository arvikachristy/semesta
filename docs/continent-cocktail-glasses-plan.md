# Continent cocktail glasses plan

Status: partially implemented. Oceania uses a coupe, Africa a highball, North America a martini glass, and South America a flute. The remaining continent styles are proposals.

Branch: `feat/continent-cocktail-glasses`

Worktree: `/Users/vikachristy/Coding/semesta-cocktail-glasses`

Base: `e9efa51` on `feat/shared-country-picker`. Existing uncommitted trip changes remain in the original checkout and are not included here.

## Design intent

Each continent gets a distinct cocktail glass silhouette. Its usable interior volume is proportional to the total number of catalogue entries assigned to that continent, independent of how many the user has selected. Equal-sized country jellies make the capacity relationship meaningful. Selecting countries changes the contents, not the glass size.

Proposed counting policy: count every selectable flag, including the United Kingdom and its four constituent nations. This matches the current product's 199 selectable entries and lets every selectable jelly fit. This is not a claim that there are 199 sovereign states. The alternative is the repository's documented 195-state scope, which changes Europe from 48 to 44; that option also requires deciding how the extra four selectable jellies fit without silently breaking the ratio.

Derive counts from `countryGroups`; do not maintain a second hard-coded country-count table. Existing catalogue assignments determine transcontinental membership.

## Proposed silhouettes and capacity ratios

These names describe the visual profiles; dimensions are calculated from capacity, not real-world serving sizes.

| Continent     | Selectable entries | Volume relative to Africa | Proposed glass                                                               |
| ------------- | -----------------: | ------------------------: | ---------------------------------------------------------------------------- |
| Africa        |                 54 |                      100% | Highball: tall straight-sided bowl, grounded base                            |
| Asia          |                 48 |                    88.89% | Collins: tall, slender, straight-sided                                       |
| Europe        |                 48 |                    88.89% | Balloon goblet: broad rounded bowl on a stem                                 |
| North America |                 23 |                    42.59% | Martini: sloped bowl on a stem                                               |
| Oceania       |                 14 |                    25.93% | Coupe: shallow, broad bowl on a stem                                         |
| South America |                 12 |                    22.22% | Flute: tall, narrow bowl on a stem                                           |
| Antarctica    |                  0 |                        0% | Miniature martini display glass, empty and non-interactive for country drops |

Asia and Europe must have equal usable volume despite their different shapes. Glass height alone does not encode country count. The proposed Antarctica glass is an explicit visual exception: a visible vessel cannot have physical volume proportional to zero. Its logical country capacity is zero; it remains a small decorative seventh glass rather than being assigned a fictitious country count.

## Current implementation constraints

- `glass-parameters.ts` supplies one global cylinder size and a 60-entry limit. Its width multiplier raises estimated physical packing capacity to 93.75, so the current nominal and physical capacities differ.
- `glass-set.ts` shares one geometry, rim and artwork mesh across all seven glasses.
- `glass-artwork.ts` wraps artwork around a constant-radius cylinder. `glass-material.ts` normalizes its gradient using one global height.
- `country-collection.ts` uses the global radius, floor, ceiling and drop positions for every continent.
- `jelly-soft-body.ts` uses cylindrical walls for both particle projection and collision response.
- Selection limits in `use-country-selection.ts` and buffer allocations in `jelly-batches.ts` also use the global capacity.

Changing only the visible meshes would leave jellies colliding with invisible cylindrical walls. Shape, capacity and collision changes must ship together.

## Implementation sequence

1. **Define the data contracts and profiles.** Add a glass-style union and a continent-to-style mapping. Each reusable style defines normalized inner and outer bowl profiles, rim, bowl floor and optional stem/foot. Represent the interior as ordered `(height, radius)` samples, with one radius per height. Use the same resolved profile for rendering, volume calculation and collisions. Return a resolved glass definition per continent, including country capacity, dimensions and bounds. Keep these types independent of React and the country selection hook.

2. **Calculate true bowl volume.** Keep one jelly scale and one shared packing estimate. Set `usableVolume = countryCount * jellyVolume / packingFraction`, where usable volume excludes the top headroom. Reserve 10% of total bowl volume as headroom. Integrate piecewise-linear radii as conical frustums: `segmentVolume = PI * segmentHeight * (r0² + r0*r1 + r1²) / 3`. Scale each normalized bowl with `scale = cbrt(targetBowlVolume / normalizedBowlVolume)`. Find the usable fill height from cumulative volume. Exclude stem, foot and wall thickness from capacity; remove the unexplained width multiplier. Validate minimum opening width against jelly dimensions. If a profile is too narrow, revise its normalized shape and recalculate rather than silently enlarging its volume.

3. **Build the hollow cocktail geometry.** Generate each bowl with `LatheGeometry`, with a real inner wall, closed bowl bottom and open rounded rim. Add stems and feet as solid geometry below the bowl floor. Keep all glasses grounded at the same base level. Calculate rim position and radius from each profile. Retain the current glass and gold visual treatment, adjusting tint normalization to each vessel. Share resources where safe; dispose per-glass geometry and any material variants explicitly.

4. **Fit continent artwork to the bowl.** Replace the constant-radius artwork wrap with the resolved outer radius at each artwork vertex's height. Place artwork within the bowl, above the stem, scale it to available surface area and offset along the surface normal to avoid intersection. Keep labels legible on the small coupe and flute profiles; use a smaller emblem instead of stretching the continent silhouette.

5. **Make contents follow the interior.** Pass each continent's interior profile, bowl floor and usable fill height through `country-collection.ts` into the jelly container. Replace fixed-radius wall projection with a profile-aware boundary query and inward collision normal, including the wall slope in velocity response. Handle the bowl floor and profile-segment joins consistently; do not allow particles into stems or feet. Derive drop positions from available radius at the spawn height, accounting for jelly half-extents and wall clearance. Preserve existing grabbing, settling, batching and loading behavior.

6. **Remove global-capacity assumptions.** Use the derived continent capacity for selection limits, collection validation and per-glass batch allocation. Keep shared configuration such as jelly scale separate from individual glass dimensions. Preserve stored country selections and allow all existing 199 entries under the proposed counting policy. Antarctica allocates no jelly batch.

7. **Refit the arrangement and camera.** Retain the circular carousel and current order. Calculate a sufficient circle radius using neighboring glasses' maximum outer radii and a shared gap. Include every glass's complete rotation envelope and tallest stemmed glass in camera bounds. Keep the facing-artwork behavior. Verify both narrow and wide viewports without compressing the capacity ratios to fit the screen.

8. **Validate capacity and presentation together.** Run the automated checks and a browser review with empty, partially full and fully populated glasses. Packing is an estimate: if a full continent cannot settle, tune a common packing factor or revise the offending normalized profile and recalculate. Do not introduce hidden per-continent jelly scales. Confirm acceptable performance using the existing benchmark approach before declaring full-capacity behavior complete.

## Acceptance checks

- Derived counts match the selected catalogue policy; Antarctica is explicitly zero.
- Integrated usable-volume ratios match country-count ratios within 1% for all nonempty continents, including equal volumes for Asia and Europe under the 199-entry policy.
- Removing or selecting countries never resizes the vessel.
- All six active glass styles have recognizable, different silhouettes at normal camera distance.
- Geometry tests cover open rims, interior walls, bowl floors and stems excluded from the interior.
- Collision tests cover a sloped bowl, a curved/narrowing bowl, profile joins and floor contact, including the collision normal and no escape through walls.
- Full-continent browser scenarios show jellies contained in the visible bowl without overlap into stems, walls or the reserved headroom after settling.
- Artwork and gold rims follow their own glass surfaces; no clipping or stretched maps.
- Carousel rotation, picking, camera framing, persisted selections and cleanup continue working.
- Run `npm run check`, `npm run build`, affected browser scenarios and a representative full-catalogue performance comparison during implementation.

## Decisions before implementation

- Confirm selectable-entry counts versus sovereign-state counts; selectable entries are the proposed default for this product.
- Review the proposed silhouette mapping and Antarctica's decorative zero-capacity treatment.
- Treat volume proportionality as the sizing rule. Differences in height and width follow the cocktail profiles; no independently chosen sizes that contradict the volume ratios.

Implementation is incremental: Africa, Oceania, North America and South America are implemented with shared capacity rules; the remaining profiles are planned.
