import type { PropsWithChildren } from 'react'

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-12 sm:px-8">
      <div className="w-full max-w-2xl">{children}</div>
    </main>
  )
}
