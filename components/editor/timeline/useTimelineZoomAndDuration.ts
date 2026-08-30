"use client"

import { RefObject, useCallback, useEffect, useRef, useState } from "react"
import {
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_STEP,
  isEditableTarget,
} from "./TimelineGeometry"
import { clampTimelineDuration } from "../TimelineDurationModel"

const clampTimelineZoom = (zoom: number) =>
  Number(
    Math.max(TIMELINE_ZOOM_MIN, Math.min(TIMELINE_ZOOM_MAX, zoom)).toFixed(2)
  )

const DURATION_CLAMP_NOTICE_MS = 1800
const DURATION_CLAMP_MESSAGE = "Clamped to 0.5-30s"

type TimelineZoomAndDurationOptions = {
  duration: number
  onDurationChange: (duration: number) => void
  timelineScrollRef: RefObject<HTMLDivElement | null>
}

export function useTimelineZoomAndDuration({
  duration,
  onDurationChange,
  timelineScrollRef,
}: TimelineZoomAndDurationOptions) {
  const [timelineZoom, setTimelineZoom] = useState(1)
  const [durationEditor, setDurationEditor] = useState<string | null>(null)
  const [durationNotice, setDurationNotice] = useState<string | null>(null)
  const durationNoticeTimeoutRef = useRef<number | null>(null)

  const fitTimeline = useCallback(() => {
    setTimelineZoom(1)
    window.requestAnimationFrame(() => {
      if (timelineScrollRef.current) timelineScrollRef.current.scrollLeft = 0
    })
  }, [timelineScrollRef])

  const clearDurationNoticeTimeout = useCallback(() => {
    if (durationNoticeTimeoutRef.current !== null) {
      window.clearTimeout(durationNoticeTimeoutRef.current)
      durationNoticeTimeoutRef.current = null
    }
  }, [])

  const scheduleDurationEditorClose = useCallback(() => {
    clearDurationNoticeTimeout()
    durationNoticeTimeoutRef.current = window.setTimeout(() => {
      durationNoticeTimeoutRef.current = null
      setDurationNotice(null)
      setDurationEditor(null)
    }, DURATION_CLAMP_NOTICE_MS)
  }, [clearDurationNoticeTimeout])

  const settleDurationValue = useCallback(
    (value: number) => {
      const clamped = clampTimelineDuration(value)
      onDurationChange(clamped)
      if (clamped !== value) {
        // Keep the editor open so the clamp notice is actually visible,
        // then dismiss it once the reader has had a moment to see it.
        setDurationEditor(clamped.toFixed(1))
        setDurationNotice(DURATION_CLAMP_MESSAGE)
        scheduleDurationEditorClose()
        return
      }
      clearDurationNoticeTimeout()
      setDurationNotice(null)
      setDurationEditor(null)
    },
    [clearDurationNoticeTimeout, onDurationChange, scheduleDurationEditorClose]
  )

  const commitDurationEditor = useCallback(() => {
    if (durationEditor === null) return
    const parsed = Number.parseFloat(durationEditor)
    // Invalid draft via Enter: stay open so the destructive hint stays up.
    // Outside-click dismissal is reverted by the caller (TimelineHeader).
    if (!Number.isFinite(parsed)) return
    settleDurationValue(parsed)
  }, [durationEditor, settleDurationValue])

  const openDurationEditor = useCallback(() => {
    clearDurationNoticeTimeout()
    setDurationNotice(null)
    setDurationEditor(duration.toFixed(1))
  }, [clearDurationNoticeTimeout, duration])

  const applyDuration = useCallback(
    (value: number) => settleDurationValue(value),
    [settleDurationValue]
  )

  const adjustTimelineZoom = useCallback((delta: number) => {
    setTimelineZoom((zoom) => clampTimelineZoom(zoom + delta))
  }, [])

  useEffect(
    () => () => {
      if (durationNoticeTimeoutRef.current !== null) {
        window.clearTimeout(durationNoticeTimeoutRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const handleTimelineZoomShortcut = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        adjustTimelineZoom(TIMELINE_ZOOM_STEP)
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault()
        adjustTimelineZoom(-TIMELINE_ZOOM_STEP)
      }
      if (event.key === "0") {
        event.preventDefault()
        fitTimeline()
      }
    }

    window.addEventListener("keydown", handleTimelineZoomShortcut)
    return () =>
      window.removeEventListener("keydown", handleTimelineZoomShortcut)
  }, [adjustTimelineZoom, fitTimeline])

  return {
    timelineZoom,
    durationEditor,
    setDurationEditor,
    fitTimeline,
    commitDurationEditor,
    openDurationEditor,
    applyDuration,
    adjustTimelineZoom,
    durationInvalid:
      durationEditor !== null &&
      !Number.isFinite(Number.parseFloat(durationEditor)),
    durationNotice,
  }
}
