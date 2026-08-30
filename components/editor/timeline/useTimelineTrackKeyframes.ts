"use client"

import {
  MutableRefObject,
  type PointerEvent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  bindWindowPointerDrag,
  safelyReleasePointerCapture,
  safelySetPointerCapture,
} from "@/lib/drag-events"
import type { EasingType, TimelineTrack } from "../TimelineModel"
import { EDGE_INSET, quantizeTimeToFrame } from "./TimelineGeometry"
import {
  PLAYHEAD_SNAP_THRESHOLD_SECONDS,
  SNAP_THRESHOLD_SECONDS,
  type SnapTimeOptions,
} from "./TimelineSnapping"
import {
  addTrackKeyframeAtTime,
  clampTrackKeyframeBlockDelta,
  createTrackKeyframeBlockSnapTargets,
  moveTrackKeyframe,
  offsetTrackKeyframeBlock,
  removeTrackKeyframeById,
  setSingleKeyframeEasing as applySingleKeyframeEasing,
  setTrackEasing as applyTrackEasing,
  setTrackKeyframeTime as applyTrackKeyframeTime,
  snapTrackKeyframeBlockDelta,
  toggleTrackKeyframeAtTime,
} from "./TimelineKeyframeModel"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"
import type { TrackTimeEditor } from "./TimelineTypes"

const KEYFRAME_TIME_CLAMP_NOTICE_MS = 1800

interface TimelineTrackKeyframesOptions {
  duration: number
  currentTime: number
  tracks: TimelineTrack[]
  snapEnabled: boolean
  frameSnapActive: boolean
  laneRef: RefObject<HTMLDivElement | null>
  setSelectedKeyframe: (keyframe: SelectedTimelineKeyframe) => void
  keyMomentTimes: (options: SnapTimeOptions) => number[]
  snapTime: (rawTime: number, options?: SnapTimeOptions) => number
  onTracksChange: (tracks: TimelineTrack[]) => void
  onTimeChange: (time: number) => void
  onScrubStart?: () => void
  onActiveTrackChange?: (trackId: string) => void
}

