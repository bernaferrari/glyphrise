"use client"

import React from "react"
import type { EasingType, TimelinePropertyRow } from "../TimelineModel"
import { TimelinePropertyRowLane } from "./TimelinePropertyRowLane"
import type { SelectedTimelineKeyframe } from "./TimelineTypes"
import type { TimelineMenuItem } from "./TimelineMenuModel"

type TimelinePropertyRowsProps = {
  duration: number
  rows: TimelinePropertyRow[]
  revealedRowId: string | null
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
  /** Row and track ids that don't end where they start (while looping). */
  openLoops?: string[]
  onCloseLoop?: (id: string) => void
}

export function TimelinePropertyRows({
  duration,
  rows,
  revealedRowId,
  selectedKeyframe,
  onSelectKeyframe,
  onOpenKeyframeEditor,
  onActivePropertyRowChange,
  onRemovePropertyKeyframe,
  onAddPropertyKeyframeAtTime,
  onMovePropertyKeyframe,
  onSetPropertyEasing,
  onScrubStart,
  onTimeChange,
  timeFromClientX,
  onOpenContextMenu,
  createGoToMenuItem,
  openLoops,
  onCloseLoop,
}: TimelinePropertyRowsProps) {
  return (
    <>
      {rows.map((row) => (
        <TimelinePropertyRowLane
          key={row.id}
          duration={duration}
          row={row}
          isRevealed={revealedRowId === `property:${row.id}`}
          selectedKeyframe={selectedKeyframe}
          onSelectKeyframe={onSelectKeyframe}
          onOpenKeyframeEditor={onOpenKeyframeEditor}
          onActivePropertyRowChange={onActivePropertyRowChange}
          onRemovePropertyKeyframe={onRemovePropertyKeyframe}
          onAddPropertyKeyframeAtTime={onAddPropertyKeyframeAtTime}
          onMovePropertyKeyframe={onMovePropertyKeyframe}
          onSetPropertyEasing={onSetPropertyEasing}
          onScrubStart={onScrubStart}
          onTimeChange={onTimeChange}
          timeFromClientX={timeFromClientX}
          onOpenContextMenu={onOpenContextMenu}
          createGoToMenuItem={createGoToMenuItem}
          onCloseLoop={
            onCloseLoop && openLoops?.includes(row.id)
              ? () => onCloseLoop(row.id)
              : undefined
          }
        />
      ))}
    </>
  )
}
