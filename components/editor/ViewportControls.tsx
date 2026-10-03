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
  showSelectionOutline: boolean
  showTransformGizmo: boolean
  animatedSeekEnabled: boolean
  onResetView: () => void
  onViewInertiaChange: (enabled: boolean) => void
  onShowCenterPointChange: (visible: boolean) => void
  onShowSelectionOutlineChange: (visible: boolean) => void
  onShowTransformGizmoChange: (visible: boolean) => void
  onAnimatedSeekChange: (enabled: boolean) => void
}

export function ViewOptionsPopover({
  viewInertiaEnabled,
  showCenterPoint,
  showSelectionOutline,
  showTransformGizmo,
  animatedSeekEnabled,
  onResetView,
  onViewInertiaChange,
  onShowCenterPointChange,
  onShowSelectionOutlineChange,
  onShowTransformGizmoChange,
  onAnimatedSeekChange,
}: ViewOptionsPopoverProps) {
  return (
    <div className="absolute top-3 right-3 z-40 flex items-center gap-1 rounded-xl border border-white/10 bg-black/35 p-1 text-white backdrop-blur-md">
      <button
        type="button"
        aria-label="Reset view"
        onClick={onResetView}
        title="Reset rotation, position, scale, camera, and zoom"
        className="grid size-10 place-items-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white pointer-coarse:size-11"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Transform object"
        aria-pressed={showTransformGizmo}
        onClick={() => onShowTransformGizmoChange(!showTransformGizmo)}
        title="Edit the object's position, scale, and rotation"
        className="grid size-10 place-items-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white aria-pressed:bg-white/15 aria-pressed:text-white pointer-coarse:size-11"
      >
        <Move3D aria-hidden="true" className="size-4" />
      </button>
      <Popover>
        <PopoverTrigger
          aria-label="View options"
          title="View options"
          className="grid size-10 place-items-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white pointer-coarse:size-11"
        >
          <MoreHorizontal className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          density="menu"
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-60"
        >
          <p className="px-2 pt-1 pb-2 text-xs leading-5 text-muted-foreground">
            Drag to rotate · Alt-drag to orbit the camera · Scroll to zoom.
            Camera orbit and zoom affect the preview only.
          </p>
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
            label="Selection outline"
            checked={showSelectionOutline}
            onCheckedChange={onShowSelectionOutlineChange}
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
    // The whole row toggles, not just the switch.
    <div
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('[role="switch"]')) return
        onCheckedChange(!checked)
      }}
      className="flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 transition-colors select-none hover:bg-muted/60"
    >
      <span className="text-xs text-foreground">{label}</span>
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
    <div
      data-slot="viewport-playback"
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/45 p-1.5 text-white shadow-lg backdrop-blur-xl"
    >
      <Button
        size="icon-xl"
        variant="viewport-ghost"
        onClick={onReset}
        disabled={atTimelineStart}
        aria-label="Go to start"
        title="Go to start"
      >
        <SkipBack size={14} />
      </Button>
      <Button
        size="icon-xl"
        variant="viewport-ghost"
        onClick={onPreviousKeyMoment}
        disabled={!hasPreviousKeyMoment}
        aria-label="Previous keyframe"
        title="Previous keyframe"
      >
        <ChevronLeft size={16} />
      </Button>
      <div
        className={`relative grid place-items-center ${zenMode ? "size-12" : "size-11"}`}
      >
        {zenMode && (
          <svg
            className="pointer-events-none absolute inset-0 -rotate-90"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="1.5"
            />
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.75"
              strokeWidth="1.5"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={
                100 - Math.min(1, Math.max(0, playbackProgress)) * 100
              }
            />
          </svg>
        )}
        <Button
          size={zenMode ? "icon-xl" : "icon-touch"}
          variant="viewport-primary"
          onClick={onPlayToggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className={zenMode ? "rounded-full" : "rounded-xl"}
        >
          {isPlaying ? (
            <Pause size={16} className="fill-current" />
          ) : (
            <Play size={16} className="ml-0.5 fill-current" />
          )}
        </Button>
      </div>
      <Button
        size="icon-xl"
        variant="viewport-ghost"
        onClick={onNextKeyMoment}
        disabled={!hasNextKeyMoment}
        aria-label="Next keyframe"
        title="Next keyframe"
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        size="icon-xl"
        variant="viewport-ghost"
        onClick={onGoToEnd}
        disabled={atTimelineEnd}
        aria-label="Go to end"
        title="Go to end"
      >
        <SkipForward size={14} />
      </Button>
      {zenMode && (
        <Button
          size="toolbar-sm"
          variant="viewport-ghost"
          onClick={onExitZenMode}
        >
          Exit
        </Button>
      )}
    </div>
  )
}
