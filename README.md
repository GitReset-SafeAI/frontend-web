# SafeRoute AI — web

Responsive web app for **SafeRoute AI**, an AI-assisted personal-safety reporting and location-based
safety-awareness platform for girls and women who travel alone in Sri Lanka. It is the browser
counterpart of the Expo mobile app (`GitReset-Frontend`) and shares its design tokens, service
contracts, mock fixtures and English/Sinhala strings.

> **Status: frontend only.** AI analysis, voice transcription and hotspot data come from clearly
> labelled **mock services** until the FastAPI/Supabase backend exists. The interactive **map is built
> separately**; this app ships a documented slot for it (see below).

## The problem

It is hard to know whether an unfamiliar road, public place or transport stop is safe. Information
about incidents is scattered across social media, personal networks and informal chats, so recurring
patterns stay hidden.

## The solution

1. **Report** an incident by writing or speaking (English, සිංහල, தமிழ், or mixed). Everything after the
   description is optional.
2. **AI analysis** suggests a category, an estimate of seriousness, key details and what is missing,
   always shown separately from the user's own words and labelled an estimate.
3. **Integrity checks** may flag duplicates or unusual patterns (a signal, never proof).
4. **Area summaries** show privacy-protected counts per area, never descriptions or exact locations.

SafeRoute AI does not track people, guarantee that any place is safe, or alert anyone on SOS (it places
a call from the user's phone).

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page: problem, how it works, honest limits, sample AI estimate |
| `/report` … `/report/submitted` | Describe → When & where → Details → Review → Submitted |
| `/safety` | Safety map: map slot + list of aggregated areas (side by side on large screens) |
| `/emergency` | Giant SOS button, direct 119 / 1990 links |
| `/sos` | Full-screen 5 s cancellable countdown, then `tel:119` |

Responsive behaviour: phones get a bottom tab bar and sticky step actions; ≥768 px gets a top nav; the
safety page shows map and list together at ≥1024 px. An SOS pill is in every header outside the emergency
page.

## Getting started

Node.js 22.12+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev        # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint (React hooks rules) |
| `npm run typecheck` | Type-check app and tooling |
| `npm test` | Vitest + Testing Library (report flow, SOS, safety list, i18n, language switching, a11y behaviours) |
| `npm run check` | typecheck + lint + tests |

Configuration is in `.env.example` (`VITE_DATA_MODE=mock|api`). No keys or credentials are needed.

## Project structure

```text
src/
  app/            providers, routes, scroll/focus reset
  config/         validated public env
  features/
    landing/      landing + 404
    emergency/    SOS button, emergency page, countdown page, numbers
    reporting/    draft context, 5 step screens, voice + district dialogs, location hook
    incident-ai/  AnalysisSummary (estimate UI) + shared category labels
    safety/       list, activity badges, HotspotMapSlot (map integration point)
  i18n/           i18next setup; locales/{en,si,ta}/*.json (web.json is web-only)
  services/       contracts (zod), mocks, api stub, query client/keys
  shared/         Button, ChoiceGroup, Dialog, InfoNote…, AppShell, StepLayout
  styles/         Tailwind v4 + brand tokens (@theme)
```

## Plugging in the map

Edit `src/features/safety/components/HotspotMapSlot.tsx`. Keep the `HotspotMapSlotProps` contract
(`hotspots`, `selectedId`, `onSelect`, `onDeselect`) and the rules in its doc comment: purple activity
ramp (never red/green), dashed/empty "not enough data", `{ latitude, longitude }` order, and the list as the
text alternative.

## Connecting the backend

Only `src/services/` talks to data. `mocks/` is the default; `api/` throws `not-implemented` for every
call so nothing silently falls back to fake data. When the contract is agreed, implement `apiServices`
and validate responses with the zod schemas in `services/contracts/`. Open questions (vocabularies,
thresholds, auth, idempotency, audio) are tracked in the mobile repo's `docs/contract-decisions.md`; the
provisional contracts here are identical to the mobile ones.

## AI usage

- **In the product:** classification, severity, detail extraction and missing-information detection are
  intended to be done by an LLM on the backend. In this frontend they are **simulated** by keyword
  heuristics in `services/mocks/fixtures/analysis.ts` and the UI says so. Voice input records no audio and
  returns a sample transcript.
- **Responsible-AI choices in the UI:** results are labelled estimates; the user's words stay separate;
  "Unknown" is never shown as "Low"; few reports is never shown as safe; anomalies are not accusations.
- **AI-assisted development (disclosure):** this web app was built with Claude Code (Anthropic) from the
  existing mobile app and product brief. All code should be reviewed and understood by the team before
  the demo.

## Accessibility

Keyboard-operable with visible focus, skip link, `lang` follows the interface language, 48 px+ targets,
status never conveyed by colour alone, live regions for progress and errors, `prefers-reduced-motion`
honoured, native `<dialog>` for modals. The interface is available in English, සිංහල and தமிழ் (switch in the header; the choice is remembered).
Sinhala copy for the web-only strings and all Tamil copy are first drafts and should be reviewed by fluent
speakers.

## Privacy

Draft reports live in memory only and are cleared on Done/refresh. Nothing about a report goes in the
URL, local storage or the query cache. The only thing persisted is the interface language. Browser
location is requested only when the user taps "Use my current location" and is rounded to ~1 km
immediately.

## Third-party

React, React Router, TanStack Query, Zod, i18next, Tailwind CSS, Vite, Lucide icons, Vitest and Testing
Library (see `package.json`). Add a project `LICENSE` before publishing the repository.
