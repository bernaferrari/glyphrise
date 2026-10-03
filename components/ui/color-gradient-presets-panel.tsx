"use client"

import { Check, Move, Shuffle } from "lucide-react"
import { GRADIENT_PRESETS, type GradientPreset } from "./color-gradient-presets"
import { type GradientType } from "./color-gradient-mode-toggle"
import { gradientPreviewCss } from "./color-picker-utils"
import type { EditableColorStop } from "./color-stop-model"

interface ColorGradientPresetsPanelProps {
  gradientType: GradientType
  stops: EditableColorStop[]
  onPresetSelect: (preset: GradientPreset) => void
  onShuffleMeshColors: () => void
  onShuffleMeshPoints: () => void
}

export function ColorGradientPresetsPanel({
  gradientType,
  stops,
  onPresetSelect,
  onShuffleMeshColors,
  onShuffleMeshPoints,
}: ColorGradientPresetsPanelProps) {
  return (
    <div className="space-y-1.5 px-2">
      <div className="flex h-6 items-center justify-between">
        <div className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Presets
        </div>
        {gradientType === "mesh" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Shuffle mesh point positions"
              aria-label="Shuffle mesh point positions"
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring/35 focus:outline-none"
              onClick={(event) => {
                event.stopPropagation()
                onShuffleMeshPoints()
              }}
            >
              <Move className="size-3.5" />
            </button>
            <button
              type="button"
              title="Shuffle mesh colors"
              aria-label="Shuffle mesh colors"
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring/35 focus:outline-none"
              onClick={(event) => {
                event.stopPropagation()
                onShuffleMeshColors()
              }}
            >
              <Shuffle className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {GRADIENT_PRESETS.map((preset) => {
          const selected =
            gradientType === preset.type &&
            stops.length === preset.stops.length &&
            stops.every(
              (stop, index) =>
                stop.color.toLowerCase() ===
                  preset.stops[index].color.toLowerCase() &&
                stop.position === preset.stops[index].position
            )
          return (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`Use ${preset.name} gradient`}
              aria-pressed={selected}
              className="group relative flex h-11 min-w-0 items-center justify-center rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.stopPropagation()
                onPresetSelect(preset)
              }}
            >
              <span
                className="pointer-events-none block h-full w-full rounded-lg transition-opacity group-hover:opacity-85"
                style={{
                  background: gradientPreviewCss(preset.type, preset.stops),
                }}
              />
              {selected && (
                <span className="pointer-events-none absolute top-1.5 right-1 grid size-4 place-items-center rounded-full bg-white text-black">
                  <Check aria-hidden="true" className="size-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
