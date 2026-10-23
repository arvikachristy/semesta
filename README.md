# semesta ✦

*A little universe for everywhere you've been — and everywhere you're going.*

**Semesta** means *universe* in Bahasa Indonesia. This is a personal travel diary and an interactive frontend experiment: collect countries as playful jelly flags, then turn the next destination into a plan.

[**Explore the live app ↗**](https://semesta-gamma.vercel.app/) · [**Open Trip Studio ↗**](https://semesta-gamma.vercel.app/tripstudio) · [**Preview the next journey map ↗**](https://semesta-git-codex-trip-journey-map-vchristy.vercel.app/tripstudio)

![Semesta homepage: continent glasses and collectible jelly flags](https://image.thum.io/get/noanimate/width/1200/crop/760/https://semesta-gamma.vercel.app/)

*Homepage preview captured from the live deployment via [Thum.io](https://www.thum.io/).*

## How it works

1. **Collect your world.** Explore seven continent glasses, play with soft-body flag jellies and mark destinations as **Been to** or **Bucket list**. Search the 199-destination catalogue on desktop or mobile.
2. **Start a trip.** Choose a city or country, then select flexible days using the dial or dates in the calendar. Semesta creates a draft and opens Trip Studio.
3. **Make a plan.** Add journeys and stays, organise stops and nights, and add optional activities to individual days.
4. **Track progress.** Edit or remove planning items, attach booking links and mark what's **Booked** or still **To book**.
5. **Complete the loop.** When you're back, confirm which countries you actually visited and see new jellies appear. Planning alone never counts as a visit.

Trip Studio is a **manual planning MVP**: it doesn't book travel, retrieve prices or preview reservation links.

## Technology

| Layer | Implementation |
| --- | --- |
| Interface | **React 19**, **TypeScript 6**, **Vite 8**, React Router 8, CSS Modules and the *Rose Glass* design tokens |
| 3D world | **Three.js** (raw WebGL, no React Three Fiber); custom CPU soft-body jelly physics, glass geometry and pointer controls |
| Data & sign-in | Local browser storage by default; optional **Supabase** account backup using email code or Google sign-in |
| Quality | **Vitest**, **Playwright**, ESLint, Prettier and TypeScript checks |
| Hosting | **Vercel** |

## Run locally

Requires **Node 22** and **npm 11**.

```bash
npm ci
npm run dev
```

Open the Vite URL printed in your terminal. Supabase is optional for local use; copy `.env.example` to `.env` to configure account backup. Never use a Supabase service-role key in the browser.

```bash
npm run check     # format, lint, typecheck and unit tests
npm run build
npm run test:browser
```

**Routes:** `/` for the country collection; `/tripstudio` for trips; `/tripstudio/:tripId` and `/trips/:tripId` for an individual plan.

## In development

The [**journey-map branch**](https://github.com/arvikachristy/semesta/tree/codex/trip-journey-map) adds an editable day-axis with **Interact.js** drag/resize on mouse and touch, booking-status summaries, gaps, and persistent add/edit/delete/undo for trip blocks. It is currently **five commits ahead of `master` and not yet part of the main deployment**. [Try the preview ↗](https://semesta-git-codex-trip-journey-map-vchristy.vercel.app/tripstudio).

[Design system](docs/design-system.md) · [Country catalogue](docs/country-catalogue.md) · [Account setup](docs/account-setup.md) · [Engineering notes](docs/implementation-notes-archive.md)
