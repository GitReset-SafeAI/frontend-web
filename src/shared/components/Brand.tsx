// The logo mark is a raster of the supplied artwork; the wordmark is live text so it stays sharp and
// scales with the page. Coral "Step" is part of the logotype only: coral text fails contrast elsewhere.
export function BrandLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* On navy, the navy "S" would vanish, so the mark sits on an off-white tile. */}
      <span className={onDark ? 'grid place-items-center rounded-sm bg-screen p-1.5' : 'contents'}>
        <img src="/logo-mark.png" alt="" width={33} height={40} className="h-10 w-auto" />
      </span>
      <span className="whitespace-nowrap text-xl font-extrabold tracking-tight">
        <span className={onDark ? 'text-screen' : 'text-navy'}>Safe</span>
        <span className="text-coral">Step</span>
      </span>
    </span>
  )
}
