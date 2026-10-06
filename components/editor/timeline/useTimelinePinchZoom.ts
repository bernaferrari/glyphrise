"use client"

import { RefObject, useEffect, useLayoutEffect, useRef } from "react"
import { EDGE_INSET } from "./TimelineGeometry"

type Anchor = { fraction: number; offset: number }

/**
 * Two fingers zoom time around the point between them, like ShapeShifter's
 * timeline: the moment under your fingers stays under your fingers. One
 * finger keeps scrolling natively in both directions.
 */
export function useTimelinePinchZoom({
  scrollRef,
  zoom,
  setZoom,
}: {
  scrollRef: RefObject<HTMLDivElement | null>
  zoom: number
  setZoom: (zoom: number) => void
}) {
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const setZoomRef = useRef(setZoom)
  setZoomRef.current = setZoom
  const pendingRef = useRef<Anchor | null>(null)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    let pinch: { distance: number; zoom: number; fraction: number } | null =
      null

    const pair = (event: TouchEvent) => {
      const [a, b] = [event.touches[0], event.touches[1]]
      return {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        x: (a.clientX + b.clientX) / 2 - scroller.getBoundingClientRect().left,
      }
    }
    // Lane time is inset on both ends, so anchor on time, not raw width.
    const usable = () => Math.max(1, scroller.scrollWidth - EDGE_INSET * 2)
    const fractionAt = (offset: number) =>
      (scroller.scrollLeft + offset - EDGE_INSET) / usable()

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      const { distance, x } = pair(event)
      // Nearly coincident contacts are not a reliable zoom baseline.
      if (distance < 8) return
      pinch = { distance, zoom: zoomRef.current, fraction: fractionAt(x) }
    }
    const move = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return
      if (event.cancelable) event.preventDefault()
      const { distance, x } = pair(event)
      const anchor = { fraction: pinch.fraction, offset: x }
      const next = (pinch.zoom * distance) / pinch.distance
      if (Math.abs(next - zoomRef.current) < 0.005) {
        // Same zoom: the midpoint drifted, so pan with it.
        scroller.scrollLeft =
          EDGE_INSET + anchor.fraction * usable() - anchor.offset
        return
      }
      pendingRef.current = anchor
      setZoomRef.current(next)
    }
    const end = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null
    }

    scroller.addEventListener("touchstart", start, { passive: true })
    scroller.addEventListener("touchmove", move, { passive: false })
    scroller.addEventListener("touchend", end)
    scroller.addEventListener("touchcancel", end)
    return () => {
      scroller.removeEventListener("touchstart", start)
      scroller.removeEventListener("touchmove", move)
      scroller.removeEventListener("touchend", end)
      scroller.removeEventListener("touchcancel", end)
    }
  }, [scrollRef])

  useLayoutEffect(() => {
    const anchor = pendingRef.current
    const scroller = scrollRef.current
    pendingRef.current = null
    if (!anchor || !scroller) return
    const usable = Math.max(1, scroller.scrollWidth - EDGE_INSET * 2)
    scroller.scrollLeft = EDGE_INSET + anchor.fraction * usable - anchor.offset
  }, [scrollRef, zoom])
}
