"use client"

import React from "react"
import { Plus, Sparkles } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { TimelinePropertyRow, TimelineTrack } from "../TimelineModel"
import type { EasingType } from "../TimelineModel"
import {
  TimelinePropertyRailRow,
  TimelineTrackRailRow,
} from "./TimelineLeftRailRows"
import { TimelineShapeHeaderRow } from "./TimelineShapeHeaderRow"
import { TimelineRowIcon } from "./TimelineRowIcon"
import { describeStarterMotion } from "./TimelinePrimitives"
import { starterPeak } from "./StarterTrackModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

type TimelineLeftRailProps = {
  selectedRow: string | null
  onSelectRow: (row: string | null) => void
  onOpenMotionPresets?: () => void
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
      onOpenMotionPresets,
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
    const [addPropertyOpen, setAddPropertyOpen] = React.useState(false)
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

        {(hiddenTracks.length > 0 || onOpenMotionPresets) && (
          <Popover open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
            <PopoverTrigger
              render={
                <button
                  id="timeline-add-property"
                  type="button"
                  className="flex h-[var(--timeline-property-height)] w-full items-center gap-2 border-b border-border/60 pl-3.5 text-left text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset"
                />
              }
            >
              <Plus className="size-3.5" />
              <span className="sr-only">Add property</span>
              <span aria-hidden="true">Add animation</span>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="right"
              sideOffset={8}
              className="w-60 gap-0.5 p-1.5"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {onOpenMotionPresets && (
                <button
                  type="button"
                  onClick={() => {
                    setAddPropertyOpen(false)
                    onOpenMotionPresets()
                  }}
                  className="mb-1 flex min-h-11 w-full items-center gap-2.5 rounded-md border-b border-border px-2 pb-1 text-left text-[13px] text-foreground transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">Motion preset</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Spin, tilt, or pulse in one step
                    </span>
                  </span>
                </button>
              )}
              {hiddenTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  aria-label={track.name}
                  onClick={() => {
                    onAddProperty(track.id)
                    setAddPropertyOpen(false)
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <TimelineRowIcon
                    id={track.id}
                    className="size-4 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{track.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground tabular-nums">
                      {describeStarterMotion(track, starterPeak(track))}
                    </span>
                  </span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
    )
  }
)

TimelineLeftRail.displayName = "TimelineLeftRail"
