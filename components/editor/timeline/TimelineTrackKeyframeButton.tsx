"use client"

import React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EasingType, TimelineTrack } from "../TimelineModel"
import type { SelectedTimelineKeyframe, TrackTimeEditor } from "./TimelineTypes"
import { easingMenuItems } from "./TimelineEasingControls"
import { xForFrac } from "./TimelineGeometry"
import { TIMELINE_LAYER } from "./TimelineLayering"
import type { TimelineMenuItem } from "./TimelineMenuModel"
import { formatValueLabel, TimelineDiamond } from "./TimelinePrimitives"

type TimelineTrackKeyframeButtonProps = {
  track: TimelineTrack
  keyframe: TimelineTrack["keyframes"][number]
  duration: number
  selectedKeyframe: SelectedTimelineKeyframe
  timeEditor: TrackTimeEditor | null
  keyframeTimeClampNotice?: string | null
  keyframeDraggedRef: React.MutableRefObject<boolean>
  onSelectTrack: (trackId: string) => void
  onSelectKeyframe: (keyframe: SelectedTimelineKeyframe) => void
  onTimeEditorChange: React.Dispatch<
    React.SetStateAction<TrackTimeEditor | null>
  >
  onCommitTimeEditor: () => void
  onTimeChange: (time: number) => void
  onRemoveTrackKeyframe: (trackId: string, keyframeId: string) => void
  onSetSingleKeyframeEasing: (
    trackId: string,
    keyframeId: string,
    easing: EasingType
  ) => void
  onKeyframeDrag: (
    event: React.PointerEvent<HTMLElement>,
    trackId: string,
    keyframeId: string
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

export function TimelineTrackKeyframeButton({
  track,
  keyframe,
  duration,
  selectedKeyframe,
  timeEditor,
  keyframeTimeClampNotice,
  keyframeDraggedRef,
  onSelectTrack,
  onSelectKeyframe,
  onTimeEditorChange,
  onCommitTimeEditor,
  onTimeChange,
  onRemoveTrackKeyframe,
  onSetSingleKeyframeEasing,
  onKeyframeDrag,
  onOpenContextMenu,
  createGoToMenuItem,
}: TimelineTrackKeyframeButtonProps) {
  const selected =
    selectedKeyframe?.type === "track" &&
    selectedKeyframe.trackId === track.id &&
    selectedKeyframe.kfId === keyframe.id
  const editingTime =
    timeEditor?.trackId === track.id && timeEditor.kfId === keyframe.id
  const timeDraftInvalid =
    editingTime && !Number.isFinite(Number.parseFloat(timeEditor.draft))
  const selection: SelectedTimelineKeyframe = {
    type: "track",
    trackId: track.id,
    kfId: keyframe.id,
  }

  const selectKeyframe = () => {
    onSelectTrack(track.id)
    onSelectKeyframe(selection)
    onTimeChange(keyframe.time)
  }

  return (
    <Popover
      open={editingTime}
      onOpenChange={(open) => {
        if (open) return
        if (editingTime) onCommitTimeEditor()
      }}
    >
      <PopoverTrigger
        type="button"
        aria-label={`Select ${track.name} keyframe at ${keyframe.time.toFixed(2)} seconds`}
        aria-pressed={selected}
        title={`${track.name} · ${formatValueLabel(track, keyframe.value)} @ ${keyframe.time.toFixed(2)}s`}
        className={`touch-hit-area absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center transition-transform select-none hover:scale-110 focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none active:cursor-grabbing ${selected ? "scale-110" : ""}`}
        style={{
          left: xForFrac(keyframe.time / duration),
          zIndex: selected
            ? TIMELINE_LAYER.selectedKeyframe
            : TIMELINE_LAYER.trackKeyframe,
        }}
        onPointerDown={(event) => {
          if (!event.isPrimary) return
          event.stopPropagation()
          selectKeyframe()
          if (event.button !== 0) return
          onKeyframeDrag(event, track.id, keyframe.id)
        }}
        onContextMenu={(event) => {
          event.stopPropagation()
          selectKeyframe()
          onOpenContextMenu(event, track.name, [
            {
              label: "Edit time",
              shortcut: `${keyframe.time.toFixed(2)}s`,
              onSelect: () =>
                onTimeEditorChange({
                  trackId: track.id,
                  kfId: keyframe.id,
                  draft: keyframe.time.toFixed(2),
                }),
            },
            createGoToMenuItem(event, keyframe.time, selectKeyframe),
            ...easingMenuItems(keyframe.easing, (easing) =>
              onSetSingleKeyframeEasing(track.id, keyframe.id, easing)
            ),
            { type: "separator" },
            {
              label: "Remove keyframe",
              danger: true,
              onSelect: () => onRemoveTrackKeyframe(track.id, keyframe.id),
            },
          ])
        }}
        onClick={(event) => {
          event.stopPropagation()
          if (keyframeDraggedRef.current) {
            keyframeDraggedRef.current = false
            return
          }
          selectKeyframe()
          onTimeChange(keyframe.time)
        }}
      >
        <TimelineDiamond
          color={track.color}
          borderColor="rgba(0,0,0,0.85)"
          selected={selected}
          className="size-[18px]"
        />
      </PopoverTrigger>
      {editingTime && timeEditor && (
        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-32 border-border bg-popover p-2 text-popover-foreground"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.stopPropagation()}
        >
          <label className="mb-1 block text-left text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Time (0–{duration.toFixed(1)}s)
          </label>
          <div
            className={`flex h-8 items-center rounded-md bg-muted/70 ring-1 ${timeDraftInvalid ? "ring-destructive" : "ring-border"}`}
          >
            <input
              autoFocus
              aria-label={`${track.name} keyframe time in seconds`}
              value={timeEditor.draft}
              onChange={(event) =>
                onTimeEditorChange((current) =>
                  current
                    ? {
                        ...current,
                        draft: event.target.value,
                      }
                    : current
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  onCommitTimeEditor()
                }
                if (event.key === "Escape") {
                  event.preventDefault()
                  onTimeEditorChange(null)
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-[12px] text-foreground outline-none"
            />
            <span className="pr-2 text-[11px] text-muted-foreground">s</span>
          </div>
          {!timeDraftInvalid && keyframeTimeClampNotice && editingTime ? (
            <p className="mt-1 text-left text-[10px] text-amber-600">
              {keyframeTimeClampNotice}
            </p>
          ) : null}
          {timeDraftInvalid && (
            <p className="mt-1 text-left text-[10px] text-destructive">
              Enter a time in seconds
            </p>
          )}
        </PopoverContent>
      )}
    </Popover>
  )
}
