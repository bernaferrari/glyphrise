"use client"

import { RefObject, useLayoutEffect, useMemo, useState } from "react"
import {
  createSecondGridTicks,
  createTimelineTicks,
  quantizeTimeToFrame,
  xForFrac,
} from "./TimelineGeometry"

export function useTimelineViewportState({
  currentTime,
  duration,
  timelineZoom,
  frameSnapActive,
  timelineScrollRef,
}: {
  currentTime: number
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

  return {
    visibleCurrentTime,
    playheadX: xForFrac(visibleCurrentTime / duration),
    timelineTicks,
    secondGridTicks,
  }
}
