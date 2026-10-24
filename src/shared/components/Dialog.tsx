import { type PropsWithChildren, useEffect, useRef } from 'react'

interface DialogProps extends PropsWithChildren {
  open: boolean
  onClose: () => void
  labelledBy: string
}

// Native <dialog>: focus trap, Escape to close and inert background come for free.
export function Dialog({ open, onClose, labelledBy, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => { if (event.target === ref.current) onClose() }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border-0 bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/60 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      {/* Mounted only while open, so every opening starts from a clean state. */}
      {open ? <div className="flex flex-col gap-4 p-6">{children}</div> : null}
    </dialog>
  )
}
