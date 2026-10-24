import type { ComponentType } from 'react'

import { RoadArt } from './RoadArt'

interface AsidePanelProps {
  title: string
  items: { icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>; text: string }[]
}

// Quiet reassurance beside a form: the few things people want to know before they share something personal.
export function AsidePanel({ title, items }: AsidePanelProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-mint-soft p-6 pb-24">
      <h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>
      <ul className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-navy shadow-card">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <p className="m-0 text-[0.9375rem] text-ink">{text}</p>
          </li>
        ))}
      </ul>
      <RoadArt className="pointer-events-none absolute inset-x-0 bottom-0 aspect-[1200/260] w-full" />
    </div>
  )
}
