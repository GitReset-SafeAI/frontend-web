import { Loader2 } from 'lucide-react'

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-10 text-ink-muted">
      <Loader2 className="size-9 animate-spin text-navy" aria-hidden />
      <p className="m-0">{label}</p>
    </div>
  )
}
