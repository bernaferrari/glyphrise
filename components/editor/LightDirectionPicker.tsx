"use client"

import { useRef } from "react"
import type { PointerEvent, ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { CompactColorInput } from "@/components/ui/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { bindWindowPointerDrag } from "@/lib/drag-events"
import { NumberField } from "./NumberField"
import { usePropertyEditScope } from "./PropertyEditScope"

const LIGHT_RANGE = 9

const clampNumber = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export function LightDirectionPicker({
  position,
  color,
  softness,
  onDirectionChange,
  onColorChange,
  onSoftnessChange,
  isKeyed,
  onToggleKeyframe,
  keyframeControls,
}: {
  position: { x: number; y: number; z: number }
  color: string
  softness: number
  onDirectionChange: (x: number, y: number) => void
  onColorChange: (color: string) => void
  onSoftnessChange: (value: number) => void
  isKeyed: boolean
  onToggleKeyframe: () => void
  keyframeControls?: ReactNode
}) {
  const padRef = useRef<HTMLDivElement>(null)
  const scope = usePropertyEditScope("Light direction")
  const nx = clampNumber(position.x / LIGHT_RANGE, -1, 1)
  const ny = clampNumber(position.y / LIGHT_RANGE, -1, 1)
  const hx = 50 + nx * 42
  const hy = 50 - ny * 42

  const setFromPointer = (clientX: number, clientY: number) => {
    const rect = padRef.current?.getBoundingClientRect()
    if (!rect) return
    let px = ((clientX - rect.left) / rect.width) * 2 - 1
    let py = -(((clientY - rect.top) / rect.height) * 2 - 1)
    const len = Math.hypot(px, py)
    if (len > 1) {
      px /= len
      py /= len
    }
    onDirectionChange(
      Number((px * LIGHT_RANGE).toFixed(2)),
      Number((py * LIGHT_RANGE).toFixed(2))
    )
  }

  const handlePadDown = (e: PointerEvent) => {
    e.preventDefault()
    setFromPointer(e.clientX, e.clientY)
    bindWindowPointerDrag({
      documentEdit: true,
      onMove: (ev) => setFromPointer(ev.clientX, ev.clientY),
    })
  }

  const triggerSphere = `radial-gradient(circle at ${hx}% ${hy}%, var(--color-light-highlight) 0%, ${color} 32%, var(--color-light-trigger-edge) 72%, var(--color-light-trigger-shadow) 100%)`

  const horizontal = nx < -0.15 ? "Left" : nx > 0.15 ? "Right" : ""
  const vertical = ny > 0.15 ? "Top" : ny < -0.15 ? "Bottom" : ""
  const directionLabel =
    [vertical, horizontal].filter(Boolean).join(" ") || "Center"

  return (
    <Popover>
      <PopoverTrigger
        title="Light direction & color"
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border-0 bg-muted/80 pr-2 pl-2 text-left text-foreground transition-colors hover:bg-foreground/[0.09] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/30"
      >
        <span className="relative size-5 shrink-0 overflow-hidden rounded-full border border-border bg-background/50 dark:bg-background/30">
          <span
            className="absolute inset-0.5 rounded-full shadow-color-stop-gloss bg-preview"
            style={
              { "--preview-background": triggerSphere } as React.CSSProperties
            }
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs">
          {directionLabel}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground/70" />
      </PopoverTrigger>
      <PopoverContent
        density="spacious"
        variant="editor"
        align="end"
        sideOffset={6}
        className="w-60"
      >
        <div className="flex items-center justify-between">
          <span className="text-2xs font-medium tracking-section text-muted-foreground uppercase">
            Light Source
          </span>
          {keyframeControls ?? (
            <button
              type="button"
              aria-label={`${isKeyed ? "Remove" : "Add"} light keyframe`}
              title={`${isKeyed ? "Remove" : "Add"} light keyframe`}
              onClick={onToggleKeyframe}
              className={`flex size-5 items-center justify-center rounded border transition-colors ${
                isKeyed
                  ? "border-ring/50 bg-accent"
                  : "border-border bg-muted/45 hover:bg-muted/60"
              }`}
            >
              <span
                className="size-2 rotate-45 border border-ring/50 bg-(--swatch-color)"
                style={
                  {
                    "--swatch-color": isKeyed
                      ? "var(--color-light-keyframe)"
                      : "transparent",
                  } as React.CSSProperties
                }
              />
            </button>
          )}
        </div>

        {scope && <span className="sr-only">{scope.label}</span>}
        <div className="mt-2.5 aspect-square w-full rounded-full bg-border p-px shadow-inner">
          <div
            ref={padRef}
            onPointerDown={handlePadDown}
            className="relative size-full cursor-grab touch-none overflow-hidden rounded-full bg-preview active:cursor-grabbing"
            style={
              {
                "--preview-background": `radial-gradient(circle at ${hx}% ${hy}%, var(--color-light-highlight) 0%, ${color} 24%, var(--color-light-pad-edge) 68%, var(--color-light-pad-shadow) 100%)`,
              } as React.CSSProperties
            }
          >
            <span
              className="pointer-events-none absolute top-(--position-y) left-(--position-x) size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-light-source ring-1 ring-black/40"
              style={
                {
                  "--position-x": `${hx}%`,
                  "--position-y": `${hy}%`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
        <p className="mt-2 text-center text-2xs text-muted-foreground">
          Drag to move the light
        </p>

        <div className="mt-2.5">
          <CompactColorInput
            value={color}
            onChange={onColorChange}
            ariaLabel="Light color"
            side="top"
            align="end"
            className="w-full"
          />
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="w-14 shrink-0 text-2xs font-medium text-muted-foreground">
            Softbox
          </span>
          <span className="flex-1" />
          <NumberField
            value={softness}
            min={0}
            max={1}
            step={0.05}
            precision={2}
            ariaLabel="Light softness"
            onChange={onSoftnessChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
