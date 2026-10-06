"use client"

import { Check, Move, Shuffle } from "lucide-react"
import { GRADIENT_PRESETS, type GradientPreset } from "./color-gradient-presets"
import { type GradientType } from "./color-gradient-mode-toggle"
import { isWarpedMesh, meshNodePoints } from "../../lib/mesh-warp"
import { gradientPreviewCss } from "./color-picker-utils"
import { MeshPreviewCanvas } from "./color-mesh-preview"
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
    <div className="space-y-1.5">
      <div className="flex h-6 items-center justify-between">
        <div className="text-2xs font-medium tracking-label text-muted-foreground uppercase">
          Presets
        </div>
        {gradientType === "mesh" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Scatter point positions"
              aria-label="Scatter mesh point positions"
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
      <div className="grid grid-cols-4 gap-2">
        {GRADIENT_PRESETS.map((preset) => {
          const selected =
            gradientType === preset.type &&
            stops.length === preset.stops.length &&
            !(preset.type === "mesh" && isWarpedMesh(meshNodePoints(stops))) &&
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
                  className="pointer-events-none block size-full rounded-lg bg-preview"
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
