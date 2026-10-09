import { useEffect, useRef } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import { createEditorId, quantizeTimeToFrame } from "../EditorModel"
import { keyframeTimeMatches } from "../EditorKeyframeModel"
import type {
  EasingType,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"
import { isEditableTarget } from "./TimelineGeometry"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"

type Options = {
  selectedKeyframe: SelectedTimelineKeyframe
  currentTime: number
  duration: number
  tracks: TimelineTrack[]
  propertyRows: TimelinePropertyRow[]
  onTracksChange: (tracks: TimelineTrack[]) => void
  onSetSingleKeyframeEasing: (
    trackId: string,
    keyframeId: string,
    easing: EasingType
  ) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
  onDuplicatePropertyKeyframe?: (
    rowId: string,
    keyframeId: string,
    time: number
  ) => void
}

const previousKeyframeId = (
  keyframes: ReadonlyArray<{ id: string; time: number }>,
  id: string
) => {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const index = sorted.findIndex((keyframe) => keyframe.id === id)
  return index > 0 ? sorted[index - 1].id : null
}

/**
 * After Effects keys for the selected keyframe: F9 applies Easy Ease to the
 * motion arriving at and leaving it; Cmd/Ctrl+C copies it and Cmd/Ctrl+V
 * pastes a copy on the same property at the playhead.
 */
export function useTimelineKeyframeShortcuts(options: Options) {
  const optionsRef = useLatestRef(options)
  const clipboardRef = useRef<NonNullable<SelectedTimelineKeyframe> | null>(
    null
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      // Modal dialogs own the keyboard; a selected keyframe's own editor
      // popover (also a dialog) must not block these keys.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const {
        selectedKeyframe,
        currentTime,
        duration,
        tracks,
        propertyRows,
        onTracksChange,
        onSetSingleKeyframeEasing,
        onSetPropertyEasing,
        onDuplicatePropertyKeyframe,
      } = optionsRef.current
      const command = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (event.key === "F9" && selectedKeyframe) {
        event.preventDefault()
        if (selectedKeyframe.type === "track") {
          const track = tracks.find(
            (item) => item.id === selectedKeyframe.trackId
          )
          if (!track) return
          const previous = previousKeyframeId(
            track.keyframes,
            selectedKeyframe.kfId
          )
          for (const id of [previous, selectedKeyframe.kfId])
            if (id) onSetSingleKeyframeEasing(track.id, id, "ease-in-out")
          return
        }
        const row = propertyRows.find(
          (item) => item.id === selectedKeyframe.rowId
        )
        if (!row) return
        const previous = previousKeyframeId(
          row.keyframes,
          selectedKeyframe.kfId
        )
        for (const id of [previous, selectedKeyframe.kfId])
          if (id) onSetPropertyEasing?.(row.id, id, "ease-in-out")
        return
      }

      if (command && !event.shiftKey && !event.altKey && key === "c") {
        // Leave text selections to the browser.
        if (!selectedKeyframe || window.getSelection()?.toString()) return
        event.preventDefault()
        clipboardRef.current = selectedKeyframe
        return
      }

      if (command && !event.shiftKey && !event.altKey && key === "v") {
        const copied = clipboardRef.current
        if (!copied) return
        event.preventDefault()
        const time = quantizeTimeToFrame(
          Math.max(0, Math.min(duration, currentTime))
        )
        if (copied.type === "property") {
          onDuplicatePropertyKeyframe?.(copied.rowId, copied.kfId, time)
          return
        }
        const track = tracks.find((item) => item.id === copied.trackId)
        const source = track?.keyframes.find(
          (keyframe) => keyframe.id === copied.kfId
        )
        if (!track || !source) return
        onTracksChange(
          tracks.map((item) =>
            item.id === track.id
              ? {
                  ...item,
                  keyframes: [
                    ...item.keyframes.filter(
                      (keyframe) => !keyframeTimeMatches(keyframe.time, time)
                    ),
                    { ...source, id: createEditorId(track.id), time },
                  ].sort((a, b) => a.time - b.time),
                }
              : item
          )
        )
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [optionsRef])
}
