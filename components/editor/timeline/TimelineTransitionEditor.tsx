"use client"

import { Blinds, Blend, SquareSplitHorizontal } from "lucide-react"
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
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
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
        {mode !== "cut" && (
          <EasingPicker
            value={stop.easing}
            onChange={(easing) => onShapeEasingChange(stop.id, easing)}
            scopeLabel="Transition easing"
          />
        )}
      </div>

      <fieldset
        disabled={next.time <= stop.time}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <legend className="sr-only">Timing</legend>
        <span>{mode === "cut" ? "Cut at" : "From"}</span>
        <NumberField
          value={startTime}
          min={stop.time}
          max={mode === "cut" ? next.time : endTime}
          step={0.1}
          precision={2}
          suffix="s"
          className="h-8 w-[76px]"
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
              className="h-8 w-[76px]"
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

      {mode === "wipe" && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">Direction</span>
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
    <div className="grid grid-cols-3 gap-0.5">
      {wipeDirections
        .filter((dir) => !(dir.x === 0 && dir.y === 0))
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((dir) => {
          const active =
            stop.wipeDirection.x === dir.x && stop.wipeDirection.y === dir.y

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
              className={`flex size-7 items-center justify-center rounded-md border text-xs transition-colors pointer-coarse:size-11 ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-ring/50 hover:text-foreground"
              }`}
            >
              {dir.label}
            </button>
          )
        })}
    </div>
  )
}
