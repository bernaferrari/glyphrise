"use client"

import { useCallback, type RefObject, type UIEvent } from "react"

export function useTimelineRailScrollSync({
  leftRailBodyRef,
  timelineScrollRef,
}: {
  leftRailBodyRef: RefObject<HTMLDivElement | null>
  timelineScrollRef: RefObject<HTMLDivElement | null>
}) {
  // Both surfaces scroll natively: touch, keyboard focus and scrollIntoView all
  // work on the rail. Equality guards keep their scroll events from bouncing.
  const handleLeftRailScroll = useCallback(
    (event: UIEvent<HTMLElement>) => {
      const scroller = timelineScrollRef.current
      if (scroller && scroller.scrollTop !== event.currentTarget.scrollTop) {
        scroller.scrollTop = event.currentTarget.scrollTop
      }
    },
    [timelineScrollRef]
  )

  const syncLeftRailScroll = useCallback(
    (scrollTop: number) => {
      const viewport = leftRailBodyRef.current?.parentElement
      if (viewport && viewport.scrollTop !== scrollTop) {
        viewport.scrollTop = scrollTop
      }
    },
    [leftRailBodyRef]
  )

  return { handleLeftRailScroll, syncLeftRailScroll }
}
