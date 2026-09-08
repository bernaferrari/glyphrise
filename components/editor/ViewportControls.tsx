"use client"

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RotateCcw,
  Move3D,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ViewOptionsPopoverProps = {
  viewInertiaEnabled: boolean
  showCenterPoint: boolean
  showTransformGizmo: boolean
  animatedSeekEnabled: boolean
  onResetView: () => void
  onViewInertiaChange: (enabled: boolean) => void
  onShowCenterPointChange: (visible: boolean) => void
  onShowTransformGizmoChange: (visible: boolean) => void
  onAnimatedSeekChange: (enabled: boolean) => void
}

export function ViewOptionsPopover({
  viewInertiaEnabled,
  showCenterPoint,
  showTransformGizmo,
  animatedSeekEnabled,
  onResetView,
  onViewInertiaChange,
  onShowCenterPointChange,
  onShowTransformGizmoChange,
  onAnimatedSeekChange,
}: ViewOptionsPopoverProps) {
  return (
    <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
      <button
        type="button"
        onClick={onResetView}
        title="Reset preview camera and zoom"
        className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3 text-xs text-foreground pointer-coarse:min-h-11"
      >
        <RotateCcw aria-hidden="true" className="size-3.5" /> Reset camera
      </button>
      <button
        type="button"
        aria-label="Transform object"
        aria-pressed={showTransformGizmo}
        onClick={() => onShowTransformGizmoChange(!showTransformGizmo)}
        title="Edit the object's position, scale, and rotation"
        className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-background/90 px-3 text-xs text-foreground aria-pressed:bg-accent pointer-coarse:min-h-11"
      >
        <Move3D aria-hidden="true" className="size-3.5" /> Transform
      </button>
      <Popover>
        <PopoverTrigger
          aria-label="View options"
          title="View options"
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <MoreHorizontal className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-44 border-border bg-popover p-1.5 text-popover-foreground"
        >
          <ViewportToggleRow
            label="Inertia"
            checked={viewInertiaEnabled}
            onCheckedChange={onViewInertiaChange}
          />
          <ViewportToggleRow
            label="Center point"
            checked={showCenterPoint}
            onCheckedChange={onShowCenterPointChange}
          />
          <ViewportToggleRow
            label="Transform gizmo"
            checked={showTransformGizmo}
            onCheckedChange={onShowTransformGizmoChange}
          />
          <ViewportToggleRow
            label="Animated seek"
            checked={animatedSeekEnabled}
            onCheckedChange={onAnimatedSeekChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface ViewportToggleRowProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function ViewportToggleRow({
  label,
  checked,
  onCheckedChange,
}: ViewportToggleRowProps) {
  return (
    <div className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-2 transition-colors hover:bg-muted/60">
      <span className="text-[11px] text-foreground">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        size="sm"
        aria-label={label}
      />
    </div>
  )
}

export type PlaybackControlsProps = {
  zenMode: boolean
  isPlaying: boolean
  playbackProgress: number
  atTimelineStart: boolean
  atTimelineEnd: boolean
  hasPreviousKeyMoment: boolean
  hasNextKeyMoment: boolean
  onReset: () => void
  onPreviousKeyMoment: () => void
  onPlayToggle: () => void
  onNextKeyMoment: () => void
  onGoToEnd: () => void
  onExitZenMode: () => void
}

export function PlaybackControls({
  zenMode,
  isPlaying,
  playbackProgress,
  atTimelineStart,
  atTimelineEnd,
  hasPreviousKeyMoment,
  hasNextKeyMoment,
  onReset,
  onPreviousKeyMoment,
  onPlayToggle,
  onNextKeyMoment,
  onGoToEnd,
  onExitZenMode,
}: PlaybackControlsProps) {
  return (
    <div className="viewport-playback absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-2 shadow-lg backdrop-blur-xl transition-colors hover:border-border">
      <Button
        size="icon"
        variant="ghost"
        onClick={onReset}
        disabled={atTimelineStart}
        aria-label="Go to start"
        title="Go to start"
        className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <SkipBack size={14} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onPreviousKeyMoment}
        disabled={!hasPreviousKeyMoment}
        aria-label="Previous keyframe"
        title="Previous keyframe"
        className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="relative grid size-11 place-items-center">
        {zenMode && (
          <svg
            className="pointer-events-none absolute inset-0 -rotate-90"
            viewBox="0 0 44 44"
            aria-hidden="true"
          >
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="var(--border)"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeDasharray={`${(playbackProgress * 125.66).toFixed(2)} 125.66`}
            />
          </svg>
        )}
        <Button
          size="icon"
          onClick={onPlayToggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="size-10 rounded-full bg-foreground text-background hover:bg-foreground/85"
        >
          {isPlaying ? (
            <Pause size={16} className="fill-current" />
          ) : (
            <Play size={16} className="fill-current" />
          )}
        </Button>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={onNextKeyMoment}
        disabled={!hasNextKeyMoment}
        aria-label="Next keyframe"
        title="Next keyframe"
        className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={onGoToEnd}
        disabled={atTimelineEnd}
        aria-label="Go to end"
        title="Go to end"
        className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <SkipForward size={14} />
      </Button>
      {zenMode && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onExitZenMode}
          className="h-7 rounded-full px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Exit
        </Button>
      )}
    </div>
  )
}
