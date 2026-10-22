"use client"

import { useEffect, type RefObject } from "react"
import type { PlaybackClock } from "../PlaybackClock"
import { EDGE_INSET } from "./TimelineGeometry"

/** Keeps the moving playhead in view while playing on a zoomed timeline. */
export function useTimelinePlayheadFollow({
  duration,
  isPlaying,
  timelineZoom,
  clock,
  laneRef,
  timelineScrollRef,
}: {
  duration: number
  isPlaying: boolean
  timelineZoom: number
  clock?: PlaybackClock
  laneRef: RefObject<HTMLDivElement | null>
  timelineScrollRef: RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    if (!isPlaying || !clock || timelineZoom <= 1) return

    const follow = () => {
      const scroller = timelineScrollRef.current
      const lane = laneRef.current
      if (!scroller || !lane) return
      const usable = Math.max(1, lane.offsetWidth - EDGE_INSET * 2)
      const playheadLeft =
        EDGE_INSET + usable * Math.max(0, Math.min(1, clock.get() / duration))
      const viewportLeft = scroller.scrollLeft
      const viewportRight = viewportLeft + scroller.clientWidth
      const margin = Math.min(160, scroller.clientWidth * 0.28)
      if (
        playheadLeft <= viewportRight - margin &&
        playheadLeft >= viewportLeft + margin
      )
        return
      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      scroller.scrollLeft = Math.max(
        0,
        Math.min(maxScroll, playheadLeft - scroller.clientWidth * 0.5)
      )
    }

    follow()
    return clock.subscribe(follow)
  }, [clock, duration, isPlaying, laneRef, timelineScrollRef, timelineZoom])
}
