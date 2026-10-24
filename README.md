# SafeStep — web

Responsive web app for **SafeStep**, an AI-assisted personal-safety reporting and location-based
safety-awareness platform for girls and women who travel alone in Sri Lanka. It is the browser
counterpart of the Expo mobile app (`GitReset-Frontend`) and shares its design tokens, service
contracts, mock fixtures and English/Sinhala strings.

> **Status: Supabase login and authenticated report creation are connected.** Demo analysis, voice transcription
> and hotspot data use clearly labelled **mock services**. Real report analysis is triggered by the backend.
> The interactive **map is built
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

SafeStep does not track people, guarantee that any place is safe, or alert anyone on SOS (it places
a call from the user's own phone to their own emergency contact, not to the police).

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page: problem, how it works, honest limits, sample AI estimate |
| `/report` … `/report/submitted` | Describe → When & where → Details → Review → Submitted |
| `/safety` | Safety map: map slot + list of aggregated areas (side by side on large screens) |
| `/emergency` | Giant SOS button, what happens when you tap, and tap-to-call links for your emergency contacts |
| `/sos` | Full-screen 5 s cancellable countdown, then `tel:` the primary emergency contact |
| `/login` | Supabase email/password login, or demo login/signup (see configuration below) |
| `/account` | Your account and up to 5 emergency contacts (needs login) |

Responsive behaviour: phones get a bottom tab bar and sticky step actions; ≥768 px gets a top nav; the
safety page shows map and list together at ≥1024 px. An SOS pill is in every header outside the emergency
page.

## Demo sign-in

Sign-in is a **demo** behind the same service layer as everything else (`src/services/mocks/accounts.ts`):

**Quickest:** run `npm run dev`, open `/login` and click **Use demo account** (or log in as `demo@safestep.lk`
with any password). It comes with two sample contacts (placeholder numbers: add your own to test dialling).

**Or make your own:**

1. On `/login` choose **Create account** and enter any name, any email and a password of 8+ characters. You land
   on `/account`.
2. Add an emergency contact (for example `077 123 4567`, `0771234567` or `+94 77 123 4567`; up to 5).
3. Tap **SOS** (header) or the Emergency page: after the 5 s countdown the phone dials the first contact.
   On a computer nothing can dial, so the page says so; test dialling on a phone (`npm run dev -- --host`).
4. **Log in** later with the same email in the same browser. No password is read, checked or stored.

Accounts and contacts are saved only in this browser's local storage (keys start with `safestep.demo.`), so they
do not follow you across browsers and disappear in a private window. Do not enter real people's numbers.
Clear them with `Object.keys(localStorage).filter(k => k.startsWith('safestep.demo.')).forEach(k => localStorage.removeItem(k))`.
Demo authentication is selected by `VITE_AUTH_MODE=demo` independently of `VITE_DATA_MODE`.
With `VITE_DATA_MODE=api`, data adapters other than report creation still fail explicitly until implemented.

## Supabase email/password login

The existing auth provider uses a Supabase adapter when `VITE_AUTH_MODE=supabase`.
It supports existing-user password login, SDK-managed session persistence and refresh,
session-change subscriptions, and local-device logout. Report creation uses the current session's access
token as a Bearer token; the publishable key is never used as the backend Bearer token.
Real signup, confirmation callbacks, password recovery, and OAuth are outside this phase.
Signup and the demo login controls/notices are available only in demo auth mode.

To configure locally:

1. Open the Supabase dashboard and select the intended project. Do not reuse another project's configuration.
2. Open the project's **Connect** dialog and copy its **Project URL** and **publishable key**.
   To select a particular publishable key, use **Settings > API Keys**.
   Official guide: https://supabase.com/docs/guides/getting-started/api-keys
3. Create or edit `.env.local` in this repository's root (alongside `package.json`), preserving any existing
   local settings. Replace only the placeholders below with the matching public project values.
4. Restart `npm run dev` after saving; Vite reads these variables at startup. For deployment, set the
   same public variables in the build environment and rebuild.
5. Open `/login` and use an existing email/password account. Its email must be confirmed if the project
   requires confirmation. Live login has not been verified by the mocked tests.

```dotenv
VITE_AUTH_MODE=supabase
VITE_DATA_MODE=mock
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
```

The client accepts public publishable keys (`sb_publishable_...`) only. Never put a secret or service-role
key into any `VITE_` variable: those values are exposed to the browser. `.env.local` is ignored by Git;
`.env.example` contains placeholders only. Missing/invalid public configuration displays a clear login
configuration error and never falls back to demo authentication.

Auth and data modes are independent. Supabase auth selects real report creation even with mock data mode.
Hotspots and voice transcription retain their existing data-mode selection. Demo auth with mock data
continues to use local synthetic reports. No global mode or local credential file is changed automatically.
Emergency contacts, contact mutations, and SOS contact calling are explicitly unavailable for real users
until contact persistence and authorization are implemented. A real user never reads or writes the local
demo account's contact data. Existing demo accounts and contacts remain isolated and usable in demo mode.

Tests force demo/mock configuration by default. Supabase tests mock the SDK and public configuration;
they do not create accounts or make live authentication requests.

## Brand and design

The look is "wayfinding, with warmth": a serif/sans pairing, a winding road with a pin, the report shown as a
ticket, and routes with stops. 
The palette (navy `#133148`, mint `#8CC1B2`, coral `#E9736B`, off-white `#FEFCF7`) comes from the SafeStep
logo. Colour roles, measured contrast ratios, the logo assets and how Nielsen's heuristics map to the UI are
in [`design.md`](design.md). Tokens live in `src/styles/index.css`.

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

Configuration names and placeholders are in `.env.example`. Demo auth needs no keys;
Supabase auth requires the public URL and publishable key in `.env.local` as described above.

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
  services/       contracts (zod), auth adapters/client, mocks, api stub, query client/keys
  shared/         Button, ChoiceGroup, Dialog, InfoNote…, AppShell, StepLayout
  styles/         Tailwind v4 + brand tokens (@theme)
```

## Plugging in the map

Edit `src/features/safety/components/HotspotMapSlot.tsx`. Keep the `HotspotMapSlotProps` contract
(`hotspots`, `selectedId`, `onSelect`, `onDeselect`) and the rules in its doc comment: navy activity
ramp (never red/green), dashed/empty "not enough data", `{ latitude, longitude }` order, and the list as the
text alternative.

## Connecting the backend

Report submissions now include `language_hint`, derived from the latest description by
`features/reporting/detectReportLanguage.ts` when the review screen prepares its submission.
The detector is deterministic, local, and independent of the interface language. It never changes
the report text. Sinhala/Tamil letter counts provide script evidence; small English and Romanized
Sinhala token sets provide conservative Latin-text hints. Substantive evidence of multiple languages
can produce `mixed`; short, ambiguous, unsupported, or low-confidence text produces `unknown`.
English requires stronger evidence because the backend skips translation for `en`.

This prototype cannot reliably identify all Romanized Sinhala spellings, distinguish every Latin-script
language, or resolve code-switching versus borrowed words/names. False negatives are expected.
An `si-Latn` hint does not guarantee that the backend translator supports Romanized Sinhala.

`services/api/reportRequest.ts` prepares the confirmed payload for `POST /api/v1/reports`:
`original_text` (1–5,000 characters; whitespace-only rejected), `input_method` (`text` for typed input,
`voice` for the voice workflow), and `language_hint`. The original description is preserved without
trimming or translation. No `translated_text` or `user_id` is sent by the mapper.

The optional time-of-day chips send `reported_time` unchanged as `morning`, `afternoon`, `evening`,
`night`, `late_night`, or `not_sure`. Leaving the question unanswered omits it. There is no custom-time
control; the contract validator also accepts 24-hour `HH:mm` or 12-hour clock strings such as `5 PM`
and `5:30 PM`. The separate optional date/time input is interpreted in the device's time zone and
serialized as timezone-aware ISO UTC in `occurred_at`. A time-of-day answer never invents a date.

Lighting and current-safety selections use the exact backend enums. Approximate coordinates are
flattened to `latitude`/`longitude`; validation requires both numbers, both null, or both omitted.
Strict request schemas reject unsupported extra fields. The previous nearby-people question was
not a current-safety answer and is replaced by the actual safety question without inferring a status.

`reportResponseSchema` validates the flat HTTP 201 creation response with a UUID `id` and a boolean
`RAPID_SUBMISSIONS`. That boolean is a review signal, not a finding of fraud. The persisted UUID is
retained in the existing receipt/success flow. Demo analysis is kept separately under `demoAnalysis`;
real creation does not require or request analysis output, and there is no analysis-status assumption.

`services/api/reports.ts` posts to `${VITE_API_BASE_URL}/api/v1/reports`. The API base URL is optional in
the incoming environment configuration and has no runtime default. For report submission or other
API-backed features, set `VITE_API_BASE_URL=http://127.0.0.1:8000` (or your backend base URL) in your
existing `.env.local` and restart Vite. Missing API configuration shows a configuration error when an
API request is attempted; mock-backed features and Supabase login remain usable. The URL must
point to the backend origin/base, without a query string, fragment, or credentials. The backend must
allow the frontend origin and Authorization/Content-Type headers through CORS for browser requests.
Use the latest backend deployment: an older running OpenAPI document may still lack `reported_time`.

Before posting, the existing Supabase SDK restores/refreshes its session when possible. Missing/expired
sessions and HTTP 401 responses keep the in-memory draft and offer login again with a return to review,
including when the UI has a stale signed-in user. Validation, permission, rate-limit, and network errors
are shown without exposing backend/request details. POST requests are never automatically retried.
An unreadable/invalid HTTP 201 response is reported as confirmed creation with unreadable details;
immediate resubmission is disabled to reduce accidental duplicates. Drafts still disappear on refresh.
The frontend never calls the manual analysis endpoint. HTTP 201 confirms saved report creation only;
automatic-analysis failures do not become frontend creation failures.

Only `src/services/` talks to data. Report creation is connected through `apiServices`; remaining API
adapters throw `not-implemented` and never silently fall back to fake data. Other backend services still
need integration. The synthetic analysis model is demo-only.

## AI usage

- **In the product:** classification, severity, detail extraction and missing-information detection are
  handled by the backend for real reports. In demo mode they are **simulated** by keyword
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
URL, local storage or the query cache. The interface language is persisted. Demo auth stores synthetic
accounts/contacts locally; in Supabase mode the SDK persists its session in browser storage for restoration
and refresh, separately from demo storage. Browser
location is requested only when the user taps "Use my current location" and is rounded to ~1 km
immediately.

## Third-party

React, React Router, TanStack Query, Zod, i18next, Tailwind CSS, Vite, Lucide icons, Fontsource (Fraunces, Figtree, Noto Serif/Sans Sinhala and Tamil, all SIL OFL), Vitest and Testing
Library (see `package.json`). Add a project `LICENSE` before publishing the repository.
