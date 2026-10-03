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

export type AnimateDialogProps = {
  svgContent?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  duration: number
  onApply: (id: AnimationPresetId, duration: number, intensity: number) => void
}

const LENGTHS = [1, 2, 3, 5]
const AMOUNTS = [
  { label: "Subtle", value: 0.5 },
  { label: "Normal", value: 1 },
  { label: "Strong", value: 1.75 },
]

export function AnimateDialog({
  svgContent,
  open,
  onOpenChange,
  duration,
  onApply,
}: AnimateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="editor-scrollbar max-h-[calc(100dvh-32px)] gap-0 overflow-y-auto p-0 sm:max-w-md">
        {open && (
          <AnimationChoices
            svgContent={svgContent}
            initialDuration={duration}
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
          className="min-h-9 flex-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function AnimationChoices({
  svgContent,
  initialDuration,
  onApply,
}: {
  svgContent?: string
  initialDuration: number
  onApply: AnimateDialogProps["onApply"]
}) {
  const [selected, setSelected] = useState<AnimationPresetId>("spin")
  const [seconds, setSeconds] = useState(String(initialDuration))
  const [intensity, setIntensity] = useState(1)
  const length = Number(seconds)
  const valid = Number.isFinite(length) && length >= 0.5 && length <= 30
  const previewLength = valid ? length : initialDuration
  const preset = ANIMATION_PRESETS.find((item) => item.id === selected)!

  return (
    <>
      {/* Stage: the selected motion, playing on the user's own icon. */}
      <div className="relative grid h-44 place-items-center overflow-hidden bg-muted/40 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]">
        <div className="scale-[2.2]">
          <MotionPresetPreview
            key={`${selected}-${previewLength}-${intensity}`}
            preset={selected}
            svgContent={svgContent}
            duration={previewLength}
            intensity={intensity}
          />
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground tabular-nums backdrop-blur">
          {preset.name} · {previewLength}s loop
        </span>
      </div>

      <div className="grid gap-5 p-5">
        <div>
          <DialogTitle className="text-base font-semibold">
            Add motion
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            {preset.description}
          </DialogDescription>
        </div>

        <div className="grid grid-cols-3 gap-2" aria-label="Motion presets">
          {ANIMATION_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === item.id}
              onClick={() => setSelected(item.id)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-xs font-medium transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-foreground/60 aria-pressed:bg-muted"
            >
              <MotionPresetPreview
                preset={item.id}
                svgContent={svgContent}
                duration={2}
                intensity={1}
              />
              {item.name}
            </button>
          ))}
        </div>

        <div className="grid gap-2">
          <span className="text-xs font-medium">Length</span>
          <div className="flex items-center gap-2">
            <Segmented
              label="Motion length"
              options={LENGTHS.map((value) => ({ label: `${value}s`, value }))}
              value={LENGTHS.includes(length) ? length : null}
              onChange={(value) => setSeconds(String(value))}
            />
            <label
              className={cn(
                "flex h-10 w-20 shrink-0 items-center rounded-lg border bg-background pr-2 focus-within:border-ring",
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
          <span className="text-xs font-medium">Amount</span>
          <Segmented
            label="Motion amount"
            options={AMOUNTS}
            value={
              AMOUNTS.some((a) => a.value === intensity) ? intensity : null
            }
            onChange={setIntensity}
          />
          {/* Fine control for keyboard and precise values. */}
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
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            disabled={!valid}
            onClick={() => onApply(selected, length, intensity)}
            className="min-h-11 rounded-lg bg-foreground text-sm font-medium text-background transition-[opacity,transform] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99] disabled:opacity-40"
          >
            Apply {preset.name}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            Replaces only {preset.property.toLowerCase()} motion · Undo anytime
          </p>
        </div>
      </div>
    </>
  )
}
