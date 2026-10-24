import { AlertCircle, Info, type LucideIcon } from 'lucide-react'

interface InfoNoteProps {
  text: string
  icon?: LucideIcon
  tone?: 'neutral' | 'error'
}

// Short, quiet explanatory text. Tone is always paired with an icon, never colour alone.
export function InfoNote({ text, icon, tone = 'neutral' }: InfoNoteProps) {
  const error = tone === 'error'
  const Icon = icon ?? (error ? AlertCircle : Info)
  return (
    <div
      role={error ? 'alert' : undefined}
      className={`flex items-start gap-3 rounded-lg p-4 ${error ? 'bg-danger-bg' : 'bg-mint-soft'}`}
    >
      <Icon className={`mt-1 size-5 shrink-0 ${error ? 'text-danger' : 'text-navy'}`} aria-hidden />
      <p className="m-0 text-[0.9375rem] text-ink">{text}</p>
    </div>
  )
}
