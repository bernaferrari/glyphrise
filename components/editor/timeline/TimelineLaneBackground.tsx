"use client"

import { cssLength } from "@/lib/utils"

import { EDGE_INSET, xForFrac } from "./TimelineGeometry"
import { TIMELINE_LAYER } from "./TimelineLayering"

export function TimelineLaneBackground({
  duration,
  secondGridTicks,
}: {
  duration: number
  secondGridTicks: number[]
}) {
  return (
    <>
      {secondGridTicks.map((time) => (
        <div
          key={`second-grid-${time}`}
          className="pointer-events-none absolute inset-y-0 left-(--position-x) w-px bg-border/45"
          style={
            {
              "--position-x": cssLength(xForFrac(time / duration)),
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
      ))}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-(--stack-order) w-(--element-width) bg-foreground/[0.03]"
        style={
          {
            "--element-width": cssLength(EDGE_INSET),
            "--stack-order": TIMELINE_LAYER.rangeGutter,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-(--stack-order) w-(--element-width) bg-foreground/[0.03]"
        style={
          {
            "--element-width": cssLength(EDGE_INSET),
            "--stack-order": TIMELINE_LAYER.rangeGutter,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    </>
  )
}
