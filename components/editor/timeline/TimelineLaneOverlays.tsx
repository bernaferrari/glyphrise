"use client"

import { TIMELINE_LAYER } from "./TimelineLayering"

export function TimelinePlayheadLine({ playheadX }: { playheadX: string }) {
  return (
    <div
      className="pointer-events-none absolute top-[var(--timeline-ruler-height)] bottom-0 w-px -translate-x-1/2 bg-destructive"
      style={{ left: playheadX, zIndex: TIMELINE_LAYER.lanePlayheadLine }}
    />
  )
}
