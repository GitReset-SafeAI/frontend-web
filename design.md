# Design: SafeStep web

A calm, trustworthy, community-safety product for girls and women who travel alone in Sri Lanka.
The palette comes from the SafeStep logo (navy ribbon, mint ribbon, coral location pin).

## Design direction: wayfinding, with warmth

The logo is a road, so the product is a guide for the road. We looked at what works in neighbouring
products and took one idea from each, avoiding the generic "cards on a white page" look:

| Reference | Taken | Avoided |
| --- | --- | --- |
| Moovit, Citymapper, transit maps | Journeys as routes with stops: the report flow and "How it works" are routes with stations, ending at a pin | Dense, technical transit UI |
| Flo, Headspace, Finch | Warm serif headlines, rounded shapes, gentle tone for a sensitive topic | Twee illustration and mascots |
| Citizen, Noonlight, bSafe | One dominant emergency button, a plain "what happens when you tap" timeline | Dark, fear-driven styling |
| Safecity, Hollaback! | Plain human voice, honesty up front | Corporate dashboards |
| Boarding passes, receipts | The report as a **ticket**: your words on top, a perforated tear, the AI's reading below, stamped ESTIMATE | Faux realism |
| Road signs | The honesty principles as signs (circle, diamond, square, red circle for SOS) | Decorative-only icons |

Signature elements: the winding road with a coral pin (hero, closing call to action, report aside), the
ticket, the route-with-stops progress, the raised coral Report button in the phone tab bar, and the
hand-drawn coral underline on the one phrase that matters in the hero.

## Colour

| Role | Token | Hex | Used for |
| --- | --- | --- | --- |
| Deep navy | `navy` / `ink` | `#133148` | Headings, body text, primary buttons, outlines, selected borders, footer |
| Muted text | `ink-muted` | `#4A5C6C` | Secondary text, hints |
| Muted mint | `mint` | `#8CC1B2` | Tonal buttons, accents |
| Mint light / soft | `mint-light` / `mint-soft` | `#D5EAE3` / `#EAF4F0` | Selected chips, info notes, hero wash, map placeholder |
| Coral | `coral` | `#E9736B` | The "start a report" call to action (with navy text), logotype "Step", small decorative rules and the pin |
| Warm off-white | `screen` | `#FEFCF7` | Page background |
| White | `surface` | `#FFFFFF` | Cards, inputs |
| Line | `line` | `#DCD8CB` | Decorative card borders |
| SOS red | `sos` | `#A62532` | SOS and errors only, so red keeps its meaning |
| Status | `info` `success` `warning` `unknown` | `#245A89` `#25633C` `#785500` `#535E68` | Always paired with an icon or words |

Reported-activity ramp (map and list): pale navy `#C9D6E2` → `#5B7C99` → `#133148`, "not enough data" is
white and dashed. Never red or green: a pale area is not "safe".

### Contrast (measured, WCAG 2.2)

| Pair | Ratio | Result |
| --- | --- | --- |
| Navy on off-white | 13.1 | AAA |
| White on navy (primary button) | 13.5 | AAA |
| Muted text on off-white / white / mint-soft | 6.7 / 6.9 / 6.2 | AA |
| Navy on mint, on mint-light | 6.7, 10.7 | AA/AAA |
| **Navy on coral (accent button)** | **4.57** | AA |
| White on coral | 2.95 | **Fails**: never used |
| Coral text on off-white | 2.87 | **Fails**: coral is never text except the logotype |
| Footer secondary text on navy | 8.5 | AAA |
| White on SOS red | 7.2 | AAA |

Rules that follow: coral surfaces always take navy text; coral is not used for body text, links or
state; mint is never text; navy outlines (13:1) make every control findable without relying on colour.

## Typography and layout

- **Display:** Fraunces (soft serif) for headlines and key numbers. **Body:** Figtree. **Sinhala/Tamil:**
  Noto Serif and Noto Sans, matched to display and body. All are self-hosted (no CDN, no tracking) and
  split by unicode range, so Sinhala and Tamil files only download when those scripts are on the page.
- Sizes come from `.display-xl/lg/md` with per-script overrides, because Tamil clusters are wide and its
  longest words must still fit a phone and a half-width column. Body is 16px / 1.75 (1.85 for si/ta).
- Shape language: pill buttons and chips, 24px card radius, soft navy-tinted shadows, warm off-white
  ground with white cards.
- 8px spacing scale, 48px minimum targets (buttons are 56px), content max width 1152px.
- Phones: floating tab bar (Home, raised coral Report, Safety map) with sticky step actions above it; the
  SOS pill stays in the header. 768px+: pill navigation. 1024px+: the report form sits beside a quiet
  reassurance panel, and the safety page shows map and list side by side.
- The map placeholder is an abstract base map with **no data on it**, so a stand-in is never mistaken for
  real incident data.

## Logo

`public/logo.png` (full), `public/logo-mark.png` (mark, transparent), `favicon.png`, `apple-touch-icon.png`
are derived from the supplied artwork with the background removed. The header wordmark is live text so
it stays sharp. On navy, the mark sits on an off-white tile because its navy ribbon would disappear.
Replace the PNGs with an SVG from the designer when one exists.

## Nielsen's usability heuristics, as applied

| Heuristic | Where |
| --- | --- |
| 1 Visibility of system status | Route progress with stops (ticked, current, upcoming), active nav chip, "Analysing your report…", locating/transcribing states, SOS countdown, map loading/retry, "Sample data" banner |
| 2 Match with the real world | Plain words ("Few reports", not scores), district names, SOS that calls someone you chose, red SOS, each language written in its own script |
| 3 User control and freedom | Back/Edit on every step, Cancel on SOS (also Escape), Remove location, tap a chosen option again to clear it, Start over, draft kept while browsing |
| 4 Consistency and standards | One button size and role system (navy = in-flow, coral = start a report, mint = tonal), one focus ring, shared step layout, red reserved for SOS |
| 5 Error prevention | SOS countdown, transcript must be confirmed, submit disabled until valid, no double submit, location only on tap and rounded to ~1 km |
| 6 Recognition over recall | Always-visible navigation, Review summary with Edit links, legend always shown with the map |
| 7 Flexibility and efficiency | SOS pill one tap from anywhere, voice or text, every optional step skippable, language switch in the header, skip-to-content link |
| 8 Aesthetic and minimalist design | One task per report step, emergency page is one button plus a three-step explainer, coral used sparingly so the call to action stands out, no decoration carries meaning |
| 9 Help users recover from errors | Messages say what to do next (denied location → choose a district; submit failed → your report is still here; dial failed → number shown) |
| 10 Help and documentation | Inline hints where needed ("Only an approximate area is used"), landing "How it works" and "Honest by design", limits repeated on every area card |

## Accessibility

Visible 3px navy focus ring with an off-white gap (white on the red SOS screen); status never by colour
alone (icons, text, dashed vs solid, heavier borders); live regions for progress and errors; native
`<dialog>`; `prefers-reduced-motion` honoured; `lang` follows the interface language.

## Honesty rules in the UI

- SOS only places a phone call from the device and says so; SafeStep alerts no one.
- Map levels describe *amount of reported activity*, never danger. Few reports does not mean safe; many
  reports may reflect more people or more reporting.
- AI output is always labelled an estimate and kept apart from the user's own words; unknown is never
  shown as low.
