"use client"

import { cssLength } from "@/lib/utils"

import { TIMELINE_LAYER } from "./TimelineLayering"

export function TimelinePlayheadLine({ playheadX }: { playheadX: string }) {
  return (
    <div
      className="pointer-events-none absolute top-(--timeline-ruler-height) bottom-0 left-(--position-x) z-(--stack-order) w-px -translate-x-1/2 bg-(--timeline-playhead) shadow-color-handle-edge"
      style={
        {
          "--position-x": cssLength(playheadX),
          "--stack-order": TIMELINE_LAYER.lanePlayheadLine,
        } as React.CSSProperties
      }
    />
  )
}
