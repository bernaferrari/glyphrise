"use client"

import {
  CircleHelp,
  MoreHorizontal,
  Diamond,
  Magnet,
  MoveRight,
  RotateCw,
  Play,
  Pause,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TIMELINE_LAYER } from "./TimelineLayering"

interface TimelineHeaderProps {
  compactMode?: boolean
  showSnap?: boolean
  isPlaying?: boolean
  onPlayToggle?: () => void
  currentTime: number
  duration: number
  durationEditor: string | null
  durationInvalid: boolean
  durationNotice: string | null
  snapEnabled: boolean
  loop: boolean
  onDurationEditorChange: (value: string | null) => void
  onOpenDurationEditor: () => void
  onCommitDurationEditor: () => void
  onApplyDuration: (value: number) => void
  onSnapEnabledChange: (enabled: boolean) => void
  onLoopChange: (enabled: boolean) => void
}

export function TimelineHeader({
  compactMode = false,
  showSnap = true,
  isPlaying = false,
  onPlayToggle,
  currentTime,
  duration,
  durationEditor,
  durationInvalid,
  durationNotice,
  snapEnabled,
  loop,
  onDurationEditorChange,
  onOpenDurationEditor,
  onCommitDurationEditor,
  onApplyDuration,
  onSnapEnabledChange,
  onLoopChange,
}: TimelineHeaderProps) {
  return (
    <div
      className="relative flex min-h-11 min-w-0 flex-1 shrink-0 items-center gap-2 border-b border-border bg-background px-2 font-mono text-xs tabular-nums"
      style={{ zIndex: TIMELINE_LAYER.ruler }}
    >
      <Popover
        open={durationEditor !== null}
        onOpenChange={(open) => {
          if (open) {
            onOpenDurationEditor()
            return
          }
          if (durationInvalid) {
            // Garbage text: revert and let the controlled popover close.
            onDurationEditorChange(null)
            return
          }
          onCommitDurationEditor()
        }}
      >
        <PopoverTrigger
          title="Edit duration"
          aria-label="Edit duration"
          className="flex min-h-11 min-w-0 items-center gap-1 rounded-md px-2 text-left transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {!compactMode && (
            <>
              <span className="text-foreground">{currentTime.toFixed(2)}</span>
              <span className="px-1 text-muted-foreground">/</span>
            </>
          )}
          <span className="text-muted-foreground">{duration.toFixed(1)}s</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          sideOffset={8}
          className="w-52 border-border bg-popover p-3 text-popover-foreground shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Duration
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              0.5-30s
            </span>
          </div>
          <div
            className={`flex h-9 items-center rounded-lg border bg-muted/55 focus-within:border-ring/50 ${durationInvalid ? "border-destructive" : "border-border"}`}
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
              className="min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-[13px] text-foreground outline-none"
            />
            <span className="pr-2 text-[11px] text-muted-foreground">s</span>
          </div>
          {durationInvalid ? (
            <p className="mt-1 text-[10px] text-destructive">
              Enter a time in seconds, or press Esc to cancel
            </p>
          ) : durationNotice ? (
            <p className="mt-1 text-[10px] text-amber-600">{durationNotice}</p>
          ) : null}
          <div className="mt-2 grid grid-cols-3 gap-1">
            {[3, 5, 10].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onApplyDuration(value)}
                className="h-7 rounded-md text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {value}s
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {onPlayToggle && (
          <button
            type="button"
            aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
            onClick={onPlayToggle}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </button>
        )}
        {!compactMode && showSnap && (
          <TimelineToggle
            active={snapEnabled}
            activeLabel="Disable timeline snapping"
            inactiveLabel="Enable timeline snapping"
            tooltip="Snap to keyframes"
            onClick={() => onSnapEnabledChange(!snapEnabled)}
          >
            <Magnet className="size-3" />
          </TimelineToggle>
        )}
        {!compactMode && (
          <TimelineToggle
            active={loop}
            activeLabel="Disable loop playback"
            inactiveLabel="Enable loop playback"
            tooltip="Loop playback"
            onClick={() => onLoopChange(!loop)}
          >
            <RotateCw className="size-3" />
          </TimelineToggle>
        )}
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={
                  compactMode ? "Animation options" : "How the timeline works"
                }
                title="Timeline guide"
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
              />
            }
          >
            {compactMode ? (
              <MoreHorizontal className="size-4" />
            ) : (
              <CircleHelp className="size-3" />
            )}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            sideOffset={8}
            className="max-h-(--available-height) w-64 overflow-y-auto border-border bg-popover p-3 font-sans text-popover-foreground shadow-2xl"
          >
            {compactMode && (
              <div className="mb-3 grid gap-1 border-b border-border pb-3">
                <button
                  type="button"
                  aria-label={
                    loop ? "Disable loop playback" : "Enable loop playback"
                  }
                  aria-pressed={loop}
                  onClick={() => onLoopChange(!loop)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md px-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>Loop playback</span>
                  <span className="text-xs text-muted-foreground">
                    {loop ? "On" : "Off"}
                  </span>
                </button>
                {showSnap && (
                  <button
                    type="button"
                    aria-label={
                      snapEnabled
                        ? "Disable timeline snapping"
                        : "Enable timeline snapping"
                    }
                    aria-pressed={snapEnabled}
                    onClick={() => onSnapEnabledChange(!snapEnabled)}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md px-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span>Snap to keyframes</span>
                    <span className="text-xs text-muted-foreground">
                      {snapEnabled ? "On" : "Off"}
                    </span>
                  </button>
                )}
              </div>
            )}
            <div className="text-xs font-semibold">Working with motion</div>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              Use Motion to edit time, easing, and values. Use Sequence to
              arrange icon clips and transitions.
            </p>
            <div className="mt-3 grid gap-2.5 text-[11px]">
              <TimelineGuideRow
                icon={
                  <span className="h-3 w-5 rounded-sm bg-blue-400/35 ring-1 ring-blue-400/70" />
                }
                label="Icon clips"
                description="Which icon appears over time"
              />
              <TimelineGuideRow
                icon={<MoveRight className="size-4 text-muted-foreground" />}
                label="Transition band"
                description="How one icon becomes the next"
              />
              <TimelineGuideRow
                icon={<span className="size-2.5 rounded-full bg-amber-400" />}
                label="Property rows"
                description="Values that animate"
              />
              <TimelineGuideRow
                icon={
                  <Diamond className="size-3.5 fill-amber-400 text-amber-500" />
                }
                label="Diamonds"
                description="Keyframes at an exact time"
              />
              <div className="col-span-3 text-muted-foreground max-[720px]:hidden">
                Double-click a track row (or press the ◆ button) to add a
                keyframe at the playhead.
              </div>
              <div className="col-span-3 text-muted-foreground max-[720px]:hidden">
                Right-click a lane for &quot;Go to time&quot;.
              </div>
              <div className="col-span-3 hidden text-muted-foreground max-[720px]:block">
                Tap the ruler to move the playhead, then press the ◆ button to
                add a keyframe.
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function TimelineGuideRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <div className="grid grid-cols-[20px_78px_1fr] items-center gap-2">
      <span className="flex items-center justify-center">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground">{description}</span>
    </div>
  )
}

interface TimelineToggleProps {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  tooltip: string
  onClick: () => void
  children: React.ReactNode
}

function TimelineToggle({
  active,
  activeLabel,
  inactiveLabel,
  tooltip,
  onClick,
  children,
}: TimelineToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={active ? activeLabel : inactiveLabel}
        aria-pressed={active}
        onClick={onClick}
        className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 transition-colors focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        }`}
      >
        {children}
        <span className="ml-2 hidden font-sans text-xs min-[720px]:inline">
          {tooltip}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
