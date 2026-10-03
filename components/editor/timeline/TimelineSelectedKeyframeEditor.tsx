"use client"

import type { ReactNode } from "react"
import type {
  EasingType,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"
import { quantizeTimeToFrame } from "./TimelineGeometry"
import { TimelineKeyframeEditor, type ListRow } from "./TimelineKeyframeEditor"
import { setTrackKeyframeTime } from "./TimelineKeyframeModel"
import { formatValueLabel } from "./TimelinePrimitives"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"

export type TimelineSelectedKeyframeEditorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedKeyframe: SelectedTimelineKeyframe
  duration: number
  tracks: TimelineTrack[]
  propertyRows: TimelinePropertyRow[]
  onSelectKeyframe: (keyframe: SelectedTimelineKeyframe) => void
  onScrubStart?: () => void
  onTimeChange: (time: number) => void
  onTracksChange: (tracks: TimelineTrack[]) => void
  onRemoveTrackKeyframe: (trackId: string, keyframeId: string) => void
  onSetSingleKeyframeEasing: (
    trackId: string,
    keyframeId: string,
    easing: EasingType
  ) => void
  onMovePropertyKeyframe?: (
    rowId: string,
    keyframeId: string,
    time: number
  ) => void
  onRemovePropertyKeyframe?: (rowId: string, keyframeId: string) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
}

/**
 * Detail editor for the selected keyframe — time, easing, and value — opened
 * by double-clicking a keyframe (or tapping a selected one on touch).
 */
export function TimelineSelectedKeyframeEditor({
  open,
  onOpenChange,
  selectedKeyframe,
  duration,
  tracks,
  propertyRows,
  onSelectKeyframe,
  onScrubStart,
  onTimeChange,
  onTracksChange,
  onRemoveTrackKeyframe,
  onSetSingleKeyframeEasing,
  onMovePropertyKeyframe,
  onRemovePropertyKeyframe,
  onSetPropertyEasing,
  renderPropertyValueEditor,
  onEditValue,
}: TimelineSelectedKeyframeEditorProps & {
  renderPropertyValueEditor?: (rowId: string) => ReactNode
  onEditValue?: (selection: NonNullable<SelectedTimelineKeyframe>) => void
}) {
  const seek = (time: number) => {
    onScrubStart?.()
    onTimeChange(time)
  }

  let row: ListRow | undefined
  let frameId: string | undefined

  if (selectedKeyframe?.type === "property") {
    const property = propertyRows.find(
      (candidate) => candidate.id === selectedKeyframe.rowId
    )
    if (property) {
      frameId = selectedKeyframe.kfId
      row = {
        ...property,
        onMove: (frame, time) => {
          const nextTime = quantizeTimeToFrame(time)
          onMovePropertyKeyframe?.(property.id, frame.id, nextTime)
          seek(nextTime)
          if (property.id === "style")
            onSelectKeyframe({
              type: "property",
              rowId: property.id,
              kfId: `style-${nextTime.toFixed(3)}`,
            })
        },
        onRemove: onRemovePropertyKeyframe
          ? (frame) => onRemovePropertyKeyframe(property.id, frame.id)
          : undefined,
        onEasing: onSetPropertyEasing
          ? (frame, easing) =>
              onSetPropertyEasing(property.id, frame.id, easing)
          : undefined,
        onEditValue: onEditValue
          ? (frame) => {
              seek(frame.time)
              onEditValue({
                type: "property",
                rowId: property.id,
                kfId: frame.id,
              })
            }
          : undefined,
      }
    }
  } else if (selectedKeyframe?.type === "track") {
    const track = tracks.find(
      (candidate) => candidate.id === selectedKeyframe.trackId
    )
    if (track) {
      frameId = selectedKeyframe.kfId
      row = {
        id: track.id,
        name: track.name,
        color: track.color,
        keyframes: [...track.keyframes]
          .sort((a, b) => a.time - b.time)
          .map((frame) => ({
            ...frame,
            label: formatValueLabel(track, frame.value),
          })),
        onMove: (frame, time) => {
          onTracksChange(
            setTrackKeyframeTime({
              tracks,
              trackId: track.id,
              keyframeId: frame.id,
              time,
              duration,
              frameSnapActive: false,
            })
          )
          seek(time)
        },
        onRemove: (frame) => onRemoveTrackKeyframe(track.id, frame.id),
        onEasing: (frame, easing) =>
          onSetSingleKeyframeEasing(track.id, frame.id, easing),
        valueRange: {
          min: track.min,
          max: track.max,
          onChange: (frame, value) => {
            seek(frame.time)
            onTracksChange(
              tracks.map((candidate) =>
                candidate.id === track.id
                  ? {
                      ...candidate,
                      keyframes: candidate.keyframes.map((keyframe) =>
                        keyframe.id === frame.id
                          ? { ...keyframe, value }
                          : keyframe
                      ),
                    }
                  : candidate
              )
            )
          },
        },
      }
    }
  }

  const frame = row?.keyframes.find((candidate) => candidate.id === frameId)
  const rowType = selectedKeyframe?.type

  return (
    <TimelineKeyframeEditor
      row={row}
      frame={frame}
      duration={duration}
      open={open && !!frame}
      anchor={() =>
        row
          ? document.querySelector(
              `[data-keyframe-row="${row.id}"][aria-pressed="true"]`
            )
          : null
      }
      onClose={() => onOpenChange(false)}
      valueEditor={
        row && !row.valueRange ? renderPropertyValueEditor?.(row.id) : undefined
      }
      onNavigate={(target) => {
        if (!row || !rowType) return
        seek(target.time)
        onSelectKeyframe(
          rowType === "track"
            ? { type: "track", trackId: row.id, kfId: target.id }
            : { type: "property", rowId: row.id, kfId: target.id }
        )
      }}
      onEditValue={() => {
        if (!row || !frame) return
        onOpenChange(false)
        row.onEditValue?.(frame)
      }}
      onDelete={() => {
        if (!row || !frame) return
        const rowId = row.id
        row.onRemove?.(frame)
        onSelectKeyframe(null)
        // The removed diamond takes focus with it; land on the row's toggle.
        requestAnimationFrame(() =>
          (
            document.querySelector<HTMLElement>(
              `[data-rail-keyframe="${rowId}"]`
            ) ?? document.getElementById("timeline-add-property")
          )?.focus()
        )
      }}
    />
  )
}
