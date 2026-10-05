"use client"

import { useId, type ReactNode } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FastForward,
  MoreHorizontal,
  SquareDashed,
  Wind,
  type LucideIcon,
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
          collisionPadding={12}
          className="max-h-(--available-height) w-[min(18rem,calc(100vw-24px))] overflow-y-auto overscroll-contain"
        >
          <p className="px-2 pt-1 pb-2 text-xs leading-5 text-muted-foreground">
            Drag to rotate.
            {/* Orbit and zoom need a mouse or trackpad. */}
            <span className="pointer-coarse:hidden">
              {" "}
              Alt-drag to orbit the camera, scroll to zoom. Both affect the
              preview only.
            </span>
          </p>
          <ViewportToggleGroup label="Feel">
            <ViewportToggleRow
              icon={Wind}
              label="Inertia"
              description="Keeps spinning briefly after you let go of a drag."
              checked={viewInertiaEnabled}
              onCheckedChange={onViewInertiaChange}
            />
            <ViewportToggleRow
              icon={FastForward}
              label="Animated seek"
              description="Glides to a new time instead of jumping there."
              checked={animatedSeekEnabled}
              onCheckedChange={onAnimatedSeekChange}
            />
          </ViewportToggleGroup>
          <ViewportToggleGroup label="Show on canvas">
            <ViewportToggleRow
              icon={Crosshair}
              label="Center point"
              description="Marks the pivot the icon rotates around."
              checked={showCenterPoint}
              onCheckedChange={onShowCenterPointChange}
            />
            <ViewportToggleRow
              icon={SquareDashed}
              label="Selection outline"
              description="Outlines the selected layer. Never exported."
              checked={showSelectionOutline}
              onCheckedChange={onShowSelectionOutlineChange}
            />
            <ViewportToggleRow
              icon={Move3D}
              label="Transform gizmo"
              description="Handles to move, scale, and rotate on the canvas."
              checked={showTransformGizmo}
              onCheckedChange={onShowTransformGizmoChange}
            />
          </ViewportToggleGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ViewportToggleGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="border-t border-border pt-1.5 pb-1"
    >
      <div className="px-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </div>
      {children}
    </div>
  )
}

interface ViewportToggleRowProps {
  icon: LucideIcon
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function ViewportToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: ViewportToggleRowProps) {
  const id = useId()
  return (
    // The whole row toggles, not just the switch.
    <div
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('[role="switch"]')) return
        onCheckedChange(!checked)
      }}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors select-none hover:bg-muted/60"
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">
          {label}
        </span>
        <span
          id={id}
          className="block text-[11px] leading-4 text-pretty text-muted-foreground"
        >
          {description}
        </span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        size="sm"
        aria-label={label}
        aria-describedby={id}
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
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-black/45 p-1.5 text-white shadow-lg backdrop-blur-xl max-[720px]:bottom-2 max-[720px]:gap-0.5 max-[720px]:p-1"
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
