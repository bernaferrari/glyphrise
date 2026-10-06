"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { PlaybackControlsProps } from "../ViewportControls"
import {
  formatTimecode,
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_FACTOR,
} from "./TimelineGeometry"

export type TimelineToolbarProps = {
  compactMode?: boolean
  currentTime: number
  duration: number
  durationEditor: string | null
  durationInvalid: boolean
  durationNotice: string | null
  snapEnabled: boolean
  loop: boolean
  zoom: number
  playback?: PlaybackControlsProps
  autoKeyEnabled?: boolean
  onAutoKeyChange?: (enabled: boolean) => void
  onDurationEditorChange: (value: string | null) => void
  onOpenDurationEditor: () => void
  onCommitDurationEditor: () => void
  onApplyDuration: (value: number) => void
  onSnapEnabledChange: (enabled: boolean) => void
  onLoopChange: (enabled: boolean) => void
  onZoomChange: (zoom: number) => void
  onFitTimeline: () => void
  onSeek: (time: number) => void
}

// Transport sits tight around Play, like a video editor's.
const transportButton =
  "grid h-6 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30"

const iconButton =
  "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-100 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-94 disabled:pointer-events-none disabled:opacity-30"

/**
 * Transport for the corner cell beside the ruler (as in Figma): play, the
 * playhead/length timecode, Add, and a quiet options menu. No separate
 * toolbar row.
 */
export function TimelineToolbar({
  compactMode = false,
  currentTime,
  duration,
  durationEditor,
  durationInvalid,
  durationNotice,
  snapEnabled,
  loop,
  zoom,
  playback,
  autoKeyEnabled = false,
  onAutoKeyChange,
  onDurationEditorChange,
  onOpenDurationEditor,
  onCommitDurationEditor,
  onApplyDuration,
  onSnapEnabledChange,
  onLoopChange,
  onZoomChange,
  onFitTimeline,
  onSeek,
}: TimelineToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Timeline"
      className="flex h-full min-w-0 items-center gap-0 pr-1 pl-2"
    >
      {playback && (
        <button
          type="button"
          aria-label="Previous keyframe"
          title="Previous keyframe (,)"
          disabled={!playback.hasPreviousKeyMoment}
          onClick={playback.onPreviousKeyMoment}
          className={transportButton}
        >
          <ChevronLeft className="size-3.5" />
        </button>
      )}
      {playback && (
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label={
            playback.isPlaying
              ? compactMode
                ? "Pause timeline"
                : "Pause"
              : compactMode
                ? "Play timeline"
                : "Play"
          }
          title={playback.isPlaying ? "Pause (Space)" : "Play (Space)"}
          onClick={playback.onPlayToggle}
        >
          {playback.isPlaying ? (
            <Pause className="size-3 fill-current" />
          ) : (
            <Play className="size-3 fill-current" />
          )}
        </Button>
      )}
      {playback && (
        <button
          type="button"
          aria-label="Next keyframe"
          title="Next keyframe (.)"
          disabled={!playback.hasNextKeyMoment}
          onClick={playback.onNextKeyMoment}
          className={transportButton}
        >
          <ChevronRight className="size-3.5" />
        </button>
      )}
      <div className="ml-1.5 flex min-w-0 items-center font-mono text-xs tabular-nums">
        <PlayheadField
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
        />
        {!compactMode && (
          <DurationPopover
            duration={duration}
            durationEditor={durationEditor}
            durationInvalid={durationInvalid}
            durationNotice={durationNotice}
            onDurationEditorChange={onDurationEditorChange}
            onOpenDurationEditor={onOpenDurationEditor}
            onCommitDurationEditor={onCommitDurationEditor}
            onApplyDuration={onApplyDuration}
          />
        )}
      </div>
      <div className="ml-auto flex items-center">
        <OptionsMenu
          compactMode={compactMode}
          duration={duration}
          autoKeyEnabled={autoKeyEnabled}
          onAutoKeyChange={onAutoKeyChange}
          zoom={zoom}
          onZoomChange={onZoomChange}
          onFitTimeline={onFitTimeline}
          snapEnabled={snapEnabled}
          loop={loop}
          onSnapEnabledChange={onSnapEnabledChange}
          onLoopChange={onLoopChange}
          onApplyDuration={onApplyDuration}
        />
      </div>
    </div>
  )
}

