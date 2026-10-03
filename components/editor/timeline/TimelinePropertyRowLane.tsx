"use client"

import React from "react"
import {
  bindWindowPointerDrag,
  safelyReleasePointerCapture,
  safelySetPointerCapture,
} from "@/lib/drag-events"
import type { EasingType, TimelinePropertyRow } from "../TimelineModel"
import { easingMenuItems } from "./TimelineEasingControls"
import { widthForSpan, xForFrac } from "./TimelineGeometry"
import { TIMELINE_LAYER } from "./TimelineLayering"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import {
  TimelineDiamond,
  TimelineLaneGhost,
  TimelineMotionSegments,
  useLaneGhost,
} from "./TimelinePrimitives"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"

export type TimelinePropertyRowLaneProps = {
  duration: number
  row: TimelinePropertyRow
  isRevealed: boolean
  selectedKeyframe: SelectedTimelineKeyframe
  onSelectKeyframe: (keyframe: SelectedTimelineKeyframe) => void
  onOpenKeyframeEditor: (keyframe: SelectedTimelineKeyframe) => void
  onActivePropertyRowChange?: (rowId: string) => void
  onRemovePropertyKeyframe?: (rowId: string, keyframeId: string) => void
  onAddPropertyKeyframeAtTime?: (rowId: string, time: number) => void
  onMovePropertyKeyframe?: (
    rowId: string,
    keyframeId: string,
    time: number
  ) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
  onScrubStart?: () => void
  onTimeChange: (time: number) => void
  timeFromClientX: (
    clientX: number,
    options?: { bypass?: boolean; clampToViewport?: boolean }
  ) => number
  onOpenContextMenu: (
    event: React.MouseEvent,
    title: string,
    items: TimelineMenuItem[]
  ) => void
  createGoToMenuItem: (
    event: React.MouseEvent,
    time: number,
    onBeforeOpen?: () => void
  ) => TimelineMenuItem
}

