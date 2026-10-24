export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'tonal'
  | 'text'
  | 'light'
  | 'outlineLight'
  | 'textLight'

// One button size site-wide: every action is at least 56px tall, above the 48px minimum.
const base =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed'

// Roles: navy = in-flow actions. Coral (navy text, 4.6:1) = the single "start a report" call to action.
// Mint = low-emphasis tonal. Light variants sit on the red SOS screen only.
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-navy text-white shadow-[0_6px_18px_rgb(19_49_72/0.25)] hover:bg-navy-hover active:bg-navy-hover',
  accent: 'bg-coral text-navy shadow-[0_6px_18px_rgb(233_115_107/0.35)] hover:bg-coral-hover active:bg-coral-hover',
  secondary: 'border-2 border-navy bg-surface text-navy hover:bg-mint-soft',
  tonal: 'bg-mint text-navy hover:bg-mint-hover',
  text: 'text-navy hover:bg-mint-soft',
  light: 'bg-white text-sos hover:bg-sos-ring-outer',
  outlineLight: 'border-2 border-white text-white hover:bg-white/10',
  textLight: 'text-white hover:bg-white/10',
}

export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim()
}