function MenuSwitch({
  label,
  description,
  checked,
  ariaLabel,
  danger,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  ariaLabel: string
  danger?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={checked}
      onClick={onChange}
      className="flex min-h-10 w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-left text-control hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {description && (
          <span className="block text-2xs leading-4 text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "h-4 w-7 shrink-0 rounded-full p-0.5 transition-colors",
          checked
            ? danger
              ? "bg-recording"
              : "bg-foreground"
            : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "block size-3 rounded-full bg-background shadow-sm transition-transform duration-150",
            checked && "translate-x-3"
          )}
        />
      </span>
    </button>
  )
}

function OptionsMenu({
  compactMode,
  duration,
  autoKeyEnabled,
  onAutoKeyChange,
  zoom,
  onZoomChange,
  onFitTimeline,
  snapEnabled,
  loop,
  onSnapEnabledChange,
  onLoopChange,
  onApplyDuration,
}: {
  compactMode: boolean
  duration: number
  autoKeyEnabled: boolean
  onAutoKeyChange?: (enabled: boolean) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFitTimeline: () => void
  snapEnabled: boolean
  loop: boolean
  onSnapEnabledChange: (enabled: boolean) => void
  onLoopChange: (enabled: boolean) => void
  onApplyDuration: (value: number) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Timeline options"
        title="Timeline options"
        className={cn(iconButton, autoKeyEnabled && "text-recording")}
      >
        <MoreHorizontal className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        density="compact"
        align="start"
        side="bottom"
        className="w-64"
      >
        <div className="flex items-center gap-1 px-1 pb-1">
          <span className="flex-1 px-1.5 text-control">Zoom</span>
          <button
            type="button"
            aria-label="Zoom timeline out"
            disabled={zoom <= TIMELINE_ZOOM_MIN}
            onClick={() => onZoomChange(zoom / TIMELINE_ZOOM_FACTOR)}
            className={iconButton}
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Fit timeline"
            title="Fit (0)"
            onClick={onFitTimeline}
            className="h-7 min-w-12 rounded-md font-mono text-xs text-muted-foreground tabular-nums hover:bg-muted"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom timeline in"
            disabled={zoom >= TIMELINE_ZOOM_MAX}
            onClick={() => onZoomChange(zoom * TIMELINE_ZOOM_FACTOR)}
            className={iconButton}
          >
            <ZoomIn className="size-3.5" />
          </button>
        </div>
        {compactMode && (
          <div className="flex items-center gap-1 px-1 pb-1">
            <span className="flex-1 px-1.5 text-control">Length</span>
            {[3, 5, 10].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={Math.abs(duration - value) < 0.01}
                onClick={() => onApplyDuration(value)}
                className="h-7 min-w-10 rounded-md text-xs text-muted-foreground hover:bg-muted aria-pressed:bg-muted aria-pressed:font-medium aria-pressed:text-foreground"
              >
                {value}s
              </button>
            ))}
          </div>
        )}
        <div className="mx-1 my-0.5 h-px bg-border" />
        <MenuSwitch
          label="Loop playback"
          ariaLabel={loop ? "Disable loop playback" : "Enable loop playback"}
          checked={loop}
          onChange={() => onLoopChange(!loop)}
        />
        <MenuSwitch
          label="Snap to keyframes"
          ariaLabel={
            snapEnabled
              ? "Disable timeline snapping"
              : "Enable timeline snapping"
          }
          checked={snapEnabled}
          onChange={() => onSnapEnabledChange(!snapEnabled)}
        />
        {onAutoKeyChange && (
          <>
            <div className="mx-1 my-0.5 h-px bg-border" />
            <MenuSwitch
              label="Auto-key"
              description="Every change adds a keyframe at the playhead"
              ariaLabel="Create keyframes when editing"
              checked={autoKeyEnabled}
              danger
              onChange={() => onAutoKeyChange(!autoKeyEnabled)}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function PlayheadField({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const [minutes, seconds] = draft.includes(":")
      ? draft.split(":").map(Number.parseFloat)
      : [0, Number.parseFloat(draft)]
    const time = (minutes || 0) * 60 + seconds
    if (Number.isFinite(time))
      onSeek(Number(Math.max(0, Math.min(duration, time)).toFixed(3)))
    setDraft(null)
  }
  return (
    <input
      aria-label="Playhead time in seconds"
      title="Type a time to jump the playhead"
      inputMode="decimal"
      value={draft ?? formatTimecode(currentTime)}
      onFocus={(event) => {
        // Keep the displayed text so typing replaces it without a jump.
        setDraft(formatTimecode(currentTime))
        event.currentTarget.select()
      }}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          commit()
          event.currentTarget.blur()
        }
        if (event.key === "Escape") {
          event.preventDefault()
          setDraft(null)
          event.currentTarget.blur()
        }
      }}
      className="h-7 w-(--spacing-timecode) rounded px-0.5 text-center font-mono text-xs font-medium text-foreground tabular-nums outline-none hover:bg-foreground/[0.06] focus:bg-muted focus:ring-1 focus:ring-ring max-[720px]:px-0 max-[720px]:text-2xs!"
    />
  )
}

