"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ANIMATION_PRESETS,
  type AnimationPresetId,
} from "./AnimationPresetModel"

export type AnimateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  duration: number
  onApply: (id: AnimationPresetId, duration: number, intensity: number) => void
}

export function AnimateDialog({
  open,
  onOpenChange,
  duration,
  onApply,
}: AnimateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-32px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Animate your icon</DialogTitle>
          <DialogDescription>
            Choose a motion, then adjust its timing. Your icon and finish stay
            yours.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AnimationChoices
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

function AnimationChoices({
  initialDuration,
  onApply,
}: {
  initialDuration: number
  onApply: AnimateDialogProps["onApply"]
}) {
  const [selected, setSelected] = useState<AnimationPresetId>("spin")
  const [seconds, setSeconds] = useState(String(initialDuration))
  const [intensity, setIntensity] = useState(1)
  const valid =
    Number.isFinite(Number(seconds)) &&
    Number(seconds) >= 0.5 &&
    Number(seconds) <= 30
  const preset = ANIMATION_PRESETS.find((item) => item.id === selected)!
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" aria-label="Motion presets">
        {ANIMATION_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
            className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/5"
          >
            <span
              className="grid h-10 w-full place-items-center [perspective:120px]"
              aria-hidden="true"
            >
              <span
                className={`motion-preview motion-preview-${item.id} grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground`}
                style={
                  {
                    animationDuration: `${valid ? seconds : initialDuration}s`,
                    "--motion-amount": intensity,
                  } as React.CSSProperties
                }
              >
                ✦
              </span>
            </span>
            {item.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{preset.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-2 text-sm">
          Duration (seconds)
          <input
            aria-label="Motion duration"
            type="number"
            min="0.5"
            max="30"
            step="0.5"
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-base"
          />
        </label>
        <label className="space-y-2 text-sm">
          Intensity{" "}
          <span className="text-muted-foreground tabular-nums">
            {Math.round(intensity * 100)}%
          </span>
          <input
            aria-label="Motion intensity"
            type="range"
            min="0.25"
            max="2"
            step="0.25"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            className="mt-2 h-11 w-full accent-primary"
          />
        </label>
      </div>
      {!valid && (
        <p role="alert" className="text-sm text-destructive">
          Enter a duration between 0.5 and 30 seconds.
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Replaces {preset.property.toLowerCase()} keyframes across the sequence.
        Other animated properties stay in place. Duration retimes the full
        sequence. You can undo this action.
      </p>
      <Button
        disabled={!valid}
        className="min-h-11 w-full"
        onClick={() => onApply(selected, Number(seconds), intensity)}
      >
        Apply {preset.name}
      </Button>
    </div>
  )
}
