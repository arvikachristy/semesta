# Semesta repository conventions

- Use npm only. Commit `package-lock.json`; use `npm ci` for existing checkouts.
- Keep Node aligned with `.nvmrc` and TypeScript in strict mode. Avoid compiler compatibility layers for this small playground.
- Run Prettier with `npm run format`; `npm run format:check` is part of `npm run check`. Keep CSS declarations and control-flow blocks multiline. Use braces for every control-flow body.
- Use interfaces with an `I` prefix for object contracts. Keep union types as type aliases. Prefer type-only imports for types, and avoid explicit `any`.
- Use modern ECMAScript syntax supported by the project's TypeScript target: ES modules, `const`/`let`, arrow functions, destructuring, and built-in array/object methods when they make code clearer. Avoid `var`, CommonJS `require`, and legacy DOM APIs.
- Write React as functional components with hooks and arrow functions. Use kebab-case filenames and one component per `.tsx` file. React owns the DOM canvas; raw Three.js owns the scene and renderer inside it.
- Keep each Three.js concept in its own small file under `src/three/`, with `src/three/playground.ts` showing assembly and the render loop. Keep scene, camera, renderer, and world coordinates explicit for learning.
- Keep the playground to one box and one floor. Add dependencies or directories only for a current implementation need. Keep the README accurate.
- Before handoff, run `npm run check` and `npm run build`, then verify behavior affected by the change. Report checks that could not run.
