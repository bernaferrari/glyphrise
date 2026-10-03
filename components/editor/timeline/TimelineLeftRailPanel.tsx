"use client"

import React from "react"
import { TimelineLeftRail } from "./TimelineLeftRail"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import type {
  EasingType,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"

type TimelineLeftRailPanelProps = {
  selectedRow: string | null
  onSelectRow: (row: string | null) => void
  onOpenMotionPresets?: () => void
  header?: React.ReactNode
  shapeCount: number
  onSeek: (time: number) => void
  activeTrackId?: string | null
  currentTime: number
  duration: number
  durationEditor: string | null
  durationInvalid: boolean
  durationNotice: string | null
  isPreviewLoading: boolean
  leftRailBodyRef: React.RefObject<HTMLDivElement | null>
  loop: boolean
  selectedShapeId: string | null
  snapEnabled: boolean
  tracks: TimelineTrack[]
  hiddenTracks: TimelineTrack[]
  revealedRowId: string | null
  visiblePropertyRows: TimelinePropertyRow[]
  onActivePropertyRowChange?: (rowId: string) => void
  onAddShape: () => void
  onApplyDuration: (value: number) => void
  onClearPropertyRow?: (rowId: string) => void
  onTogglePropertyKeyframe?: (rowId: string, keyframeId?: string | null) => void
  onClearSelection: () => void
  onClearTrackKeyframes?: (trackId: string) => void
  onCommitDurationEditor: () => void
  onDurationEditorChange: (value: string | null) => void
  onLeftRailScroll: (event: React.UIEvent<HTMLDivElement>) => void
  onLoopChange: (enabled: boolean) => void
  onOpenContextMenu: (
    event: React.MouseEvent,
    title: string,
    items: TimelineMenuItem[]
  ) => void
  onOpenDurationEditor: () => void
  onAddProperty: (trackId: string) => void
  onSelectTrack: (trackId: string) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
  onSetTrackEasing: (trackId: string, easing: EasingType) => void
  onSnapEnabledChange: (enabled: boolean) => void
  onToggleTrackKeyframe: (trackId: string) => void
  createGoToMenuItem: (
    event: React.MouseEvent,
    time: number,
    onBeforeOpen?: () => void
  ) => TimelineMenuItem
}

export function TimelineLeftRailPanel({
  selectedRow,
  onSelectRow,
  onOpenMotionPresets,
  header,
  shapeCount,
  onSeek,
  activeTrackId,
  currentTime,
  isPreviewLoading,
  leftRailBodyRef,
  selectedShapeId,
  tracks,
  hiddenTracks,
  revealedRowId,
  visiblePropertyRows,
  onActivePropertyRowChange,
  onAddShape,
  onClearPropertyRow,
  onTogglePropertyKeyframe,
  onClearSelection,
  onClearTrackKeyframes,
  onLeftRailScroll,
  onOpenContextMenu,
  onAddProperty,
  onSelectTrack,
  onSetPropertyEasing,
  onSetTrackEasing,
  onToggleTrackKeyframe,
  createGoToMenuItem,
}: TimelineLeftRailPanelProps) {
  return (
    <div className="flex w-[var(--timeline-rail-width)] shrink-0 flex-col overflow-visible border-r border-border bg-(--timeline-surface)">
      <div className="relative z-10 h-[var(--timeline-ruler-height)] shrink-0 border-b border-border">
        {header}
      </div>
      <div
        className="relative min-h-0 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain"
        onScroll={onLeftRailScroll}
      >
        <TimelineLeftRail
          ref={leftRailBodyRef}
          shapeCount={shapeCount}
          selectedRow={selectedRow}
          onSelectRow={onSelectRow}
          onOpenMotionPresets={onOpenMotionPresets}
          onSeek={onSeek}
          selectedShapeId={selectedShapeId}
          isPreviewLoading={isPreviewLoading}
          visiblePropertyRows={visiblePropertyRows}
          tracks={tracks}
          hiddenTracks={hiddenTracks}
          revealedRowId={revealedRowId}
          activeTrackId={activeTrackId}
          currentTime={currentTime}
          onAddShape={onAddShape}
          onClearSelection={onClearSelection}
          onAddProperty={onAddProperty}
          onSelectTrack={onSelectTrack}
          onActivePropertyRowChange={onActivePropertyRowChange}
          onClearPropertyRow={onClearPropertyRow}
          onTogglePropertyKeyframe={onTogglePropertyKeyframe}
          onClearTrackKeyframes={onClearTrackKeyframes}
          onSetPropertyEasing={onSetPropertyEasing}
          onToggleTrackKeyframe={onToggleTrackKeyframe}
          onSetTrackEasing={onSetTrackEasing}
          onOpenContextMenu={onOpenContextMenu}
          createGoToMenuItem={createGoToMenuItem}
        />
      </div>
    </div>
  )
}
