"use client"

import * as React from "react"
import { Check, Shuffle } from "lucide-react"
import { GRADIENT_PRESETS, type GradientPreset } from "./color-gradient-presets"
import { type GradientType } from "./color-gradient-mode-toggle"
import { gradientPreviewCss, hexToHsv } from "./color-picker-utils"
import { MeshPreviewCanvas } from "./color-mesh-preview"
import type { EditableColorStop } from "./color-stop-model"

interface ColorGradientPresetsPanelProps {
  gradientType: GradientType
  stops: EditableColorStop[]
  onPresetSelect: (preset: GradientPreset) => void
  onRemixMesh: () => void
  onHuePointerDown: (event: React.PointerEvent) => void
  onHueStep: () => void
  hueScrubbing: boolean
}

const headerButtonClass =
  "grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring/35 focus:outline-none"

const HUE_WHEEL = `conic-gradient(${[0, 60, 120, 180, 240, 300, 360]
  .map((hue) => `hsl(${hue} 90% 60%)`)
  .join(", ")})`

const DOT_RADIUS = 7.5

/**
 * A tiny color-harmony wheel: every color in the gradient sits as a dot at
 * its hue. Shifting the hue turns the whole constellation together, so the
 * dial always shows the colors on screen.
 */
function HueDial({
  stops,
  scrubbing,
}: {
  stops: EditableColorStop[]
  scrubbing: boolean
}) {
  const dots = React.useMemo(() => {
    const seen = new Set<string>()
    return stops.flatMap((stop) => {
      const color = stop.color.toLowerCase()
      const hsv = hexToHsv(color)
      if (hsv.s < 8 || seen.has(color)) return []
      seen.add(color)
      return [{ color, hue: hsv.h }]
    })
  }, [stops])

  // Dots sit relative to the first one; only the group turns. A hue shift
  // keeps their spacing, so it reads as one smooth spin.
  const anchor = dots[0]?.hue ?? 0
  // Keep the angle continuous so 350° → 10° turns forward, not all the way back.
  const [angle, setAngle] = React.useState(anchor)
  const [shownAnchor, setShownAnchor] = React.useState(anchor)
  if (anchor !== shownAnchor) {
    setShownAnchor(anchor)
    setAngle(angle + ((((anchor - shownAnchor) % 360) + 540) % 360) - 180)
  }

  return (
    <span
      aria-hidden="true"
      data-scrubbing={scrubbing || undefined}
      className="relative size-5 rounded-full transition-[scale] duration-150 ease-out group-hover/hue:scale-110 data-scrubbing:scale-125"
    >
      <span
        className="absolute inset-0 rounded-full opacity-45 [mask:radial-gradient(circle,transparent_8px,black_8.5px)]"
        style={{ background: HUE_WHEEL }}
      />
      <span
        data-scrubbing={scrubbing || undefined}
        className="absolute inset-0 transition-[rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-scrubbing:duration-0"
        style={{ rotate: `${angle}deg` }}
      >
        {dots.map(({ color, hue }) => {
          const theta = ((hue - anchor) * Math.PI) / 180
          return (
            <span
              key={color}
              className="absolute top-1/2 left-1/2 size-[5px] rounded-full shadow-[0_0_0_1px_rgb(0_0_0/0.45)]"
              style={{
                backgroundColor: color,
                translate: `calc(-50% + ${Math.sin(theta) * DOT_RADIUS}px) calc(-50% - ${Math.cos(theta) * DOT_RADIUS}px)`,
              }}
            />
          )
        })}
      </span>
    </span>
  )
}

const samePoint = (a?: number, b?: number) =>
  Math.abs((a ?? 0) - (b ?? 0)) < 1e-3

export function ColorGradientPresetsPanel({
  gradientType,
  stops,
  onPresetSelect,
  onRemixMesh,
  onHuePointerDown,
  onHueStep,
  hueScrubbing,
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
            title="Shift hue — click to spin, drag around to turn"
            aria-label="Shift gradient hue"
            className={`${headerButtonClass} group/hue cursor-grab touch-none active:cursor-grabbing`}
            onPointerDown={onHuePointerDown}
            onClick={(event) => {
              event.stopPropagation()
              // Pointer taps are handled on pointerdown; this is the keyboard path.
              if (event.detail === 0) onHueStep()
            }}
          >
            <HueDial stops={stops} scrubbing={hueScrubbing} />
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
