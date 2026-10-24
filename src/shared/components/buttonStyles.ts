export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'text' | 'light' | 'outlineLight' | 'textLight'

// One button size site-wide: every action is at least 56px tall, above the 48px minimum.
const base =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-sm px-6 text-base font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-dark text-white hover:bg-[#6a35a0] active:bg-[#5d2d90]',
  secondary: 'border-2 border-ink-muted bg-surface text-primary-dark hover:bg-tint-soft',
  tonal: 'bg-tint text-ink hover:bg-[#c9b9f0]',
  text: 'text-primary-dark hover:bg-tint-soft',
  light: 'bg-white text-sos hover:bg-sos-ring-outer',
  outlineLight: 'border-2 border-white text-white hover:bg-white/10',
  textLight: 'text-white hover:bg-white/10',
}

export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${base} ${variants[variant]} ${extra}`.trim()
}
