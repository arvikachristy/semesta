# semesta ✦

_A little universe for everywhere you've been — and everywhere you're going._

**Semesta** means _universe_ in Bahasa Indonesia. This is a personal travel diary and an interactive frontend experiment: collect countries as playful jelly flags, then turn the next destination into a plan.

[**Explore the live app ↗**](https://semesta-gamma.vercel.app/) · [**Try Trip Studio in Canary ↗**](https://semesta-gamma.vercel.app/?devmode=true)

![Semesta homepage: continent glasses and collectible jelly flags](https://image.thum.io/get/noanimate/width/1200/crop/760/https://semesta-gamma.vercel.app/)

_Homepage preview captured from the live deployment via [Thum.io](https://www.thum.io/)._

## How it works

1. **Collect your world.** Explore seven continent glasses, play with soft-body flag jellies and mark destinations as **Been to** or **Bucket list**. Search the 199-destination catalogue on desktop or mobile.
2. **Start a trip (Canary).** Choose a city or country, then select flexible days using the dial or dates in the calendar. Semesta creates a draft and opens Trip Studio.
3. **Make a plan.** Arrange journeys and stays along a day-by-day map. Drag blocks to move them, resize stays, organise stops and nights, and see uncovered nights. Mouse, touch (press and hold) and keyboard controls are supported.
4. **Track progress.** Edit or remove planning items, undo deletions, attach booking links and mark what's **Booked** or still **To book**. Add optional activities under **Other plans**.
5. **Complete the loop.** When you're back, confirm which countries you actually visited and see new jellies appear. Planning alone never counts as a visit.

Trip Studio is a **manual planning MVP**: it doesn't book travel, retrieve prices or preview reservation links.

## Technology

| Layer          | Implementation                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Interface      | **React 19**, **TypeScript 6**, **Vite 8**, React Router 8, CSS Modules and the _Rose Glass_ design tokens                   |
| 3D world       | **Three.js** (raw WebGL, no React Three Fiber); custom CPU soft-body jelly physics, glass geometry and pointer controls      |
| Journey editor | **Interact.js** for drag/resize, touch hold and auto-scroll; day snapping and stable-ID CRUD through the existing trip store |
| Data & sign-in | Local browser storage by default; optional **Supabase** account backup using email code or Google sign-in                    |
| Quality        | **Vitest**, **Playwright**, ESLint, Prettier and TypeScript checks                                                           |
| State          | **Redux Toolkit** for Canary flags; trip persistence remains in feature repositories |\n| Hosting        | **Vercel**                                                                                                                   |

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

## Canary features

Trip Studio and its journey map are hidden while in beta. To test them, open [**Semesta Labs**](https://semesta-gamma.vercel.app/?devmode=true), tap the **⚗ Labs** icon and enable **Trip Studio**. Your selection is stored on this device, and developer mode lasts for the current tab. Normal visitors cannot access hidden Studio actions or URLs. Disabling a feature never deletes trips.

[Design system](docs/design-system.md) · [Country catalogue](docs/country-catalogue.md) · [Account setup](docs/account-setup.md) · [Engineering notes](docs/implementation-notes-archive.md)
