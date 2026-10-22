"use client"

import { RefObject, useLayoutEffect, useMemo, useState } from "react"
import type { PlaybackClock } from "../PlaybackClock"
import {
  createSecondGridTicks,
  createTimelineTicks,
  quantizeTimeToFrame,
} from "./TimelineGeometry"
import type { TimelinePlayhead } from "./TimelineLaneOverlays"

export function useTimelineViewportState({
  currentTime,
  clock,
  duration,
  timelineZoom,
  frameSnapActive,
  timelineScrollRef,
}: {
  currentTime: number
  clock?: PlaybackClock
  duration: number
  timelineZoom: number
  frameSnapActive: boolean
  timelineScrollRef: RefObject<HTMLDivElement | null>
}) {
  const [viewportWidth, setViewportWidth] = useState(800)
  useLayoutEffect(() => {
    const scroller = timelineScrollRef.current
    if (!scroller) return
    const measure = () => setViewportWidth(scroller.clientWidth || 800)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [timelineScrollRef])

  const visibleCurrentTime = frameSnapActive
    ? quantizeTimeToFrame(currentTime)
    : currentTime

  const timelineTicks = useMemo(
    () =>
      createTimelineTicks({
        duration,
        timelineZoom,
        frameSnapActive,
        viewportWidth,
      }),
    [duration, frameSnapActive, timelineZoom, viewportWidth]
  )

  const secondGridTicks = useMemo(
    () => createSecondGridTicks(duration),
    [duration]
  )

  const playhead = useMemo<TimelinePlayhead>(
    () => ({ time: currentTime, duration, frameSnapActive, clock }),
    [clock, currentTime, duration, frameSnapActive]
  )

  return {
    visibleCurrentTime,
    playhead,
    timelineTicks,
    secondGridTicks,
  }
}