export function useTimelineTrackKeyframes({
  duration,
  currentTime,
  tracks,
  snapEnabled,
  frameSnapActive,
  laneRef,
  setSelectedKeyframe,
  keyMomentTimes,
  snapTime,
  onTracksChange,
  onTimeChange,
  onScrubStart,
  onActiveTrackChange,
}: TimelineTrackKeyframesOptions) {
  const [timeEditor, setTimeEditor] = useState<TrackTimeEditor | null>(null)
  const [timeClampNotice, setTimeClampNotice] = useState<string | null>(null)
  const timeClampNoticeTimeoutRef = useRef<number | null>(null)
  const timeEditorClampCloseTimeoutRef = useRef<number | null>(null)
  const keyframeDraggedRef = useRef(false)
  useEffect(
    () => () => {
      if (timeClampNoticeTimeoutRef.current !== null) {
        window.clearTimeout(timeClampNoticeTimeoutRef.current)
      }
      if (timeEditorClampCloseTimeoutRef.current !== null) {
        window.clearTimeout(timeEditorClampCloseTimeoutRef.current)
      }
    },
    []
  )

  const selectTrack = (trackId: string) => {
    onActiveTrackChange?.(trackId)
  }

  const toggleKeyframeAtPlayhead = (trackId: string) => {
    const t = quantizeTimeToFrame(currentTime)
    const { tracks: updated, selected } = toggleTrackKeyframeAtTime({
      tracks,
      trackId,
      time: t,
    })
    selectTrack(trackId)
    setSelectedKeyframe(selected)
    onTracksChange(updated)
  }

  const addTrackKeyframe = (trackId: string, time: number) => {
    const result = addTrackKeyframeAtTime({
      tracks,
      trackId,
      time,
      duration,
      frameSnapActive,
    })
    selectTrack(trackId)
    setSelectedKeyframe(result.selected)
    onTimeChange(result.time)
    onTracksChange(result.tracks)
  }

  const removeTrackKeyframe = (trackId: string, kfId: string) => {
    setSelectedKeyframe(null)
    onTracksChange(removeTrackKeyframeById(tracks, trackId, kfId))
  }

  const handleKeyframeDrag = (
    e: PointerEvent<HTMLElement>,
    trackId: string,
    kfId: string
  ) => {
    e.stopPropagation()
    if (!laneRef.current) return
    const pointerTarget = e.currentTarget
    const pointerId = e.pointerId
    safelySetPointerCapture(pointerTarget, pointerId)
    onScrubStart?.()
    keyframeDraggedRef.current = false
    const rect = laneRef.current.getBoundingClientRect()
    const usable = Math.max(1, rect.width - EDGE_INSET * 2)
    const startX = e.clientX
    const startY = e.clientY
    bindWindowPointerDrag({
      pointerId,
      onMove: (ev) => {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 3) {
          keyframeDraggedRef.current = true
        }
        const x = Math.max(
          0,
          Math.min(ev.clientX - rect.left - EDGE_INSET, usable)
        )
        const rawTime = (x / usable) * duration
        const newTime = Number(
          snapTime(rawTime, {
            bypass: ev.altKey,
            excludeKeyframe: { trackId, kfId },
            snapToPlayhead: true,
          }).toFixed(3)
        )
        onTimeChange(newTime)
        onTracksChange(
          moveTrackKeyframe({
            tracks,
            trackId,
            keyframeId: kfId,
            time: newTime,
          })
        )
      },
      onEnd: (endEvent) => {
        safelyReleasePointerCapture(pointerTarget, pointerId)
        if (endEvent?.type !== "pointerup") {
          keyframeDraggedRef.current = false
        }
      },
    })
  }

  const setTrackKeyframeTime = (
    trackId: string,
    kfId: string,
    time: number
  ) => {
    const keyframe = tracks
      .find((track) => track.id === trackId)
      ?.keyframes.find((keyframe) => keyframe.id === kfId)
    selectTrack(trackId)
    onTracksChange(
      applyTrackKeyframeTime({
        tracks,
        trackId,
        keyframeId: kfId,
        time,
        duration,
        frameSnapActive,
      })
    )
    // Surface a transient notice when the requested time fell outside
    // 0-<duration>s and was clamped, instead of silently moving the diamond.
    if (keyframe && (time < 0 || time > duration)) {
      if (timeClampNoticeTimeoutRef.current !== null) {
        window.clearTimeout(timeClampNoticeTimeoutRef.current)
      }
      setTimeClampNotice(`Clamped to 0-${duration.toFixed(1)}s`)
      timeClampNoticeTimeoutRef.current = window.setTimeout(() => {
        timeClampNoticeTimeoutRef.current = null
        setTimeClampNotice(null)
      }, KEYFRAME_TIME_CLAMP_NOTICE_MS)
    }
  }

  const commitTimeEditor = () => {
    if (!timeEditor) return
    const parsed = Number.parseFloat(timeEditor.draft)
    if (!Number.isFinite(parsed)) return
    const wasClamped = parsed < 0 || parsed > duration
    setTrackKeyframeTime(timeEditor.trackId, timeEditor.kfId, parsed)
    if (wasClamped) {
      // Keep the editor open for the notice window so the amber clamp
      // message is actually seen before the popover dismisses itself.
      if (timeEditorClampCloseTimeoutRef.current !== null) {
        window.clearTimeout(timeEditorClampCloseTimeoutRef.current)
      }
      timeEditorClampCloseTimeoutRef.current = window.setTimeout(() => {
        timeEditorClampCloseTimeoutRef.current = null
        setTimeEditor(null)
      }, KEYFRAME_TIME_CLAMP_NOTICE_MS)
      return
    }
    setTimeEditor(null)
  }

  const handleBlockDrag = (e: PointerEvent<HTMLElement>, trackId: string) => {
    e.stopPropagation()
    if (!laneRef.current) return
    const pointerTarget = e.currentTarget
    const pointerId = e.pointerId
    safelySetPointerCapture(pointerTarget, pointerId)
    onScrubStart?.()
    selectTrack(trackId)
    const rect = laneRef.current.getBoundingClientRect()
    const usable = Math.max(1, rect.width - EDGE_INSET * 2)
    const startX = e.clientX
    const track = tracks.find((t) => t.id === trackId)
    if (!track || track.keyframes.length === 0) return
    const initial = track.keyframes.map((k) => ({ id: k.id, time: k.time }))

    bindWindowPointerDrag({
      pointerId,
      onMove: (ev) => {
        let delta = clampTrackKeyframeBlockDelta({
          initial,
          delta: ((ev.clientX - startX) / usable) * duration,
          duration,
        })
        if (snapEnabled && !ev.altKey) {
          const playheadTime = frameSnapActive
            ? quantizeTimeToFrame(currentTime)
            : currentTime
          const targets = createTrackKeyframeBlockSnapTargets({
            keyMomentTimes: keyMomentTimes({ excludeTrackId: trackId }),
            playheadTime,
            duration,
            snapThreshold: SNAP_THRESHOLD_SECONDS,
            playheadSnapThreshold: PLAYHEAD_SNAP_THRESHOLD_SECONDS,
          })
          delta = snapTrackKeyframeBlockDelta({
            initial,
            delta,
            targets,
            duration,
          })
        }
        onTracksChange(
          offsetTrackKeyframeBlock({
            tracks,
            trackId,
            initial,
            delta,
            duration,
            frameSnapActive,
          })
        )
      },
      onEnd: () => {
        safelyReleasePointerCapture(pointerTarget, pointerId)
      },
    })
  }

  const setTrackEasing = (trackId: string, easing: EasingType) => {
    onTracksChange(applyTrackEasing(tracks, trackId, easing))
  }

  const setSingleKeyframeEasing = (
    trackId: string,
    kfId: string,
    easing: EasingType
  ) => {
    onTracksChange(applySingleKeyframeEasing(tracks, trackId, kfId, easing))
  }

  return {
    timeEditor,
    setTimeEditor,
    timeClampNotice,
    keyframeDraggedRef: keyframeDraggedRef as MutableRefObject<boolean>,
    selectTrack,
    toggleKeyframeAtPlayhead,
    addTrackKeyframe,
    removeTrackKeyframe,
    handleKeyframeDrag,
    handleBlockDrag,
    commitTimeEditor,
    setTrackEasing,
    setSingleKeyframeEasing,
  }
}
