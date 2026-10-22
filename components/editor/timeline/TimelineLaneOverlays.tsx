"use client"

import { cssLength } from "@/lib/utils"

import type { PlaybackClock } from "../PlaybackClock"
import { usePlaybackClockTime } from "../useEditorPlaybackState"
import { TIMELINE_LAYER } from "./TimelineLayering"
import { quantizeTimeToFrame, xForFrac } from "./TimelineGeometry"

/** Where the playhead rests, and the clock that moves it during playback. */
export type TimelinePlayhead = {
  time: number
  duration: number
  frameSnapActive: boolean
  clock?: PlaybackClock
}

/** The playhead's x, following playback without re-rendering the timeline. */
export function useTimelinePlayheadX({
  time,
  duration,
  frameSnapActive,
  clock,
}: TimelinePlayhead) {
  const liveTime = usePlaybackClockTime(clock, time)
  const visibleTime = frameSnapActive ? quantizeTimeToFrame(liveTime) : liveTime
  return xForFrac(visibleTime / duration)
}

export function TimelinePlayheadLine({
  playhead,
  onPointerDown,
}: {
  playhead: TimelinePlayhead
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
}) {
  const playheadX = useTimelinePlayheadX(playhead)
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
        className="pointer-events-none absolute top-(--timeline-ruler-height) bottom-0 left-(--position-x) z-(--stack-order) w-px -translate-x-1/2 bg-foreground ring-1 ring-black/20"
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
