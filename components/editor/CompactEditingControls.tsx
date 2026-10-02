"use client"

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Redo2,
  Undo2,
} from "lucide-react"
import type { PlaybackControlsProps } from "./ViewportControls"

export function CompactEditingControls({
  playback,
  currentTime,
  duration,
  timelineActive,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  playback: PlaybackControlsProps
  currentTime: number
  duration: number
  timelineActive: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  const buttonClass =
    "grid size-11 shrink-0 place-items-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/35"
  return (
    <div
      aria-label="Preview playback and editing"
      className="flex h-13 shrink-0 items-center justify-between gap-1 border-y border-border bg-background px-2 min-[720px]:hidden"
    >
      <span
        aria-label={`Playhead ${currentTime.toFixed(2)} of ${duration.toFixed(2)} seconds`}
        className="min-w-0 flex-1 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums"
      >
        <span className="text-foreground">{currentTime.toFixed(2)}</span> /{" "}
        {duration.toFixed(1)}s
      </span>
      <button
        type="button"
        aria-label="Previous keyframe"
        disabled={!playback.hasPreviousKeyMoment}
        onClick={playback.onPreviousKeyMoment}
        className={buttonClass}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={
          playback.isPlaying
            ? timelineActive
              ? "Pause timeline"
              : "Pause"
            : timelineActive
              ? "Play timeline"
              : "Play"
        }
        onClick={playback.onPlayToggle}
        className={buttonClass}
      >
        {playback.isPlaying ? (
          <Pause aria-hidden="true" className="size-5 fill-current" />
        ) : (
          <Play aria-hidden="true" className="size-5 fill-current" />
        )}
      </button>
      <button
        type="button"
        aria-label="Next keyframe"
        disabled={!playback.hasNextKeyMoment}
        onClick={playback.onNextKeyMoment}
        className={buttonClass}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Undo edit"
        title="Undo"
        disabled={!canUndo}
        onClick={onUndo}
        className={buttonClass}
      >
        <Undo2 aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Redo edit"
        title="Redo"
        disabled={!canRedo}
        onClick={onRedo}
        className={buttonClass}
      >
        <Redo2 aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
