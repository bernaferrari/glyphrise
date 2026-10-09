"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
  /** Keyframes each target property already has, keyed by property name. */
  existingKeyframes?: Partial<Record<"Rotation" | "Scale", number>>
  onApply: (id: AnimationPresetId, duration: number, intensity: number) => void
}

const MIN_LENGTH = 0.5
const MAX_LENGTH = 30
const AMOUNTS = [
  { label: "Subtle", value: 0.5 },
  { label: "Normal", value: 1 },
  { label: "Strong", value: 1.75 },
]
const TURNS = [1, 2, 3].map((value) => ({ label: `${value}×`, value }))

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
      <DialogContent
        scrollable={true}
        variant="flush"
        className="max-h-(--spacing-dialog-height) overflow-y-auto sm:max-w-sm"
      >
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
      className="flex w-44 rounded-lg bg-muted p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="h-7 flex-1 rounded-md text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function LengthStepper({
  value,
  valid,
  onChange,
}: {
  value: string
  valid: boolean
  onChange: (value: string) => void
}) {
  const step = (delta: number) => {
    const current = Number(value)
    const base = Number.isFinite(current) ? current : 2
    const next = Math.round((base + delta) * 2) / 2
    onChange(String(Math.max(MIN_LENGTH, Math.min(MAX_LENGTH, next))))
  }
  const stepButton =
    "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40 disabled:hover:bg-transparent"
  return (
    <div
      className={cn(
        "flex w-44 items-center rounded-lg bg-muted p-0.5",
        !valid && "ring-1 ring-destructive"
      )}
    >
      <button
        type="button"
        aria-label="Shorter"
        disabled={Number(value) <= MIN_LENGTH}
        onClick={() => step(-0.5)}
        className={stepButton}
      >
        <Minus className="size-3.5" />
      </button>
      <label className="flex flex-1 items-baseline justify-center gap-0.5 text-xs font-medium tabular-nums">
        <input
          aria-label="Motion duration"
          aria-invalid={!valid}
          type="number"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          step="0.5"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={
            {
              "--field-width": `${Math.max(1, value.length) + 0.25}ch`,
            } as React.CSSProperties
          }
          className="w-(--field-width) no-spinner bg-transparent text-center outline-none"
        />
        <span className="text-muted-foreground">s</span>
      </label>
      <button
        type="button"
        aria-label="Longer"
        disabled={Number(value) >= MAX_LENGTH}
        onClick={() => step(0.5)}
        className={stepButton}
      >
        <Plus className="size-3.5" />
      </button>
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
  const isSpin = selected === "spin"
  const motionAmount = isSpin ? turns : intensity
  const length = Number(seconds)
  const valid =
    Number.isFinite(length) && length >= MIN_LENGTH && length <= MAX_LENGTH
  const previewLength = valid ? length : initialDuration
  const preset = ANIMATION_PRESETS.find((item) => item.id === selected)!
  const existing = existingKeyframes[preset.property] ?? 0

  return (
    <div className="grid gap-5 p-5">
      <div className="pr-8">
        <DialogTitle variant="preset">Animate</DialogTitle>
        <DialogDescription variant="compact" className="mt-0.5">
          {preset.description}
        </DialogDescription>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Motion presets">
        {ANIMATION_PRESETS.map((item) => {
          const active = selected === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              aria-label={item.name}
              onClick={() => setSelected(item.id)}
              className="group grid justify-items-center rounded-2xl bg-muted/50 pb-2.5 text-xs font-medium text-muted-foreground ring-1 ring-transparent transition-[background-color,color,box-shadow] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground aria-pressed:ring-foreground/25"
            >
              <span className="grid aspect-square w-full place-items-center">
                <MotionPresetPreview
                  key={active ? `${previewLength}-${motionAmount}` : "idle"}
                  preset={item.id}
                  svgContent={svgContent}
                  size="lg"
                  duration={active ? previewLength : 2}
                  intensity={active ? motionAmount : 1}
                  className="animation-paused group-hover:animation-running group-aria-pressed:animation-running"
                />
              </span>
              {item.name}
            </button>
          )
        })}
      </div>

      <div className="grid divide-y divide-border rounded-xl border border-border">
        <div className="flex h-12 items-center justify-between gap-3 px-3">
          <span className="text-xs font-medium">Length</span>
          <LengthStepper value={seconds} valid={valid} onChange={setSeconds} />
        </div>
        <div className="flex h-12 items-center justify-between gap-3 px-3">
          <span className="text-xs font-medium">
            {isSpin ? "Turns" : "Amount"}
          </span>
          <Segmented
            label={isSpin ? "Spin turns" : "Motion amount"}
            options={isSpin ? TURNS : AMOUNTS}
            value={motionAmount}
            onChange={isSpin ? setTurns : setIntensity}
          />
        </div>
      </div>

      <div className="grid gap-2.5">
        <Button
          shape="rounded"
          disabled={!valid}
          onClick={() => onApply(selected, length, motionAmount)}
          className="h-11"
        >
          Apply {preset.name}
        </Button>
        <p className="text-center text-2xs text-muted-foreground">
          {existing > 0
            ? `Replaces your ${existing} ${preset.property.toLowerCase()} keyframe${existing === 1 ? "" : "s"}`
            : `Adds ${preset.keyframeFractions.length} ${preset.property.toLowerCase()} keyframes`}
          {" · "}
          {valid
            ? `0–${Number(length.toFixed(2))}s`
            : `${MIN_LENGTH}–${MAX_LENGTH}s only`}
        </p>
      </div>
    </div>
  )
}
