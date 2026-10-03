"use client"

import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Blinds,
  Blend,
  SquareSplitHorizontal,
  type LucideIcon,
} from "lucide-react"
import type { EasingType, ShapeStop } from "../TimelineModel"
import type { WipeDirectionOption } from "./TimelineTypes"
import { NumberField } from "../NumberField"
import { EasingPicker } from "./TimelineEasingControls"
import type { TransitionMode } from "./TimelineTransitionModel"

type TimelineTransitionEditorProps = {
  mode: TransitionMode
  stop: ShapeStop
  next: ShapeStop
  startTime: number
  endTime: number
  wipeDirections: WipeDirectionOption[]
  onShapeBlendChange: (
    id: string,
    patch: Partial<
      Pick<
        ShapeStop,
        "transitionType" | "wipeDirection" | "transitionStart" | "transitionEnd"
      >
    >
  ) => void
  onShapeEasingChange: (id: string, easing: EasingType) => void
}

const TRANSITION_MODES = [
  {
    id: "fade" as const,
    label: "Fade",
    icon: <Blend className="size-3.5" />,
  },
  {
    id: "wipe" as const,
    label: "Wipe",
    icon: <Blinds className="size-3.5" />,
  },
  {
    id: "cut" as const,
    label: "Cut",
    icon: <SquareSplitHorizontal className="size-3.5" />,
  },
]

export function TimelineTransitionEditor({
  mode,
  stop,
  next,
  startTime,
  endTime,
  wipeDirections,
  onShapeBlendChange,
  onShapeEasingChange,
}: TimelineTransitionEditorProps) {
  const selectMode = (nextMode: TransitionMode) => {
    if (nextMode === "cut") {
      onShapeBlendChange(stop.id, { transitionType: "cut" })
      return
    }

    if (nextMode === "fade") {
      onShapeBlendChange(stop.id, {
        transitionType: "fade",
      })
      return
    }

    onShapeBlendChange(stop.id, {
      transitionType: "wipe",
      wipeDirection:
        stop.wipeDirection.x === 0 && stop.wipeDirection.y === 0
          ? { x: 1, y: 0 }
          : stop.wipeDirection,
    })
  }

  const toFraction = (time: number) =>
    (time - stop.time) / (next.time - stop.time)

  return (
    // One content width: every row's controls end on the same edge.
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex items-center">
        <div
          role="group"
          aria-label="Transition type"
          className="flex flex-1 rounded-lg bg-muted p-0.5"
        >
          {TRANSITION_MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={mode === option.id}
              onClick={() => selectMode(option.id)}
              className="flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <fieldset
        disabled={next.time <= stop.time}
        className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
      >
        <legend className="sr-only">Timing</legend>
        <span className="w-16 shrink-0">
          {mode === "cut" ? "Cut at" : "From"}
        </span>
        <NumberField
          value={startTime}
          min={stop.time}
          max={mode === "cut" ? next.time : endTime}
          step={0.1}
          precision={2}
          suffix="s"
          className="h-8 min-w-0 flex-1"
          ariaLabel={
            mode === "cut"
              ? "Cut time in seconds"
              : "Transition start in seconds"
          }
          onChange={(time) => {
            const fraction = toFraction(time)
            onShapeBlendChange(
              stop.id,
              mode === "cut"
                ? { transitionStart: fraction, transitionEnd: fraction }
                : { transitionStart: fraction }
            )
          }}
        />
        {mode !== "cut" && (
          <>
            <span>to</span>
            <NumberField
              value={endTime}
              min={startTime}
              max={next.time}
              step={0.1}
              precision={2}
              suffix="s"
              className="h-8 min-w-0 flex-1"
              ariaLabel="Transition end in seconds"
              onChange={(time) =>
                onShapeBlendChange(stop.id, {
                  transitionEnd: toFraction(time),
                })
              }
            />
          </>
        )}
      </fieldset>

      {mode !== "cut" && (
        <div className="flex items-center gap-1.5">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">
            Easing
          </span>
          <EasingPicker
            value={stop.easing}
            onChange={(easing) => onShapeEasingChange(stop.id, easing)}
            scopeLabel="Transition easing"
            variant="field"
          />
        </div>
      )}

      {mode === "wipe" && (
        <div className="flex items-center gap-1.5">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">
            Direction
          </span>
          <WipeDirectionPicker
            stop={stop}
            wipeDirections={wipeDirections}
            onShapeBlendChange={onShapeBlendChange}
          />
        </div>
      )}
    </div>
  )
}

const DIRECTION_ICONS: Record<string, LucideIcon> = {
  "-1,1": ArrowUpLeft,
  "0,1": ArrowUp,
  "1,1": ArrowUpRight,
  "-1,0": ArrowLeft,
  "1,0": ArrowRight,
  "-1,-1": ArrowDownLeft,
  "0,-1": ArrowDown,
  "1,-1": ArrowDownRight,
}

function WipeDirectionPicker({
  stop,
  wipeDirections,
  onShapeBlendChange,
}: {
  stop: ShapeStop
  wipeDirections: WipeDirectionOption[]
  onShapeBlendChange: TimelineTransitionEditorProps["onShapeBlendChange"]
}) {
  return (
    // Compass pad on the same surface as the Fade/Wipe/Cut control above.
    <div
      role="group"
      aria-label="Wipe direction"
      className="grid grid-cols-3 gap-0.5 rounded-lg bg-muted/60 p-0.5"
    >
      {/* Preview: the new icon sweeps in from the filled side. */}
      <span
        aria-hidden="true"
        className="col-start-2 row-start-2 m-auto size-5 rounded-[5px] bg-background/50 ring-1 ring-foreground/10 transition-[background-image] duration-200"
        style={{
          backgroundImage: `linear-gradient(${
            (Math.atan2(stop.wipeDirection.x, stop.wipeDirection.y) * 180) /
            Math.PI
          }deg, var(--timeline-accent) 0 45%, transparent 55%)`,
        }}
      />
      {wipeDirections
        .filter((dir) => !(dir.x === 0 && dir.y === 0))
        .map((dir) => {
          const active =
            stop.wipeDirection.x === dir.x && stop.wipeDirection.y === dir.y
          const Icon =
            DIRECTION_ICONS[`${Math.sign(dir.x)},${Math.sign(dir.y)}`] ??
            ArrowRight

          return (
            <button
              key={dir.label}
              type="button"
              title={dir.tooltip}
              aria-label={dir.tooltip}
              aria-pressed={active}
              onClick={() =>
                onShapeBlendChange(stop.id, {
                  wipeDirection: { x: dir.x, y: dir.y },
                })
              }
              style={{
                gridColumn: Math.sign(dir.x) + 2,
                gridRow: 2 - Math.sign(dir.y),
              }}
              className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm pointer-coarse:size-11"
            >
              <Icon
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2.25}
              />
            </button>
          )
        })}
    </div>
  )
}
