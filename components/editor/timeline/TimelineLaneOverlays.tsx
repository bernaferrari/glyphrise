"use client"

import { cssLength } from "@/lib/utils"

import { TIMELINE_LAYER } from "./TimelineLayering"

export function TimelinePlayheadLine({
  playheadX,
  onPointerDown,
}: {
  playheadX: string
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
}) {
  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Drag playhead"
        data-slot="timeline-playhead-line"
        onPointerDown={onPointerDown}
        className="absolute top-(--timeline-ruler-height) bottom-0 left-(--position-x) z-(--stack-order) w-3 -translate-x-1/2 cursor-ew-resize touch-none border-0 bg-transparent p-0 select-none"
        style={
          {
            "--position-x": cssLength(playheadX),
            "--stack-order": TIMELINE_LAYER.lanePlayheadDrag,
          } as React.CSSProperties
        }
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-(--timeline-ruler-height) bottom-0 left-(--position-x) z-(--stack-order) w-px -translate-x-1/2 bg-(--timeline-playhead) shadow-color-handle-edge"
        style={
          {
            "--position-x": cssLength(playheadX),
            "--stack-order": TIMELINE_LAYER.lanePlayheadLine,
          } as React.CSSProperties
        }
      />
    </>
  )
}
