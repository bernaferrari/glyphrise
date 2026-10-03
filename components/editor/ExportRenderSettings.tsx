"use client"

import { EXPORT_SIZE_PRESETS, type ExportSettings } from "./ExportSettingsModel"
import type { VideoContainer } from "../3d/SvgTypes"

const fieldClass =
  "mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-ring"

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
  return (
    <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-60">
      <div>
        <p className="mb-2 text-xs font-medium">Output size</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXPORT_SIZE_PRESETS.map((preset) => (
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
              className="flex min-h-14 flex-col items-start justify-center gap-1 rounded-lg border border-border px-3 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary/50 aria-pressed:bg-primary/5"
            >
              <span className="font-medium">{preset.label}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {preset.width} × {preset.height}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <Choice
          label="Background"
          value={settings.backgroundMode}
          options={[
            { value: "transparent", label: "Transparent" },
            { value: "color", label: "Solid color" },
          ]}
          onChange={(backgroundMode) => onChange({ backgroundMode })}
        />
        {settings.backgroundMode === "color" && (
          <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-xs">
            Color
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(event) =>
                onChange({ backgroundColor: event.target.value })
              }
              className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
        )}
      </div>
      {video && (
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
      <details className="rounded-xl border border-border bg-muted/20 px-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          More settings
        </summary>
        <div className="grid gap-3 pb-3">
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
    <div className="grid min-w-0 gap-1.5 text-xs font-medium">
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
            className="min-h-9 flex-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
