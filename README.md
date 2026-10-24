# SafeRoute AI web

React + TypeScript web application foundation, built with Vite and Tailwind CSS.
The initial screen is deliberately neutral and can be replaced when the mobile
application has been reviewed for the product's screens, flows, and visual design.

## Getting started

Use Node.js 22.12 or newer (validated with Node.js 24) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use npm and keep `package-lock.json` as the
single dependency lockfile.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload. |
| `npm run build` | Type-check both TypeScript projects and build into `dist/`. |
| `npm run preview` | Serve the production build locally after building. |
| `npm run lint` | Run Oxlint, including React hooks rules. |
| `npm run typecheck` | Check app and tooling types without emitting JavaScript. |

No test framework is installed yet, so there is no test script. Add a framework
alongside behavior that needs automated tests.

## Project structure

```text
src/
  app/
    App.tsx                       Application composition
  components/
    layout/
      AppLayout.tsx               Shared responsive page container
  pages/
    FoundationPage.tsx            Replaceable placeholder screen
  styles/
    index.css                     Tailwind import and global base styles
  main.tsx                        React root and StrictMode
```

`App` currently renders a single page directly. Introduce `routes/` and a router
when multiple screens need navigation; place application context setup under
`app/providers/` when providers are needed.

Create other directories as real code requires them:

- `components/ui/`: shared interface primitives.
- `features/`: feature-specific components, hooks, and logic.
- `services/`: API clients and external communication.
- `hooks/`: hooks shared across features.
- `lib/`: shared library setup and adapters.
- `utils/`: pure helper functions; `types/`: shared domain types.
- `assets/`: imported images and fonts; `public/`: files served unchanged.

Keep page composition separate from feature logic and API communication. No
authentication, API integration, maps, reporting, translation, or product flows
are included at this stage.

## Configuration

- Vite uses the official React plugin and `@tailwindcss/vite`.
- Tailwind v4 is imported with `@import "tailwindcss"` in the global stylesheet.
  It detects source files automatically; no v3 configuration, PostCSS setup, or
  `@tailwind` directives are used.
- TypeScript uses strict checking with separate app and tooling projects.
- Oxlint uses `.oxlintrc.json` for React and TypeScript linting.
- The responsive shell uses fluid width, a content maximum width, and mobile-first
  spacing. Typography uses local system fonts and neutral colours only.

## Environment variables

No environment variables are required. There is no `.env.example` because there
are no configuration values to document yet. Local `.env` files are ignored.
When public configuration is introduced, document its keys in `.env.example`.
Values prefixed with `VITE_` are included in browser bundles and must never contain
secrets.

## Next stage

Review the mobile application separately before introducing screens, navigation,
branding, or integrations. No further setup is required to run this foundation.
