"use client"

import React from "react"
import type { TimelinePropertyRow, TimelineTrack } from "../TimelineModel"
import type { EasingType } from "../TimelineModel"
import {
  TimelinePropertyRailRow,
  TimelineTrackRailRow,
} from "./TimelineLeftRailRows"
import { TimelineShapeHeaderRow } from "./TimelineShapeHeaderRow"
import { TimelineAddAnimationMenu } from "./TimelineAddAnimationMenu"
import type { AnimationPresetId } from "../AnimationPresetModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

type TimelineLeftRailProps = {
  selectedRow: string | null
  onSelectRow: (row: string | null) => void
  duration: number
  presetArtwork?: string
  onApplyMotionPreset?: (id: AnimationPresetId) => void
  shapeCount: number
  onSeek: (time: number) => void
  selectedShapeId: string | null
  isPreviewLoading: boolean
  visiblePropertyRows: TimelinePropertyRow[]
  tracks: TimelineTrack[]
  hiddenTracks: TimelineTrack[]
  revealedRowId: string | null
  activeTrackId?: string | null
  currentTime: number
  onAddShape: () => void
  onClearSelection: () => void
  onAddProperty: (trackId: string) => void
  onSelectTrack: (trackId: string) => void
  onActivePropertyRowChange?: (rowId: string) => void
  onClearPropertyRow?: (rowId: string) => void
  onTogglePropertyKeyframe?: (rowId: string, keyframeId?: string | null) => void
  onClearTrackKeyframes?: (trackId: string) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
  onToggleTrackKeyframe: (trackId: string) => void
  onSetTrackEasing: (
    trackId: string,
    easing: TimelineTrack["keyframes"][number]["easing"]
  ) => void
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

export const TimelineLeftRail = React.forwardRef<
  HTMLDivElement,
  TimelineLeftRailProps
>(
  (
    {
      selectedRow,
      onSelectRow,
      duration,
      presetArtwork,
      onApplyMotionPreset,
      shapeCount,
      onSeek,
      selectedShapeId,
      isPreviewLoading,
      visiblePropertyRows,
      tracks,
      hiddenTracks,
      revealedRowId,
      activeTrackId,
      currentTime,
      onAddShape,
      onClearSelection,
      onAddProperty,
      onSelectTrack,
      onActivePropertyRowChange,
      onClearPropertyRow,
      onTogglePropertyKeyframe,
      onClearTrackKeyframes,
      onSetPropertyEasing,
      onToggleTrackKeyframe,
      onSetTrackEasing,
      onOpenContextMenu,
      createGoToMenuItem,
    },
    ref
  ) => {
    const menu = {
      currentTime,
      onOpenContextMenu,
      createGoToMenuItem,
    }

    return (
      <div ref={ref}>
        <TimelineShapeHeaderRow
          shapeCount={shapeCount}
          selectedShapeId={selectedShapeId}
          isPreviewLoading={isPreviewLoading}
          onAddShape={onAddShape}
        />

        {visiblePropertyRows.map((row) => (
          <TimelinePropertyRailRow
            key={row.id}
            row={row}
            isRevealed={revealedRowId === `property:${row.id}`}
            selected={selectedRow === `property:${row.id}`}
            onSelectRow={() => onSelectRow(`property:${row.id}`)}
            menu={menu}
            onSeek={onSeek}
            onClearSelection={onClearSelection}
            onActivePropertyRowChange={onActivePropertyRowChange}
            onClearPropertyRow={onClearPropertyRow}
            onTogglePropertyKeyframe={onTogglePropertyKeyframe}
            onSetPropertyEasing={onSetPropertyEasing}
          />
        ))}

        {tracks.map((track) => (
          <TimelineTrackRailRow
            key={track.id}
            track={track}
            isRevealed={revealedRowId === `track:${track.id}`}
            selected={selectedRow === `track:${track.id}`}
            onSelectRow={() => onSelectRow(`track:${track.id}`)}
            activeTrackId={activeTrackId}
            menu={menu}
            onSeek={onSeek}
            onClearSelection={onClearSelection}
            onSelectTrack={onSelectTrack}
            onClearTrackKeyframes={onClearTrackKeyframes}
            onToggleTrackKeyframe={onToggleTrackKeyframe}
            onSetTrackEasing={onSetTrackEasing}
          />
        ))}

        {/* Adding motion lives on the timeline: a property, or a preset. */}
        <div className="flex h-(--timeline-property-height) items-center border-b border-border/60 pr-1.5">
          <TimelineAddAnimationMenu
            duration={duration}
            hiddenTracks={hiddenTracks}
            rotationAnimated={visiblePropertyRows.some(
              (row) => row.id === "rotation"
            )}
            scaleAnimated={tracks.some(
              (track) => track.id === "scale" && track.keyframes.length > 0
            )}
            artwork={presetArtwork}
            onAddProperty={onAddProperty}
            onApplyPreset={onApplyMotionPreset}
          />
        </div>
      </div>
    )
  }
)

TimelineLeftRail.displayName = "TimelineLeftRail"
