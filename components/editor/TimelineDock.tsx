"use client"

import { Timeline } from "./Timeline"
import type { TimelineProps } from "./timeline/TimelineTypes"

type TimelineDockProps = {
  zenMode: boolean
  timelineProps: TimelineProps
}

export function TimelineDock({ zenMode, timelineProps }: TimelineDockProps) {
  return (
    <div
      inert={zenMode}
      aria-hidden={zenMode}
      className={`shrink-0 overflow-hidden ${
        zenMode
          ? "h-0 border-t-0"
          : "h-[clamp(152px,24dvh,184px)] border-t border-border bg-background"
      }`}
    >
      <Timeline {...timelineProps} />
    </div>
  )
}
