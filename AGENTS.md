# Semesta repository conventions

- Use npm only. Commit `package-lock.json`; use `npm ci` for existing checkouts.
- Keep Node aligned with `.nvmrc` and TypeScript in strict mode. Avoid compiler compatibility layers for this small playground.
- Run Prettier with `npm run format`; `npm run format:check` is part of `npm run check`. Keep CSS declarations and control-flow blocks multiline. Use braces for every control-flow body.
- Use interfaces with an `I` prefix for object contracts. Keep union types as type aliases. Prefer type-only imports for types, and avoid explicit `any`.
- Use modern ECMAScript syntax supported by the project's TypeScript target: ES modules, `const`/`let`, arrow functions, destructuring, and built-in array/object methods when they make code clearer. Avoid `var`, CommonJS `require`, and legacy DOM APIs.
- Write React as functional components with hooks and arrow functions. Use kebab-case filenames and one component per `.tsx` file. React owns the DOM canvas; raw Three.js owns the scene and renderer inside it.
- Keep each Three.js concept in its own small file under `src/three/`, with `src/three/playground.ts` showing assembly and the render loop. Keep scene, camera, renderer, and world coordinates explicit for learning.
- Preserve the current continent-glass composition and country jelly interactions; do not add unrelated decoration. Add dependencies or directories only for a current implementation need. Keep the README accurate.
- Before handoff, run `npm run check` and `npm run build`, then verify behavior affected by the change. Report checks that could not run.
- When the same interaction or selection behavior appears in multiple feature areas, put the shared behavior in `src/components/shared/<feature>/` and compose it from feature-specific wrappers. Do not copy search, filtering, validation, or selection logic; allow presentation variants while keeping the behavior single-sourced.

- Store repeated domain values (country IDs, storage keys, event names, palettes and performance settings) in a shared enum or named key-value object and reference that source instead of duplicating literals. Reuse existing country, pattern, event, and attribute constants.
- Avoid type assertions/casts (`as SomeType`, angle-bracket casts, and double casts). Prefer inference, explicit declarations, discriminated unions, runtime validation, or type guards. Use an assertion only as a documented last resort when the API cannot be typed or narrowed safely. `as const` is allowed for literal inference; it must not be used to disguise an unsafe cast.

- Country names, continents and flag artwork share `src/data/countries.ts`, keyed by `CountryList`. Derive checklist groups from that registry and keep selected countries as enum IDs, not duplicated country objects.

- Keep selection persistence behind `ICountrySelectionRepository`; components and Three.js must not access browser or account storage directly. Persist country IDs only.
- Keep performance controls in `jelly-performance.ts`, and benchmark large catalogue changes with `npm run benchmark`. Do not claim GPU timings from render submission time or assume that sleeping jellies stop costing GPU work.

## User-owned data and CRUD

- For every user-created or editable entity, explicitly consider Create, Read, Update and Delete before shipping. Provide discoverable controls for applicable operations; document intentional read-only or unsupported operations. Dragging/resizing alone is not a complete editing flow.
- Assign a stable ID when an entity is created. Use IDs for keys, selection, updates and deletion; never array indices, display names or newly generated render-time IDs.
- Keep canonical entity state and CRUD actions in the existing feature store/domain layer, persisted through its repository. Components may hold transient form/gesture state but must not create competing persistent copies or access storage directly. Reuse the existing store before adding a state library.
- Deleting an item must remove it from the UI and persisted state, including after reload. Generated defaults must respect deletions instead of silently recreating the item. Offer Undo or a suitable confirmation when data could be lost.
- Verify the full create → read → edit → delete flow, including cancellation, stable IDs, persistence/reload, generated defaults and related items affected by deletion. Do not infer CRUD completeness from drag tests or successful rendering.

## UI design system

- Before creating or changing DOM UI, read `docs/design-system.md` (Rose Glass), `src/styles/tokens.css` and `src/components/ui/ui.module.css`.
- Use the shared `Button` with `ButtonVariant`; ESLint rejects raw buttons outside UI primitives. Use `ui.field`, `ui.control`, `ui.checkbox`, `ui.actions`, and `ui.surface` for their corresponding native elements.
- Keep feature CSS for layout. Reuse tokens for colours, typography, control sizes, radii, spacing and states. Extend an existing recipe before introducing a new visual variant; do not restyle buttons/fields separately inside a feature.
- Shared components must use the existing design-system primitives and tokens for controls, surfaces, typography, spacing, and states. Feature-specific wrappers may change layout and presentation without duplicating the shared interaction logic.
- Preserve native date/select behaviour. Their OS/browser popups are an explicit exception to visual theming; a custom calendar needs a deliberate accessible component, not ad hoc CSS or a fake input.
- Verify UI alongside the country picker and trip editor at desktop and mobile widths, including focus, disabled states, field alignment and scrolling. Update the design guide when intentionally changing a shared pattern.

## Canary feature releases

- Register every unfinished feature in `src/features/canary/canary-registry.ts`, defaulting to disabled for public visitors.
- Gate discovery surfaces, UI actions and direct URL entry points through `useCanary`; hiding a navigation button is insufficient.
- Keep the developer gate URL-only (exact `?devmode=true` on the current route); never persist developer-mode authorization in local/session storage. Redux Toolkit stores only feature overrides. Preserve the URL switch across in-app navigation while developer mode is active.
- Keep domain persistence in existing repositories, not a second Redux copy. Disabling a feature must never delete user data.
- Test public/Canary modes, route guards and existing flows before promoting a default to enabled.
