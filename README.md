# semesta ✦

_A little universe of places you've been._

**Semesta** means _universe_ in Bahasa Indonesia. It's an interactive travel collection where countries you've visited become miniature jelly flags in a playful 3D world.

[**Explore the live app ↗**](https://semesta-gamma.vercel.app/)

![Semesta's interactive continent-glass collection](https://image.thum.io/get/noanimate/width/1200/crop/760/https://semesta-gamma.vercel.app/)

## Explore your world

- **Collect countries.** Browse 199 travel destinations and mark the places you've visited.
- **Build your bucket list.** Save destinations you want to explore without adding them to your visited collection.
- **Play with your collection.** Watch soft-body flag jellies settle into seven continent glasses. Rotate, pan, zoom and interact with the 3D scene.
- **Choose your atmosphere.** Switch between Rose Glass and Midnight Navy under Account → Appearance.
- **Take it with you.** Use the responsive interface on desktop or mobile; save locally or optionally back up your collection to an account.

## Built with

|                   | Technology                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| Frontend          | React 19, TypeScript 6, Vite 8, React Router 8, CSS Modules                 |
| 3D & interaction  | Three.js (WebGL), custom CPU soft-body physics, pointer and touch controls  |
| State & storage   | Redux Toolkit, browser storage, optional Supabase authentication and backup |
| Quality & hosting | Vitest, Playwright, ESLint, Prettier, Vercel                                |

## Run locally

Requires Node 22 and npm 11.

```bash
npm ci
npm run dev
```

```bash
npm run check
npm run build
```

Supabase is optional; see [account setup](docs/account-setup.md) to configure it.

[Design system](docs/design-system.md) · [Country catalogue](docs/country-catalogue.md)
