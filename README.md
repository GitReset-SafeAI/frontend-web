# SafeStep — Web Platform

**SafeStep** is an AI-assisted safety-reporting and safety-awareness web platform for girls and women who travel alone in Sri Lanka. People report incidents in **English, සිංහල or தமிழ்** (or a mix), and the platform turns those reports into privacy-protected, aggregated areas on a map, with a journey planner that compares routes by how close they pass to reported areas.

> Built for **Hack for Humanity — Best Social Impact Web Platform** (Hacktoberfest Hack Day Colombo, organised by AI Collective Colombo with MLH). The repository history starts on 24 October 2026, the day of the hackathon.

This is the **main web application**. It works on phones, tablets and desktops in any modern browser.

| Repository | Role |
| --- | --- |
| **[frontend-web](https://github.com/GitReset-SafeAI/frontend-web)** (this repo) | The web platform (React + Vite) |
| [backend](https://github.com/GitReset-SafeAI/backend) | FastAPI service, AI pipeline, Supabase schema |
| [frontend-mobile](https://github.com/GitReset-SafeAI/frontend-mobile) | Companion mobile app (Expo / React Native) |

## The problem

It is hard to know whether an unfamiliar road, bus stop or public place is safe for a woman travelling alone. Information about harassment is scattered across social media and private chats, most incidents are never reported, and many people write in Sinhala, Tamil or "Singlish" (Sinhala typed in English letters), which generic tools handle poorly. Recurring patterns stay hidden, and travellers cannot make informed choices.

## The solution

1. **Report** an incident by typing or speaking, in English, Sinhala, Tamil or a mix. Only the description is required, and everything else is optional.
2. **AI analysis (on the backend)** translates the report and classifies it: incident type, provisional severity, confidence, lighting and time of day. It always flags uncertain reports for review and is treated as an estimate, never a verdict.
3. **See what has been reported.** The Safety Map shows aggregated areas, never individual reports or exact locations, and states that few reports does not mean an area is safe.
4. **Plan a journey.** Search a start and destination, compare routes, and optionally follow your walk and share a live link with someone you trust.
5. **SOS.** One large button starts a 5-second cancellable countdown, then dials the emergency contact *you* chose from your own phone. It never calls the police and never claims anyone has been alerted.

SafeStep does not track people and never claims that a place or route is safe.

## Features

Status reflects the code in this repository.

| Feature | Status |
| --- | --- |
| Landing page explaining the problem, how it works and its honest limits | Implemented |
| 5-step report flow: Describe, When & where, Details, Review, Submitted | Implemented |
| Report submission to the backend with a real Supabase session | Implemented (Supabase mode) |
| Voice input: records WAV in the browser, sends it to the backend for a transcript the user confirms | Implemented (Supabase mode); a sample transcript in demo mode |
| Approximate location (rounded to about 1 km, only when you tap the button) or a district picker | Implemented |
| Safety Map with Leaflet and OpenStreetMap: reported areas, severity-weighted intensity, report counts, time-of-day filter, evidence notice | Implemented (live backend data by default) |
| Journey planner: place search, walking or driving, route comparison with explanations | Implemented |
| Follow your journey with live location, remaining time, "you are inside a reported area" alert | Implemented |
| Share a journey: unguessable link at `/j/:shareId`, view-only, ends when you stop or it expires | Implemented |
| Supabase email/password login, session persistence and refresh, log out | Implemented |
| Demo sign-in and sign-up (no password checked, local to the browser) | Implemented (demo mode) |
| Emergency contacts (up to 5) and the SOS countdown | Implemented in **demo mode only** |
| English, සිංහල and தமிழ் for the whole interface | Implemented |
| Accessibility: large touch targets, measured contrast, status never by colour alone, screen-reader labels, reduced-motion support | Implemented |
| Showing the AI estimate for a real report back to the reporter | **Not implemented**: the analysis is saved by the backend; the web app confirms the report was saved |

### Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/report` to `/report/submitted` | The 5-step report flow |
| `/safety` | Safety Map and journey planner |
| `/j/:shareId` | View a shared journey |
| `/emergency` | SOS button and what happens when you tap it |
| `/sos` | Full-screen countdown, then `tel:` the primary contact |
| `/login`, `/account` | Sign in, account and emergency contacts |

Phones get a bottom tab bar and sticky step actions; screens 768 px and wider get a top navigation; an SOS pill is in every header outside the emergency page.

## AI usage

The AI runs in the [backend](https://github.com/GitReset-SafeAI/backend); this app sends reports and shows the results.

| Where | AI capability |
| --- | --- |
| Report submission | The backend translates Sinhala, Tamil, Singlish and mixed text to English and classifies it with an open-weight LLM (`openai/gpt-oss-20b` via Groq): incident type, safety concern, severity 0–10, confidence, lighting and time period. Uncertain or unreadable reports are saved as "needs review" instead of being guessed. |
| Voice input | Recordings are sent to the backend, which transcribes them with OpenAI Whisper `whisper-large-v3` (via Groq). The transcript is a draft the user edits and confirms. Recordings are not stored. |
| Safety Map | Reported areas come from DBSCAN clustering of the AI-analysed reports, weighted by severity, confidence and recency. |
| Demo mode only | AI results are **simulated** by keyword heuristics in `services/mocks/fixtures/analysis.ts`, and the interface labels them as demo. |

Responsible-AI choices in the interface: results are labelled estimates; the user's own words are shown separately; "Unknown" is never shown as "Low"; a quiet area is shown as "not enough data", not as reassuring; map intensity is also given in words and counts, never by colour alone; anomalies are signals, not accusations. In the web client the language hint for a report is a simple script-and-vocabulary check (`detectReportLanguage.ts`), not a language model, and the user can see and change it.

## Technology stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Vite, React Router |
| Styling | Tailwind CSS v4, custom brand tokens, Fontsource (Fraunces, Figtree, Noto Serif / Sans Sinhala and Tamil) |
| Data and validation | TanStack Query, Zod (every API response is validated) |
| Maps | Leaflet, react-leaflet, OpenStreetMap tiles |
| Auth | Supabase (`@supabase/supabase-js`) |
| i18n | i18next, react-i18next (en, si, ta) |
| Icons | Lucide |
| Tests and checks | Vitest, Testing Library, jsdom, Oxlint, TypeScript |
| Backend (separate repo) | FastAPI, Supabase, Groq (`gpt-oss-20b`, Whisper) |

## Getting started

Requires Node.js 22.12+ (validated on Node 24) and npm.

```sh
npm ci
npm run dev        # http://localhost:5173
```

**It runs with no keys.** With the defaults, accounts, reports and AI analysis are demo services that work entirely in the browser. The Safety Map defaults to the live backend (`VITE_SAFETY_MAP_MODE=api`), so to see it, either run the [backend](https://github.com/GitReset-SafeAI/backend) (it serves synthetic map data without credentials) or set `VITE_SAFETY_MAP_MODE=mock` for a clearly labelled offline map.

### Connecting the backend

Vite proxies `/api` to the backend origin, in development and in `npm run preview`. A deployed build needs the same `/api` reverse proxy, because the backend only enables CORS in development.

```dotenv
# .env.local  (restart Vite after changing)
VITE_API_BASE_URL=http://127.0.0.1:8000     # the backend origin
VITE_SAFETY_MAP_MODE=api                     # api | mock
VITE_DATA_MODE=mock                          # mock | api
VITE_AUTH_MODE=demo                          # demo | supabase
```

Start the backend with `uvicorn app.main:app --reload` (default port 8000; `.env.example` assumes 8001, so set `VITE_API_BASE_URL` to match the port you use).

### Real accounts and real reports (Supabase mode)

```dotenv
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
VITE_API_BASE_URL=http://127.0.0.1:8000
```

With `VITE_AUTH_MODE=supabase`, login uses the Supabase project, and report creation and voice transcription go to the backend with the user's access token as a Bearer token. The backend must have its own Supabase and Groq credentials configured. The publishable key is never used as a backend token.

- Find the URL and publishable key in the Supabase dashboard under **Connect** or **Settings > API Keys**.
- The client accepts public publishable keys (`sb_publishable_...`) only. **Never put a secret or service-role key in any `VITE_` variable**, because those values are shipped to the browser.
- `.env.local` is ignored by Git, and `.env.example` holds placeholders only.
- Sign-up, confirmation callbacks, password recovery and OAuth are not implemented; use an existing confirmed account.

### Demo sign-in

With `VITE_AUTH_MODE=demo` (the default) you can open `/login` and choose **Use demo account** (or log in as `demo@safestep.lk` with any password), or create an account with any name, email and 8+ character password. No password is read, checked or stored. The demo account has two sample contacts with placeholder numbers; add your own to test dialling, and do not enter real people's numbers. Accounts and contacts live only in this browser's local storage under keys starting `safestep.demo.`.

On a computer, SOS cannot place a call and says so. Test dialling on a phone with `npm run dev -- --host`.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |
| `npm run typecheck` | Type-check app and tooling |
| `npm test` | Vitest and Testing Library |
| `npm run check` | Type-check, lint and tests |

The tests force demo configuration, mock the Supabase SDK, and make no live network requests. They cover the report API, auth, account and contacts, phone numbers, place search and the map's intensity display.

## Project structure

```text
src/
  app/            providers, routes, scroll reset
  config/         validated public environment
  features/
    landing/      landing page and 404
    reporting/    report draft, 5 steps, voice recorder, district picker, location
    incident-ai/  estimate ticket and category labels
    safety/       map, journey planner, live journey, shared journey, time filter
    emergency/    SOS button, emergency page, countdown
    account/      login, account, emergency contacts
  i18n/           locales/{en,si,ta}
  services/       Zod contracts, API client and adapters, auth, demo mocks
  shared/         buttons, dialogs, layout
  styles/         Tailwind and brand tokens
```

Only `src/services/` talks to data. Mock and API implementations share the same typed contracts, so screens do not know which is in use. In API mode, any adapter without an agreed backend contract fails explicitly and never falls back to fake data.

Design notes, colour roles with measured contrast ratios, and how Nielsen's heuristics map to the UI are in [design.md](design.md).

## Privacy and safety

- Reports are private; public views show only aggregated areas and counts.
- Location is requested only when you tap "Use my current location" and is rounded to about 1 km immediately. Exact coordinates are never kept.
- Report drafts live in memory and are cleared when you finish. Nothing about a report is kept in the URL, local storage or the query cache. The only persisted preference is the interface language (and demo accounts in demo mode).
- Live journey positions are sent to the backend only while you share, at most every 10 seconds, and are deleted when you end the journey.
- No secrets are in this repository or shipped to the browser.
- SOS places a call from your own phone to your own contact. SafeStep does not contact anyone for you.
- Use fictional data when testing.

## AI-assisted development disclosure

AI coding assistants, including Claude Code (Anthropic), were used during development, together with the AI services described above in the running product. The team set the requirements and design decisions, and reviewed, tested and can explain the code.

## Third-party software, data and credits

- React, React Router, TanStack Query, Zod, i18next, Tailwind CSS, Vite, Vitest, Testing Library, Oxlint, Lucide icons, `@supabase/supabase-js` (all open source; see `package.json`).
- [Leaflet](https://leafletjs.com) and react-leaflet for maps.
- Map tiles and data: [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors (ODbL). Routes use OSRM and place search uses Photon, through the backend.
- Fonts via Fontsource, all SIL Open Font License: Fraunces, Figtree, Noto Serif / Sans Sinhala and Tamil.
- AI models served by [Groq](https://groq.com): `openai/gpt-oss-20b` (Apache 2.0) and `whisper-large-v3` (MIT).
- No real incident data is included; all demo and map sample data is invented.

## Team

Nadhiya Nashath, Sathya Abeytunge, Anuki Wanniarachchi, Ravindi Fernando.

## License

Released under the [MIT License](LICENSE).
