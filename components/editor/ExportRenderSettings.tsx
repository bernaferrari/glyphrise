"use client"

import { EXPORT_SIZE_PRESETS, type ExportSettings } from "./ExportSettingsModel"
import type { VideoContainer } from "../3d/SvgTypes"

const fieldClass =
  "mt-1 h-9 w-full rounded-md bg-muted/80 px-2.5 text-sm text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-ring"

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
    <fieldset disabled={disabled} className="grid gap-5 disabled:opacity-60">
      <div>
        <p className="mb-2 text-xs font-medium">Output size</p>
        <div className="grid grid-cols-4 gap-2">
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
                className="group flex flex-col items-center gap-1.5 rounded-lg p-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"
              >
                <span className="grid size-8 place-items-center">
                  {/* The ratio itself, drawn to scale. */}
                  <span
                    aria-hidden="true"
                    className="rounded-[3px] border-[1.5px] border-current opacity-60 group-aria-pressed:border-(--timeline-accent) group-aria-pressed:bg-(--timeline-accent)/15 group-aria-pressed:opacity-100"
                    style={{
                      width: ratio >= 1 ? 28 : 28 * ratio,
                      height: ratio >= 1 ? 28 / ratio : 28,
                    }}
                  />
                </span>
                <span className="font-medium">{preset.label}</span>
                <span className="-mt-1 text-[10px] tabular-nums opacity-70">
                  {preset.width}×{preset.height}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div
        className={`grid items-end gap-2 ${settings.backgroundMode === "color" ? "grid-cols-[minmax(0,1fr)_auto]" : ""}`}
      >
        <Choice
          label="Background"
          value={settings.backgroundMode}
          options={
            video
              ? [{ value: "color", label: "Solid color" }]
              : [
                  { value: "transparent", label: "Transparent" },
                  { value: "color", label: "Solid color" },
                ]
          }
          onChange={(backgroundMode) => onChange({ backgroundMode })}
        />
        {settings.backgroundMode === "color" && (
          <label className="flex h-9 items-center gap-2 rounded-lg bg-muted px-2.5 text-xs">
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
        <p className="text-xs text-muted-foreground">
          Video uses a solid background. Choose PNG for transparency.
        </p>
      )}
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
      <details className="text-xs">
        <summary className="flex min-h-8 w-fit cursor-pointer items-center rounded-md px-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          More settings
        </summary>
        <div className="grid gap-3 pt-2">
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
            className="min-h-8 flex-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
