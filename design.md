# Design

Design a modern, accessible mobile safety and incident-reporting app.

## Visual style

- Light lavender/purple visual identity
- Calm, trustworthy, community-safety feeling
- Pale lavender-white screen background `#FAF7FC`
- White cards and input surfaces `#FFFFFF`
- Primary purple `#8B5BA7` for main buttons and brand accents
- Deep purple `#7B3FB5` for headings, selected navigation, and emphasis
- Soft lavender `#D8CCF5` for selected states and tinted containers
- Primary text `#30243A`
- Secondary text `#6F6478`
- Subtle borders `#E8E0EE`
- Disabled color `#B8A9C5`
- Error `#A62532` with pale error background `#FCE8EB`
- Information `#245A89`, success `#25633C`, warning `#785500`, unknown `#535E68`

## Layout

- Mobile-first screens with safe-area spacing
- 24px page padding
- 16px internal card spacing
- 8px, 16px, and 24px corner radii depending on component size
- White outlined cards with subtle lavender borders and minimal shadows
- Bottom tab navigation with Report and Safety Map tabs
- Active navigation uses `#7B3FB5`; inactive navigation uses `#6F6478`
- Use shield branding, clipboard/report icons, and map icons

## Typography

- Main titles around 28px with 40px line height
- Body text 16px with 28px line height
- Labels 14px with 24px line height
- Deep purple headings, dark primary body text, muted secondary descriptions
- Support English and Sinhala text without clipping or overcrowding

## Accessibility

- Minimum 4.5:1 text contrast
- Minimum 48px touch targets
- Never communicate status through color alone
- Pair semantic status colors with text and/or icons
- Keep controls clearly outlined and focus-visible
- Do not use light gray `#B8B8B8` for important readable text
- Avoid white text over decorative purple gradients unless contrast is verified
- Use decorative purple circles or a soft lavender gradient only for hero sections or empty states, not as the default background for information-heavy screens.
