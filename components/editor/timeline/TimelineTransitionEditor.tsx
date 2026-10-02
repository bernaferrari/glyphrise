"use client"

import { ArrowRight, Blend, SquareSplitHorizontal } from "lucide-react"
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
    icon: <ArrowRight className="size-3.5" />,
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

  return (
    <>
      <div className="flex items-center justify-between px-0.5 pb-2.5">
        <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Transition
        </span>
        {mode !== "cut" && (
          <EasingPicker
            value={stop.easing}
            onChange={(easing) => onShapeEasingChange(stop.id, easing)}
            scopeLabel="Transition easing"
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {TRANSITION_MODES.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={mode === option.id}
            onClick={() => selectMode(option.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] font-medium transition-colors ${
              mode === option.id
                ? "border-ring/60 bg-accent text-foreground"
                : "border-border bg-muted/45 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      <fieldset disabled={next.time <= stop.time} className="mt-3 grid gap-2">
        <legend className="mb-2 text-xs font-medium">Timing</legend>
        <label className="flex items-center justify-between gap-2 text-xs">
          {mode === "cut" ? "Cut at" : "Start"}
          <NumberField
            value={startTime}
            min={stop.time}
            max={mode === "cut" ? next.time : endTime}
            step={0.1}
            precision={2}
            suffix="s"
            ariaLabel={
              mode === "cut"
                ? "Cut time in seconds"
                : "Transition start in seconds"
            }
            onChange={(time) => {
              const fraction = (time - stop.time) / (next.time - stop.time)
              onShapeBlendChange(
                stop.id,
                mode === "cut"
                  ? { transitionStart: fraction, transitionEnd: fraction }
                  : { transitionStart: fraction }
              )
            }}
          />
        </label>
        {mode !== "cut" && (
          <label className="flex items-center justify-between gap-2 text-xs">
            End
            <NumberField
              value={endTime}
              min={startTime}
              max={next.time}
              step={0.1}
              precision={2}
              suffix="s"
              ariaLabel="Transition end in seconds"
              onChange={(time) =>
                onShapeBlendChange(stop.id, {
                  transitionEnd: (time - stop.time) / (next.time - stop.time),
                })
              }
            />
          </label>
        )}
      </fieldset>

      {mode === "wipe" && (
        <div className="mt-3 flex justify-center">
          <WipeDirectionPicker
            stop={stop}
            wipeDirections={wipeDirections}
            onShapeBlendChange={onShapeBlendChange}
          />
        </div>
      )}
    </>
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
    <div className="grid grid-cols-3 gap-1">
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
              className={`flex size-11 items-center justify-center rounded-md border text-xs transition-colors ${
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
