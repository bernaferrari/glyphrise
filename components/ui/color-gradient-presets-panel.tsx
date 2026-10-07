"use client"

import { Check, Shuffle } from "lucide-react"
import { GRADIENT_PRESETS, type GradientPreset } from "./color-gradient-presets"
import { type GradientType } from "./color-gradient-mode-toggle"
import { gradientPreviewCss } from "./color-picker-utils"
import { MeshPreviewCanvas } from "./color-mesh-preview"
import type { EditableColorStop } from "./color-stop-model"

interface ColorGradientPresetsPanelProps {
  gradientType: GradientType
  stops: EditableColorStop[]
  onPresetSelect: (preset: GradientPreset) => void
  onRemixMesh: () => void
  onHuePointerDown: (event: React.PointerEvent) => void
  onHueStep: () => void
}

const headerButtonClass =
  "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring/35 focus:outline-none"

const samePoint = (a?: number, b?: number) =>
  Math.abs((a ?? 0) - (b ?? 0)) < 1e-3

export function ColorGradientPresetsPanel({
  gradientType,
  stops,
  onPresetSelect,
  onRemixMesh,
  onHuePointerDown,
  onHueStep,
}: ColorGradientPresetsPanelProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-6 items-center justify-between">
        <div className="text-2xs font-medium tracking-widest text-muted-foreground uppercase">
          Presets
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Shift hue — click to spin, drag to scrub"
            aria-label="Shift gradient hue"
            className={`${headerButtonClass} group/hue cursor-ew-resize touch-none`}
            onPointerDown={onHuePointerDown}
            onClick={(event) => {
              event.stopPropagation()
              // Pointer taps are handled on pointerdown; this is the keyboard path.
              if (event.detail === 0) onHueStep()
            }}
          >
            <span
              aria-hidden="true"
              className="size-3.5 rounded-full bg-[conic-gradient(#ff4d4d,#ffd84d,#4dff88,#4dd8ff,#7a4dff,#ff4dd8,#ff4d4d)] ring-1 ring-foreground/15 transition-transform duration-300 ease-out group-hover/hue:rotate-90 group-active/hue:scale-90"
            />
          </button>
          {gradientType === "mesh" && (
            <button
              type="button"
              title="Remix colors and layout"
              aria-label="Remix mesh colors and layout"
              className={`${headerButtonClass} group/remix`}
              onClick={(event) => {
                event.stopPropagation()
                onRemixMesh()
              }}
            >
              <Shuffle className="size-3.5 transition-transform duration-200 ease-out group-active/remix:scale-90" />
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {GRADIENT_PRESETS.map((preset) => {
          const selected =
            gradientType === preset.type &&
            stops.length === preset.stops.length &&
            stops.every((stop, index) => {
              const match = preset.stops[index]
              return (
                stop.color.toLowerCase() === match.color.toLowerCase() &&
                stop.position === match.position &&
                (preset.type !== "mesh" ||
                  (samePoint(stop.x, match.x) && samePoint(stop.y, match.y)))
              )
            })
          return (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`Use ${preset.name} gradient`}
              aria-pressed={selected}
              className="group relative h-10 min-w-0 rounded-lg ring-offset-2 ring-offset-popover transition-shadow duration-150 hover:ring-1 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:ring-2 aria-pressed:ring-foreground/85"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.stopPropagation()
                onPresetSelect(preset)
              }}
            >
              {preset.type === "mesh" ? (
                <MeshPreviewCanvas
                  variant="preset"
                  stops={preset.stops}
                  width={32}
                  height={20}
                  className="pointer-events-none size-full"
                />
              ) : (
                <span
                  className="pointer-events-none block size-full rounded-lg [background:var(--preview-background)]"
                  style={
                    {
                      "--preview-background": gradientPreviewCss(
                        preset.type,
                        preset.stops
                      ),
                    } as React.CSSProperties
                  }
                />
              )}
              {selected && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="grid size-5 place-items-center rounded-full bg-black/45 text-white shadow-sm backdrop-blur-sm">
                    <Check
                      aria-hidden="true"
                      className="size-3"
                      strokeWidth={3}
                    />
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
