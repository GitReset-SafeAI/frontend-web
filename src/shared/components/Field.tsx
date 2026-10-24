import { type InputHTMLAttributes, useId } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

// A labelled text input. The label is always visible (never a placeholder), the hint explains the format,
// and the error is announced and tied to the input, so nothing depends on colour alone.
export function Field({ label, hint, error, id, className = '', ...rest }: FieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint && !error ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-base font-semibold text-ink">{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-14 w-full rounded-lg border bg-surface px-4 text-base text-ink placeholder:text-ink-muted ${
          error ? 'border-2 border-danger' : 'border-ink-muted/60 hover:border-navy'
        } ${className}`}
        {...rest}
      />
      {hint && !error ? <p id={hintId} className="m-0 text-sm text-ink-muted">{hint}</p> : null}
      {error ? <p id={errorId} role="alert" className="m-0 text-sm font-medium text-danger">{error}</p> : null}
    </div>
  )
}
