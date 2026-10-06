"use client"

import React from "react"
import { usePressType } from "@/lib/touch-intent"
import type { EasingType, TimelineTrack } from "../TimelineModel"
import { easingMenuItems } from "./TimelineEasingControls"
import { widthForSpan, xForFrac } from "./TimelineGeometry"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import {
  TimelineLaneGhost,
  TimelineMotionSegments,
  useLaneGhost,
} from "./TimelinePrimitives"
import { TimelineTrackKeyframeButton } from "./TimelineTrackKeyframeButton"
import type { SelectedTimelineKeyframe, TrackTimeEditor } from "./TimelineTypes"

export type TimelineTrackRowProps = {
  duration: number
  track: TimelineTrack
  isRevealed: boolean
  isActive: boolean
  selectedKeyframe: SelectedTimelineKeyframe
  timeEditor: TrackTimeEditor | null
  keyframeTimeClampNotice?: string | null
  keyframeDraggedRef: React.MutableRefObject<boolean>
  onSelectTrack: (trackId: string) => void
  onSelectKeyframe: (keyframe: SelectedTimelineKeyframe) => void
  onOpenKeyframeEditor: (keyframe: SelectedTimelineKeyframe) => void
  onTimeEditorChange: React.Dispatch<
    React.SetStateAction<TrackTimeEditor | null>
  >
  onCommitTimeEditor: () => void
  onScrubStart?: () => void
  onTimeChange: (time: number) => void
  onAddTrackKeyframeAtTime: (trackId: string, time: number) => void
  onRemoveTrackKeyframe: (trackId: string, keyframeId: string) => void
  onClearTrackKeyframes?: (trackId: string) => void
  onSetTrackEasing: (trackId: string, easing: EasingType) => void
  onSetSingleKeyframeEasing: (
    trackId: string,
    keyframeId: string,
    easing: EasingType
  ) => void
  onBlockDrag: (event: React.PointerEvent<HTMLElement>, trackId: string) => void
  onKeyframeDrag: (
    event: React.PointerEvent<HTMLElement>,
    trackId: string,
    keyframeId: string
  ) => void
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

export function TimelineTrackRow({
  duration,
  track,
  isRevealed,
  isActive,
  selectedKeyframe,
  timeEditor,
  keyframeTimeClampNotice,
  keyframeDraggedRef,
  onSelectTrack,
  onSelectKeyframe,
  onOpenKeyframeEditor,
  onTimeEditorChange,
  onCommitTimeEditor,
  onScrubStart,
  onTimeChange,
  onAddTrackKeyframeAtTime,
  onRemoveTrackKeyframe,
  onClearTrackKeyframes,
  onSetTrackEasing,
  onSetSingleKeyframeEasing,
  onBlockDrag,
  onKeyframeDrag,
  timeFromClientX,
  onOpenContextMenu,
  createGoToMenuItem,
}: TimelineTrackRowProps) {
  const animated = track.keyframes.length > 0
  const { ghostX, laneHandlers } = useLaneGhost()
  const press = usePressType()
  const seekRow = (clientX: number) => {
    onSelectKeyframe(null)
    onScrubStart?.()
    onSelectTrack(track.id)
    onTimeChange(timeFromClientX(clientX))
  }
  const rowSelected =
    selectedKeyframe?.type === "track" && selectedKeyframe.trackId === track.id

  return (
    <div
      className={`relative h-[var(--timeline-property-height)] border-b border-border/50 transition-colors ${
        isRevealed
          ? "bg-primary/10 ring-1 ring-primary/20 ring-inset"
          : isActive || rowSelected
            ? "bg-foreground/[0.035]"
            : "hover:bg-foreground/[0.025]"
      }`}
      {...laneHandlers}
      title="Double-click to add a keyframe"
      onPointerDownCapture={press.onPointerDownCapture}
      // A finger landing here may be starting a scroll; only a tap seeks.
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        if (event.pointerType === "touch") return
        seekRow(event.clientX)
      }}
      onClick={(event) => {
        if (press.ref.current === "touch") seekRow(event.clientX)
      }}
      onContextMenu={(event) => {
        const time = timeFromClientX(event.clientX, {
          bypass: event.altKey,
        })
        onOpenContextMenu(event, track.name, [
          {
            label: "Add keyframe",
            shortcut: `${time.toFixed(2)}s`,
            onSelect: () => onAddTrackKeyframeAtTime(track.id, time),
          },
          createGoToMenuItem(event, time, () => onSelectTrack(track.id)),
          ...(animated
            ? [
                ...easingMenuItems(
                  track.keyframes[0]?.easing ?? "ease-in-out",
                  (easing) => onSetTrackEasing(track.id, easing)
                ),
                { type: "separator" as const },
                {
                  label: "Clear keyframes",
                  danger: true,
                  onSelect: () => onClearTrackKeyframes?.(track.id),
                },
              ]
            : []),
        ])
      }}
      onDoubleClick={(event) => {
        event.preventDefault()
        onAddTrackKeyframeAtTime(track.id, timeFromClientX(event.clientX))
      }}
    >
      <TimelineMotionSegments
        name={track.name}
        keyframes={track.keyframes}
        duration={duration}
        xForTime={xForFrac}
        widthForTime={widthForSpan}
        onEasingChange={(keyframeId, easing) =>
          onSetSingleKeyframeEasing(track.id, keyframeId, easing)
        }
        onDragStart={(event) => onBlockDrag(event, track.id)}
      />

      <TimelineLaneGhost x={ghostX} color={track.color} />

      {track.keyframes.map((keyframe) => (
        <TimelineTrackKeyframeButton
          key={keyframe.id}
          track={track}
          keyframe={keyframe}
          duration={duration}
          selectedKeyframe={selectedKeyframe}
          timeEditor={timeEditor}
          keyframeTimeClampNotice={keyframeTimeClampNotice}
          keyframeDraggedRef={keyframeDraggedRef}
          onSelectTrack={onSelectTrack}
          onSelectKeyframe={onSelectKeyframe}
          onOpenKeyframeEditor={onOpenKeyframeEditor}
          onTimeEditorChange={onTimeEditorChange}
          onCommitTimeEditor={onCommitTimeEditor}
          onTimeChange={onTimeChange}
          onRemoveTrackKeyframe={onRemoveTrackKeyframe}
          onSetSingleKeyframeEasing={onSetSingleKeyframeEasing}
          onKeyframeDrag={onKeyframeDrag}
          onOpenContextMenu={onOpenContextMenu}
          createGoToMenuItem={createGoToMenuItem}
        />
      ))}
    </div>
  )
}
