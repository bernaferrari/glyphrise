"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { EXPORT_SIZE_PRESETS, type ExportSettings } from "./ExportSettingsModel"
import type { VideoContainer } from "../3d/SvgTypes"
import { ExportFormatDetails } from "./ExportFormatDetails"

const fieldClass =
  "mt-1 h-9 w-full rounded-md bg-muted/80 px-2.5 text-sm text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-ring"

const CHECKERBOARD =
  "repeating-conic-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 0 25%, transparent 0 50%) 0 0 / 8px 8px"

/** Backgrounds people actually pick, plus any color. */
const BACKGROUND_SWATCHES = [
  { color: "#17151f", label: "Ink" },
  { color: "#ffffff", label: "White" },
  { color: "#000000", label: "Black" },
]

function SectionLabel({
  children,
  value,
}: {
  children: React.ReactNode
  value?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
      <span className="font-medium text-foreground">{children}</span>
      {value ? (
        <span className="text-muted-foreground tabular-nums">{value}</span>
      ) : null}
    </div>
  )
}

export function ExportRenderSettings({
  settings,
  formats,
  video,
  disabled,
  onChange,
}: {
  settings: ExportSettings
  formats: VideoContainer[]
  video: boolean
  disabled: boolean
  onChange: (patch: Partial<ExportSettings>) => void
}) {
  const transparent = settings.backgroundMode === "transparent"
  const customColor =
    !transparent &&
    !BACKGROUND_SWATCHES.some(
      (swatch) => swatch.color === settings.backgroundColor.toLowerCase()
    )
  const swatchClass =
    "relative size-8 shrink-0 rounded-full pointer-coarse:size-11 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_14%,transparent)] transition-[box-shadow,transform] outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"

  return (
    <fieldset disabled={disabled} className="grid gap-5 disabled:opacity-60">
      <div>
        <SectionLabel value={`${settings.width} × ${settings.height}`}>
          Size
        </SectionLabel>
        <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-0.5">
          {EXPORT_SIZE_PRESETS.map((preset) => {
            const ratio = preset.width / preset.height
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={
                  settings.width === preset.width &&
                  settings.height === preset.height
                }
                onClick={() =>
                  onChange({ width: preset.width, height: preset.height })
                }
                className="group flex h-9 items-center justify-center gap-1.5 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-sm"
              >
                {/* The ratio itself, drawn to scale. */}
                <span
                  aria-hidden="true"
                  className="shrink-0 rounded-[2px] border-[1.5px] border-current opacity-50 group-aria-pressed:opacity-100 max-[380px]:hidden"
                  style={{
                    width: ratio >= 1 ? 14 : 14 * ratio,
                    height: ratio >= 1 ? 14 / ratio : 14,
                  }}
                />
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionLabel
          value={
            transparent ? "Transparent" : settings.backgroundColor.toUpperCase()
          }
        >
          Background
        </SectionLabel>
        <div className="flex flex-wrap items-center gap-2.5 px-0.5">
          {!video && (
            <button
              type="button"
              aria-label="Transparent background"
              aria-pressed={transparent}
              onClick={() => onChange({ backgroundMode: "transparent" })}
              className={swatchClass}
              style={{ background: CHECKERBOARD }}
            />
          )}
          {BACKGROUND_SWATCHES.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              aria-label={`${swatch.label} background`}
              aria-pressed={
                !transparent &&
                settings.backgroundColor.toLowerCase() === swatch.color
              }
              onClick={() =>
                onChange({
                  backgroundMode: "color",
                  backgroundColor: swatch.color,
                })
              }
              className={swatchClass}
              style={{ background: swatch.color }}
            />
          ))}
          <label
            aria-pressed={customColor}
            className={cn(swatchClass, "cursor-pointer overflow-hidden")}
            style={{
              background: customColor
                ? settings.backgroundColor
                : "conic-gradient(from 180deg, #ff5f6d, #ffc371, #47e891, #3fa9f5, #a259ff, #ff5f6d)",
            }}
          >
            <span className="sr-only">Custom background color</span>
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(event) =>
                onChange({
                  backgroundMode: "color",
                  backgroundColor: event.target.value,
                })
              }
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        {video && (
          <p className="mt-2 text-xs text-muted-foreground">
            Videos can’t be transparent. Use Image for a cutout.
          </p>
        )}
      </div>

      {video && formats.length > 1 && (
        <Choice
          label="Video format"
          value={settings.container}
          options={formats.map((format) => ({
            value: format,
            label: format.toUpperCase(),
          }))}
          onChange={(container) => onChange({ container })}
        />
      )}

      <details className="group/more text-xs">
        <summary className="flex min-h-8 w-fit cursor-pointer list-none items-center gap-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          More settings
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 transition-transform group-open/more:rotate-180"
          />
        </summary>
        <div className="grid gap-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Width
              <input
                type="number"
                min={64}
                max={4096}
                value={settings.width}
                onChange={(event) =>
                  onChange({ width: Number(event.target.value) })
                }
                className={fieldClass}
              />
            </label>
            <label className="text-xs">
              Height
              <input
                type="number"
                min={64}
                max={4096}
                value={settings.height}
                onChange={(event) =>
                  onChange({ height: Number(event.target.value) })
                }
                className={fieldClass}
              />
            </label>
          </div>
          {video && (
            <div className="grid grid-cols-2 gap-3">
              <Choice
                label="Frame rate"
                value={settings.frameRate}
                options={([24, 30, 60] as const).map((rate) => ({
                  value: rate,
                  label: `${rate} fps`,
                }))}
                onChange={(frameRate) => onChange({ frameRate })}
              />
              <Choice
                label="Video quality"
                value={settings.videoBitsPerSecond}
                options={[
                  { value: 4_000_000, label: "Standard" },
                  { value: 8_000_000, label: "High" },
                  { value: 16_000_000, label: "Max" },
                ]}
                onChange={(videoBitsPerSecond) =>
                  onChange({ videoBitsPerSecond })
                }
              />
            </div>
          )}
          <details className="group/details">
            <summary className="flex min-h-8 w-fit cursor-pointer list-none items-center gap-1 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              Format details
              <ChevronDown
                aria-hidden="true"
                className="size-3.5 transition-transform group-open/details:rotate-180"
              />
            </summary>
            <div className="pt-2">
              <ExportFormatDetails />
            </div>
          </details>
        </div>
      </details>
    </fieldset>
  )
}

/** Small option sets read better as segmented choices than dropdowns. */
function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="grid min-w-0 gap-2 text-xs font-medium">
      <span>{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded-lg bg-muted p-0.5"
      >
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
            className="min-h-8 flex-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
