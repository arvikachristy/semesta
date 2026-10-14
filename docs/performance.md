# Country jelly performance

## Scope

The selector covers 195 states (193 UN members plus the Holy See and Palestine). Every selected state creates a jelly; no country-count cap or focus-only hiding is used. Selections fill gradually, starting with Indonesia for a new visitor. Assets are local and requested only when selected.

## What changed

- One render mesh and one growing artwork atlas per populated glass, while each jelly keeps independent physics and raycasting. At 195 countries this replaces 195 jelly draws with six, including in the shadow pass. The complete resting scene drops from 231 to 42 draw calls.
- Sleeping bodies skip physics, deformation and uploads. Changed bodies update only their batch buffer ranges. Removing countries compacts batches and disposes empty ones.
- Each visible surface uses 588 triangles rather than 3,468. The complete 195-country scene uses 162,150 triangles, including glasses and floor.
- Each volume has 24 particles / 36 tetrahedra instead of 60 / 144. Local grabbing, volume constraints, release inertia and container boundaries remain active.
- A vertical sweep narrows body collision candidates. Conservative bounds contacts stabilize dense piles; these approximate contacts do not model detailed interlocking surfaces. This is the main physics compromise.
- Artwork is rasterized at 128 pixels high. Six atlas textures occupy under 32 MiB of base RGBA storage at full selection, versus roughly 390 MiB for 195 independent 768 × 512 textures with mipmaps. This is a calculated texture budget, not total GPU memory. Original canvases and physics also use CPU memory. Fine emblems lose detail when zoomed in.
- Loading is serialized with short yields. Saved selections appear already stacked and sleeping inside their glasses on first load, avoiding a long physics-heavy shower of drops. Countries added afterward still drop, targeting at most 12 awake bodies globally with a bounded pause to ensure progress. Collisions and grabs may wake more bodies; interactive bodies are never forcibly frozen.
- Shadows refresh at most 15 times per second while changing. Smaller high-density viewports now render above 1× pixel ratio, up to 2×, with the extra detail limited to roughly one million drawing pixels. Viewports already larger than that keep the previous 1× baseline. Sustained slow frames can reduce the chosen ratio to 75%. HTML stays sharp. The internal refraction buffer uses half resolution.

## Measurement

Run the app with `npm run dev`, then `npm run benchmark`. Chrome must be installed. The benchmark uses a fresh browser context, saved selections, a 1280 × 800 viewport and device scale 1. It records the first four seconds of loading, waits for the requested count and a ten-second settling period, then records four seconds at rest. Finally it grabs/releases one jelly with all countries present, checks every particle remains finite and inside its glass, and removes the collection to verify resource cleanup.

The benchmark instruments only the served development module. Production exposes no diagnostics globals. Loading measurements cover the first four seconds, not the entire staged fill. Physics timing includes surface updates and batching. Render submission is CPU wall time, **not GPU execution time**. Results vary with machine load, browser, viewport and device; these are local measurements rather than guaranteed FPS. Actual mobile FPS has not been measured.

### Recorded results

2026-10-04T18:32:21.158Z; Intel(R) Core(TM) i5-7267U CPU @ 3.10GHz, darwin, Chrome 154.0.8037.93. Raw measurements: [performance-countries.json](./performance-countries.json).

| Selected | First 4 s FPS | Resting FPS | Resting p95 frame ms | Resting pixel ratio | Resting draw calls |
| -------- | ------------- | ----------- | -------------------- | ------------------- | ------------------ |
| 1        | 60.5          | 60.1        | 18.2                 | 1                   | 37                 |
| 7        | 55.1          | 60.1        | 18.5                 | 1                   | 42                 |
| 25       | 48.6          | 60.2        | 18.6                 | 1                   | 42                 |
| 60       | 47.2          | 60.2        | 18.3                 | 1                   | 42                 |
| 195      | 48.1          | 60.1        | 19.1                 | 0.75                | 42                 |

With all 195 present, the held grab measured **50.6 FPS** (p95 35.6 ms) and release measured **58.0 FPS** (p95 21.4 ms), at pixel ratio 0.75. This is not a promise of 60 FPS during every interaction. The full-load resting sample had zero awake bodies. All particles remained inside their containers, and no browser page/console errors were recorded.

Removing all countries returned Three.js resource counts to **13 textures / 5 geometries**, from **19 / 11** with 195 rendered jellies. These counters report uploaded resources, not CPU objects or byte usage.

An earlier pre-tuning run is retained in [performance-before-tuning.json](./performance-before-tuning.json). It used different render quality and physics settings, so treat it as diagnostic history, not a controlled hardware-independent FPS comparison.

After changing saved selections to start at rest, a 60-country desktop run on 2026-10-13 recorded **46.6 FPS** during the first four seconds with all 60 visible and **zero awake bodies**; physics/surface work averaged **0.86 ms per frame**. The resting sample was **60.2 FPS**. See [the raw initial-placement run](./performance-initial-placement.json). The earlier 60-country loading sample was 47.2 FPS with only 26 visible and 12 awake bodies, so the new placement substantially reduces simulation work but does not establish a higher startup frame rate. Browser versions and machine load also differ. Physical phone performance remains unmeasured.

## Verification and limits

`npm run test:browser` checks the 195 options, search, persistence across both routes, intentionally empty selections, the mobile checklist layout, and Escape dismissal. Unit specs cover atlas tile boundaries, per-body render updates, raycasting hidden source meshes, batch compaction/disposal, selection migration/validation, load scheduling, collisions and adaptive resolution.

The material remains native WebGL physical transmission. Refraction through several overlapping transmissive objects is approximate. Physics stays on the CPU; this does not add WebGPU, FEM or a new rendering framework. The existing Three.js bundle still produces Vite's large-chunk warning (about 224 kB gzipped application JavaScript).

## Main controls

| Concern                                              | File                                                      |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Loading, surface detail, texture resolution, shadows | `src/three/jelly-flags/jelly-performance.ts`              |
| Physics detail, stiffness, damping, sleep            | `src/three/jelly-flags/jelly-parameters.ts`               |
| Conservative body contacts                           | `src/three/jelly-flags/jelly-pile.ts`                     |
| Adaptive resolution / refraction buffer              | `src/three/render-parameters.ts`                          |
| Render batching / atlas layout                       | `src/three/jelly-flags/jelly-batches.ts`, `flag-atlas.ts` |
| Versioned choices / future account adapter           | `src/storage/country-selection.ts`                        |
