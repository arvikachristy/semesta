# semesta ✦

*A little universe for everywhere you've been — and everywhere you're going.*

**Semesta** means *universe* in Bahasa Indonesia. This is a personal travel diary and an interactive frontend experiment: collect countries as playful jelly flags, then turn the next destination into a plan.

[**Explore the live app ↗**](https://semesta-gamma.vercel.app/) · [**Open Trip Studio ↗**](https://semesta-gamma.vercel.app/tripstudio) · [**Preview the new journey map ↗**](https://semesta-git-codex-trip-journey-map-vchristy.vercel.app/tripstudio)

![Semesta homepage: continent glasses and collectible jelly flags](https://image.thum.io/get/noanimate/width/1200/crop/760/https://semesta-gamma.vercel.app/)

*Homepage preview captured from the live deployment via [Thum.io](https://www.thum.io/).*

## The journey

1. **Collect your world.** Explore seven continent glasses, play with the soft-body flag jellies and mark places as **Been to** or **Bucket list**. Search the 199-destination catalogue on desktop or mobile.
2. **Start a trip.** Choose a city or country, then set flexible days with the dial or pick dates in the calendar. A draft opens straight into Trip Studio.
3. **Build your journey.** Arrange transportation and stays along a day-by-day map. Drag blocks to move them, resize stays, add stops and see uncovered nights. Mouse, touch (press and hold) and keyboard controls are supported.
4. **Track what's booked.** Edit or delete plans, undo deletions and mark each journey or stay **Booked** or **To book**. Add optional activities under **Other plans**.
5. **Complete the loop.** After travelling, confirm which countries you visited to add their jellies to your collection. Planning a trip does **not** mark a country visited.

The journey map is an **MVP planner**, not a booking engine: links and confirmations are saved as entered, without automatic booking, prices or link previews.

## Technology

| Layer | Implementation |
| --- | --- |
| Interface | **React 19**, **TypeScript 6**, **Vite 8**, React Router 8, CSS Modules and the *Rose Glass* design tokens |
| 3D world | **Three.js** (raw WebGL, no React Three Fiber); custom CPU soft-body jelly physics, glass geometry and interactive pointer controls |
| Journey editor | **Interact.js** for drag/resize, touch hold and auto-scroll; a day-snapped domain model and stable-ID CRUD through the existing trip store |
| Data & sign-in | Local browser storage by default; optional **Supabase** account backup with email code or Google sign-in |
| Quality | **Vitest**, **Playwright**, ESLint, Prettier and TypeScript checks |
| Hosting | **Vercel** |

## Run locally

Requires **Node 22** and **npm 11**.

```bash
npm ci
npm run dev
```

Open the Vite URL printed in your terminal. Supabase is optional for local use; copy `.env.example` to `.env` if you want to configure account backup. Never use a Supabase service-role key in the browser.

```bash
npm run check     # format, lint, typecheck and unit tests
npm run build
npm run test:browser
```

**Routes:** `/` for the country collection; `/tripstudio` for trips; `/tripstudio/:tripId` and `/trips/:tripId` for an individual plan.

## Project notes

This branch contains the newer **journey-map / Interact.js** experience, which is **not yet merged into `master`**. The main deployment reflects the production branch; use the preview link above for the latest editor. Data is saved on-device unless account backup is configured.

[Design system](docs/design-system.md) · [Country catalogue](docs/country-catalogue.md) · [Account setup](docs/account-setup.md) · [Engineering notes](docs/implementation-notes-archive.md)
