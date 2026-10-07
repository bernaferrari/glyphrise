"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { keyframeTimeMatches } from "../EditorKeyframeModel"
import type {
  EasingType,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"
import {
  createPropertyRailMenuItems,
  createTrackRailMenuItems,
  isTrackKeyedAtPlayhead,
  propertyRowKeyframeAtPlayhead,
  type TimelineLeftRailMenuProps,
} from "./TimelineLeftRailMenuModel"
import { TimelineRailKeyframeButton } from "./TimelineRailKeyframeButton"
import { TimelineRowIcon } from "./TimelineRowIcon"

const neighbourTimes = (times: number[], currentTime: number) => {
  const sorted = [...times].sort((a, b) => a - b)
  const previous = [...sorted]
    .reverse()
    .find(
      (time) => time < currentTime && !keyframeTimeMatches(time, currentTime)
    )
  const next = sorted.find(
    (time) => time > currentTime && !keyframeTimeMatches(time, currentTime)
  )
  return { previous, next }
}

const navButton =
  "grid max-md:hidden h-5 w-4 shrink-0 place-items-center rounded text-muted-foreground/70 transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-25"

/** After Effects-style ‹ ◆ › — jump between this row's keys, or key here. */
function KeyframeNavigator({
  name,
  times,
  currentTime,
  onSeek,
  children,
}: {
  name: string
  times: number[]
  currentTime: number
  onSeek: (time: number) => void
  children: React.ReactNode
}) {
  const { previous, next } = neighbourTimes(times, currentTime)
  return (
    <span className="flex items-center">
      <button
        type="button"
        aria-label={`Previous ${name} keyframe`}
        title="Previous keyframe"
        disabled={previous === undefined}
        onClick={(event) => {
          event.stopPropagation()
          if (previous !== undefined) onSeek(previous)
        }}
        className={navButton}
      >
        <ChevronLeft className="size-3" />
      </button>
      {children}
      <button
        type="button"
        aria-label={`Next ${name} keyframe`}
        title="Next keyframe"
        disabled={next === undefined}
        onClick={(event) => {
          event.stopPropagation()
          if (next !== undefined) onSeek(next)
        }}
        className={navButton}
      >
        <ChevronRight className="size-3" />
      </button>
    </span>
  )
}

function RailRowFrame({
  id,
  name,
  active,
  isRevealed,
  ariaLabel,
  ariaPressed,
  onSelect,
  onContextMenu,
  actions,
}: {
  id: string
  name: string
  active: boolean
  isRevealed: boolean
  ariaLabel: string
  ariaPressed?: boolean
  onSelect: () => void
  onContextMenu: (event: React.MouseEvent) => void
  actions: React.ReactNode
}) {
  return (
    <div
      onContextMenu={onContextMenu}
      className={`group relative flex h-(--timeline-property-height) items-center border-b border-border/50 transition-colors ${
        isRevealed
          ? "bg-primary/10"
          : active
            ? "bg-(--timeline-accent)/12"
            : "hover:bg-foreground/[0.03]"
      }`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        onClick={onSelect}
        className="flex h-full min-w-0 flex-1 items-center gap-2 pr-1 pl-3 text-left focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset"
      >
        <TimelineRowIcon
          id={id}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <span
          className={`flex-1 truncate text-xs ${active ? "text-foreground" : "text-foreground/75"}`}
        >
          {name}
        </span>
      </button>
      <span className="flex h-full shrink-0 items-center pr-1.5">
        {actions}
      </span>
    </div>
  )
}

export function TimelinePropertyRailRow({
  row,
  isRevealed,
  selected,
  onSelectRow,
  menu,
  onSeek,
  onClearSelection,
  onActivePropertyRowChange,
  onClearPropertyRow,
  onTogglePropertyKeyframe,
  onSetPropertyEasing,
}: {
  row: TimelinePropertyRow
  isRevealed: boolean
  selected: boolean
  onSelectRow: () => void
  menu: TimelineLeftRailMenuProps
  onSeek: (time: number) => void
  onClearSelection: () => void
  onActivePropertyRowChange?: (rowId: string) => void
  onClearPropertyRow?: (rowId: string) => void
  onTogglePropertyKeyframe?: (rowId: string, keyframeId?: string | null) => void
  onSetPropertyEasing?: (
    rowId: string,
    keyframeId: string | null,
    easing: EasingType
  ) => void
}) {
  const keyframeAtPlayhead = propertyRowKeyframeAtPlayhead(
    row,
    menu.currentTime
  )

  return (
    <RailRowFrame
      id={row.id}
      name={row.name}
      active={selected}
      isRevealed={isRevealed}
      ariaLabel={`Select ${row.name} property`}
      ariaPressed={selected}
      onSelect={() => {
        onClearSelection()
        onSelectRow()
        onActivePropertyRowChange?.(row.id)
      }}
      onContextMenu={(event) =>
        menu.onOpenContextMenu(
          event,
          row.name,
          createPropertyRailMenuItems({
            event,
            row,
            menu,
            onActivePropertyRowChange,
            onClearPropertyRow,
            onSetPropertyEasing,
          })
        )
      }
      actions={
        <>
          {onTogglePropertyKeyframe && (
            <KeyframeNavigator
              name={row.name}
              times={row.keyframes.map((keyframe) => keyframe.time)}
              currentTime={menu.currentTime}
              onSeek={onSeek}
            >
              <TimelineRailKeyframeButton
                rowId={row.id}
                color={row.color}
                isKeyedAtPlayhead={Boolean(keyframeAtPlayhead)}
                hasKeyframes={row.keyframes.length > 0}
                isAnimated={false}
                addLabel={`Add ${row.name} keyframe at ${menu.currentTime.toFixed(2)}s`}
                removeLabel={`Remove ${row.name} keyframe at ${menu.currentTime.toFixed(2)}s`}
                onToggle={() =>
                  onTogglePropertyKeyframe(row.id, keyframeAtPlayhead?.id)
                }
              />
            </KeyframeNavigator>
          )}
        </>
      }
    />
  )
}

export function TimelineTrackRailRow({
  track,
  isRevealed,
  selected,
  onSelectRow,
  activeTrackId,
  menu,
  onSeek,
  onClearSelection,
  onSelectTrack,
  onClearTrackKeyframes,
  onToggleTrackKeyframe,
  onSetTrackEasing,
}: {
  track: TimelineTrack
  isRevealed: boolean
  selected: boolean
  onSelectRow: () => void
  activeTrackId?: string | null
  menu: TimelineLeftRailMenuProps
  onSeek: (time: number) => void
  onClearSelection: () => void
  onSelectTrack: (trackId: string) => void
  onClearTrackKeyframes?: (trackId: string) => void
  onToggleTrackKeyframe: (trackId: string) => void
  onSetTrackEasing: (
    trackId: string,
    easing: TimelineTrack["keyframes"][number]["easing"]
  ) => void
}) {
  const isActive = activeTrackId === track.id
  const animated = track.keyframes.length > 0
  const keyedAtPlayhead = isTrackKeyedAtPlayhead(track, menu.currentTime)

  return (
    <RailRowFrame
      id={track.id}
      name={track.name}
      active={selected || isActive}
      isRevealed={isRevealed}
      ariaLabel={`Select ${track.name} track`}
      ariaPressed={selected || isActive}
      onSelect={() => {
        onClearSelection()
        onSelectRow()
        onSelectTrack(track.id)
      }}
      onContextMenu={(event) =>
        menu.onOpenContextMenu(
          event,
          track.name,
          createTrackRailMenuItems({
            event,
            track,
            menu,
            keyedAtPlayhead,
            onSelectTrack,
            onClearTrackKeyframes,
            onToggleTrackKeyframe,
            onSetTrackEasing,
          })
        )
      }
      actions={
        <>
          <KeyframeNavigator
            name={track.name}
            times={track.keyframes.map((keyframe) => keyframe.time)}
            currentTime={menu.currentTime}
            onSeek={onSeek}
          >
            <TimelineRailKeyframeButton
              rowId={track.id}
              color={track.color}
              isKeyedAtPlayhead={keyedAtPlayhead}
              hasKeyframes={animated}
              isAnimated={animated}
              addLabel={`Add ${track.name} keyframe at ${menu.currentTime.toFixed(2)}s`}
              removeLabel={`Remove ${track.name} keyframe at ${menu.currentTime.toFixed(2)}s`}
              onToggle={() => onToggleTrackKeyframe(track.id)}
            />
          </KeyframeNavigator>
        </>
      }
    />
  )
}
