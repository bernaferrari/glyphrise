"use client"

import { TIMELINE_LAYER } from "./TimelineLayering"

export function TimelinePlayheadLine({ playheadX }: { playheadX: string }) {
  return (
    <div
      className="pointer-events-none absolute top-[var(--timeline-ruler-height)] bottom-0 w-px -translate-x-1/2 bg-(--timeline-playhead) shadow-[0_0_0_0.5px_rgba(0,0,0,0.25)]"
      style={{ left: playheadX, zIndex: TIMELINE_LAYER.lanePlayheadLine }}
    />
  )
}