function DurationPopover({
  duration,
  durationEditor,
  durationInvalid,
  durationNotice,
  onDurationEditorChange,
  onOpenDurationEditor,
  onCommitDurationEditor,
  onApplyDuration,
}: Pick<
  TimelineToolbarProps,
  | "duration"
  | "durationEditor"
  | "durationInvalid"
  | "durationNotice"
  | "onDurationEditorChange"
  | "onOpenDurationEditor"
  | "onCommitDurationEditor"
  | "onApplyDuration"
>) {
  return (
    <Popover
      open={durationEditor !== null}
      onOpenChange={(open) => {
        if (open) {
          onOpenDurationEditor()
          return
        }
        if (durationInvalid) {
          onDurationEditorChange(null)
          return
        }
        onCommitDurationEditor()
      }}
    >
      <PopoverTrigger
        title="Change animation length"
        aria-label="Edit duration"
        className="h-7 rounded px-1 whitespace-nowrap text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        / {Number(duration.toFixed(2))}s
      </PopoverTrigger>
      <PopoverContent
        font="sans"
        density="spacious"
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-56"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium">Animation length</span>
          <span className="font-mono text-2xs text-muted-foreground">
            0.5–30s
          </span>
        </div>
        <div
          className={cn(
            "flex h-9 items-center rounded-lg border bg-muted/55 focus-within:border-ring/60",
            durationInvalid ? "border-destructive" : "border-border"
          )}
        >
          <input
            autoFocus
            aria-label="Timeline duration in seconds"
            value={durationEditor ?? duration.toFixed(1)}
            onChange={(event) =>
              onDurationEditorChange(event.currentTarget.value)
            }
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommitDurationEditor()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                onDurationEditorChange(null)
              }
            }}
            className="min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-control text-foreground outline-none"
          />
          <span className="pr-2 text-2xs text-muted-foreground">s</span>
        </div>
        {durationInvalid ? (
          <p className="mt-1.5 text-2xs text-destructive">
            Enter a time in seconds, or press Esc to cancel
          </p>
        ) : durationNotice ? (
          <p className="mt-1.5 text-2xs text-warning">{durationNotice}</p>
        ) : null}
        <div className="mt-2 grid grid-cols-3 gap-1">
          {[3, 5, 10].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onApplyDuration(value)}
              className={cn(
                "h-8 rounded-md text-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                Math.abs(duration - value) < 0.01
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {value}s
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