export function TimelinePropertyRowLane({
  duration,
  row,
  isRevealed,
  selectedKeyframe,
  onSelectKeyframe,
  onOpenKeyframeEditor,
  onActivePropertyRowChange,
  onRemovePropertyKeyframe,
  onMovePropertyKeyframe,
  onAddPropertyKeyframeAtTime,
  onSetPropertyEasing,
  onScrubStart,
  onTimeChange,
  timeFromClientX,
  onOpenContextMenu,
  createGoToMenuItem,
}: TimelinePropertyRowLaneProps) {
  const keyframeDraggedRef = React.useRef(false)
  const wasSelectedOnPressRef = React.useRef(false)
  const { ghostX, laneHandlers } = useLaneGhost()
  const rowSelected =
    selectedKeyframe?.type === "property" && selectedKeyframe.rowId === row.id

  return (
    <div
      className={`relative h-[var(--timeline-property-height)] border-b border-border/50 transition-colors ${
        isRevealed
          ? "bg-primary/10 ring-1 ring-primary/20 ring-inset"
          : rowSelected
            ? "bg-foreground/[0.035]"
            : "hover:bg-foreground/[0.025]"
      }`}
      {...(onAddPropertyKeyframeAtTime ? laneHandlers : {})}
      title={
        onAddPropertyKeyframeAtTime
          ? "Double-click to add a keyframe"
          : undefined
      }
      onDoubleClick={(event) => {
        if (!onAddPropertyKeyframeAtTime) return
        event.preventDefault()
        onAddPropertyKeyframeAtTime(row.id, timeFromClientX(event.clientX))
      }}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        onSelectKeyframe(null)
        onScrubStart?.()
        onTimeChange(timeFromClientX(event.clientX))
      }}
      onContextMenu={(event) => {
        const time = timeFromClientX(event.clientX, {
          bypass: event.altKey,
        })
        onOpenContextMenu(event, row.name, [
          ...(onAddPropertyKeyframeAtTime
            ? [
                {
                  label: "Add keyframe",
                  shortcut: `${time.toFixed(2)}s`,
                  onSelect: () => onAddPropertyKeyframeAtTime(row.id, time),
                },
              ]
            : []),
          {
            label: "Select property",
            onSelect: () => onActivePropertyRowChange?.(row.id),
          },
          ...(row.keyframes.length && onSetPropertyEasing
            ? easingMenuItems(
                row.keyframes[0]?.easing ?? "ease-in-out",
                (easing) => onSetPropertyEasing(row.id, null, easing)
              )
            : []),
        ])
      }}
    >
      <TimelineMotionSegments
        name={row.name}
        keyframes={row.keyframes}
        duration={duration}
        xForTime={xForFrac}
        widthForTime={widthForSpan}
        onEasingChange={
          onSetPropertyEasing
            ? (keyframeId, easing) =>
                onSetPropertyEasing(row.id, keyframeId, easing)
            : undefined
        }
      />
      {onAddPropertyKeyframeAtTime && (
        <TimelineLaneGhost x={ghostX} color={row.color} />
      )}

      {row.keyframes.map((keyframe) => {
        const selected =
          selectedKeyframe?.type === "property" &&
          selectedKeyframe.rowId === row.id &&
          selectedKeyframe.kfId === keyframe.id
        const nextSelection: SelectedTimelineKeyframe = {
          type: "property",
          rowId: row.id,
          kfId: keyframe.id,
        }

        return (
          <button
            type="button"
            key={keyframe.id}
            aria-label={`Select ${row.name} keyframe${keyframe.label ? `, ${keyframe.label}` : ""} at ${keyframe.time.toFixed(2)} seconds`}
            aria-pressed={selected}
            data-keyframe-row={row.id}
            title={`${row.name}${keyframe.label ? ` - ${keyframe.label}` : ""} @ ${keyframe.time.toFixed(2)}s`}
            className={`timeline-keyframe absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-sm transition-transform duration-100 select-none hover:scale-125 focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing ${selected ? "scale-125" : ""}`}
            style={{
              left: xForFrac(keyframe.time / duration),
              zIndex: selected
                ? TIMELINE_LAYER.selectedKeyframe
                : TIMELINE_LAYER.propertyKeyframe,
            }}
            onPointerDown={(event) => {
              if (!event.isPrimary) return
              event.stopPropagation()
              wasSelectedOnPressRef.current =
                selected && event.pointerType === "touch"
              onSelectKeyframe(nextSelection)
              onActivePropertyRowChange?.(row.id)
              onTimeChange(keyframe.time)
              if (event.button !== 0 || !onMovePropertyKeyframe) return
              const pointerTarget = event.currentTarget
              const pointerId = event.pointerId
              safelySetPointerCapture(pointerTarget, pointerId)
              const startX = event.clientX
              const startY = event.clientY
              let activeKeyframeId = keyframe.id
              keyframeDraggedRef.current = false
              bindWindowPointerDrag({
                pointerId,
                onMove: (moveEvent) => {
                  const time = timeFromClientX(moveEvent.clientX, {
                    bypass: moveEvent.altKey,
                  })
                  if (
                    Math.hypot(
                      moveEvent.clientX - startX,
                      moveEvent.clientY - startY
                    ) > 3
                  ) {
                    keyframeDraggedRef.current = true
                    onScrubStart?.()
                  }
                  onTimeChange(time)
                  onMovePropertyKeyframe(row.id, activeKeyframeId, time)
                  if (row.id === "style") {
                    activeKeyframeId = `style-${time.toFixed(3)}`
                  }
                },
                onEnd: (endEvent) => {
                  safelyReleasePointerCapture(pointerTarget, pointerId)
                  if (endEvent?.type !== "pointerup") {
                    keyframeDraggedRef.current = false
                  }
                },
              })
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()
              onOpenKeyframeEditor(nextSelection)
            }}
            onClick={(event) => {
              event.stopPropagation()
              if (keyframeDraggedRef.current) {
                keyframeDraggedRef.current = false
                return
              }
              if (wasSelectedOnPressRef.current) {
                wasSelectedOnPressRef.current = false
                onOpenKeyframeEditor(nextSelection)
                return
              }
              onSelectKeyframe(nextSelection)
              onActivePropertyRowChange?.(row.id)
              onTimeChange(keyframe.time)
            }}
            onKeyDown={(event) => {
              if (
                !onMovePropertyKeyframe ||
                (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
              ) {
                return
              }
              event.preventDefault()
              event.stopPropagation()
              const frameStep = (event.shiftKey ? 10 : 1) / 60
              const direction = event.key === "ArrowLeft" ? -1 : 1
              const nextTime = Math.max(
                0,
                Math.min(duration, keyframe.time + direction * frameStep)
              )
              onSelectKeyframe(nextSelection)
              onActivePropertyRowChange?.(row.id)
              onMovePropertyKeyframe(row.id, keyframe.id, nextTime)
              onTimeChange(nextTime)
            }}
            onContextMenu={(event) => {
              event.stopPropagation()
              onOpenContextMenu(event, row.name, [
                {
                  label: "Edit keyframe…",
                  onSelect: () => onOpenKeyframeEditor(nextSelection),
                },
                createGoToMenuItem(event, keyframe.time, () =>
                  onActivePropertyRowChange?.(row.id)
                ),
                {
                  label: "Select property",
                  onSelect: () => onActivePropertyRowChange?.(row.id),
                },
                ...(onSetPropertyEasing
                  ? easingMenuItems(
                      keyframe.easing ?? "ease-in-out",
                      (easing) =>
                        onSetPropertyEasing(row.id, keyframe.id, easing)
                    )
                  : []),
                { type: "separator" },
                {
                  label: "Remove keyframe",
                  danger: true,
                  onSelect: () =>
                    onRemovePropertyKeyframe?.(row.id, keyframe.id),
                },
              ])
            }}
          >
            <TimelineDiamond
              color={row.color}
              selected={selected}
              className="size-4"
            />
          </button>
        )
      })}
    </div>
  )
}
