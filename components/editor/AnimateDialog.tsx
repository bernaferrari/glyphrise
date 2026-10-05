"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { MotionPresetPreview } from "./MotionPresetPreview"
import {
  ANIMATION_PRESETS,
  type AnimationPresetId,
} from "./AnimationPresetModel"
import { TimelineRowIcon } from "./timeline/TimelineRowIcon"

export type AnimateDialogProps = {
  svgContent?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  duration: number
  /** Keyframes each target property already has, keyed by property name. */
  existingKeyframes?: Partial<Record<"Rotation" | "Scale", number>>
  onApply: (id: AnimationPresetId, duration: number, intensity: number) => void
}

const LENGTHS = [1, 2, 3, 5]
const AMOUNTS = [
  { label: "Subtle", value: 0.5 },
  { label: "Normal", value: 1 },
  { label: "Strong", value: 1.75 },
]
const PROPERTY_ROW_ID = { Rotation: "rotation", Scale: "scale" } as const

export function AnimateDialog({
  svgContent,
  open,
  onOpenChange,
  duration,
  existingKeyframes,
  onApply,
}: AnimateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editor-scrollbar max-h-[calc(100dvh-32px)] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {open && (
          <AnimationChoices
            svgContent={svgContent}
            initialDuration={duration}
            existingKeyframes={existingKeyframes ?? {}}
            onApply={(id, seconds, intensity) => {
              onApply(id, seconds, intensity)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ label: string; value: T }>
  value: T | null
  onChange: (value: T) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-1 rounded-lg bg-muted p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="min-h-8 flex-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * What applying the preset does, drawn the way the timeline will show it:
 * one property row with its new keyframes across the whole animation.
 */
function ResultPreview({
  property,
  fractions,
  length,
  existing,
}: {
  property: "Rotation" | "Scale"
  fractions: readonly number[]
  length: number
  existing: number
}) {
  return (
    <div className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>On your timeline</span>
        <span className="tabular-nums">0s → {Number(length.toFixed(2))}s</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium">
          <TimelineRowIcon
            id={PROPERTY_ROW_ID[property]}
            className="size-3.5 text-muted-foreground"
          />
          {property}
        </span>
        <span className="relative h-5 flex-1">
          <span className="absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 bg-(--timeline-accent)" />
          {fractions.map((fraction) => (
            <svg
              key={fraction}
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `calc(6px + (100% - 12px) * ${fraction})` }}
            >
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                rx="1.2"
                transform="rotate(45 8 8)"
                style={{
                  fill: "var(--timeline-lane, var(--background))",
                  stroke: "var(--timeline-accent)",
                  strokeWidth: 1.5,
                }}
              />
            </svg>
          ))}
        </span>
      </div>
      <p
        className={cn(
          "text-[11px] leading-4",
          existing > 0 ? "text-warning" : "text-muted-foreground"
        )}
      >
        {existing > 0
          ? `Replaces the ${existing} ${property} keyframe${existing === 1 ? "" : "s"} you have now. Other motion stays.`
          : `Adds ${fractions.length} ${property} keyframes. Other motion stays.`}
      </p>
    </div>
  )
}

function AnimationChoices({
  svgContent,
  initialDuration,
  existingKeyframes,
  onApply,
}: {
  svgContent?: string
  initialDuration: number
  existingKeyframes: Partial<Record<"Rotation" | "Scale", number>>
  onApply: AnimateDialogProps["onApply"]
}) {
  const [selected, setSelected] = useState<AnimationPresetId>("spin")
  const [seconds, setSeconds] = useState(String(initialDuration))
  const [intensity, setIntensity] = useState(1)
  const [turns, setTurns] = useState(1)
  const motionAmount = selected === "spin" ? turns : intensity
  const length = Number(seconds)
  const valid = Number.isFinite(length) && length >= 0.5 && length <= 30
  const previewLength = valid ? length : initialDuration
  const preset = ANIMATION_PRESETS.find((item) => item.id === selected)!

  return (
    <>
      <div className="relative grid h-36 place-items-center overflow-hidden bg-muted/40 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]">
        <div className="scale-[1.9]">
          <MotionPresetPreview
            key={`${selected}-${previewLength}-${motionAmount}`}
            preset={selected}
            svgContent={svgContent}
            duration={previewLength}
            intensity={motionAmount}
          />
        </div>
      </div>

      <div className="grid gap-4 p-5">
        <div>
          <DialogTitle className="text-base font-semibold">
            Motion presets
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            Animates the whole icon from the start of the timeline to the end.
          </DialogDescription>
        </div>

        <div className="grid grid-cols-3 gap-2" aria-label="Motion presets">
          {ANIMATION_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === item.id}
              aria-label={item.name}
              onClick={() => setSelected(item.id)}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background py-2.5 text-xs font-medium transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-foreground/60 aria-pressed:bg-muted"
            >
              <MotionPresetPreview
                preset={item.id}
                svgContent={svgContent}
                duration={2}
                intensity={1}
              />
              {item.name}
              <span className="text-[10px] font-normal text-muted-foreground">
                {item.property}
              </span>
            </button>
          ))}
        </div>

        <p className="-mt-1 text-xs text-muted-foreground">
          {preset.description}
        </p>

        <ResultPreview
          property={preset.property}
          fractions={preset.keyframeFractions}
          length={previewLength}
          existing={existingKeyframes[preset.property] ?? 0}
        />

        <div className="grid gap-2">
          <span className="text-xs font-medium">Timeline length</span>
          <div className="flex items-center gap-2">
            <Segmented
              label="Motion length"
              options={LENGTHS.map((value) => ({ label: `${value}s`, value }))}
              value={LENGTHS.includes(length) ? length : null}
              onChange={(value) => setSeconds(String(value))}
            />
            <label
              className={cn(
                "flex h-9 w-20 shrink-0 items-center rounded-lg border bg-background pr-2 focus-within:border-ring",
                valid ? "border-border" : "border-destructive"
              )}
            >
              <input
                aria-label="Motion duration"
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={seconds}
                onChange={(event) => setSeconds(event.target.value)}
                className="w-full min-w-0 bg-transparent px-2 text-right text-sm tabular-nums outline-none"
              />
              <span className="text-xs text-muted-foreground">s</span>
            </label>
          </div>
          {!valid && (
            <p role="alert" className="text-xs text-destructive">
              Choose a length between 0.5 and 30 seconds.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium">
            {selected === "spin" ? "Turns" : "Amount"}
          </span>
          <Segmented
            label={selected === "spin" ? "Spin turns" : "Motion amount"}
            options={
              selected === "spin"
                ? [1, 2, 3].map((value) => ({ label: String(value), value }))
                : AMOUNTS
            }
            value={motionAmount}
            onChange={selected === "spin" ? setTurns : setIntensity}
          />
          {selected !== "spin" && (
            <input
              aria-label="Motion intensity"
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="sr-only"
            />
          )}
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={() => onApply(selected, length, motionAmount)}
          className="min-h-11 rounded-lg bg-foreground text-sm font-medium text-background transition-[opacity,transform] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99] disabled:opacity-40"
        >
          Apply {preset.name} to {preset.property}
        </button>
      </div>
    </>
  )
}
