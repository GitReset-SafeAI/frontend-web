import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg border border-line/70 bg-surface p-5 shadow-card sm:p-6 ${className}`} {...rest} />
}
