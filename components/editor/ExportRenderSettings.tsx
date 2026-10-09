"use client"

import { cn } from "@/lib/utils"
import { ColorPicker } from "@/components/ui/color-picker"
import { EXPORT_SIZE_PRESETS, type ExportSettings } from "./ExportSettingsModel"
import type { VideoContainer } from "../3d/SvgTypes"
import { FRAME_SHEET_GRIDS, frameSheetLayout } from "./ExportFrameSheet"

/** Backgrounds people actually pick, plus any color. */
const BACKGROUND_SWATCHES = [
  { color: "#17151f", label: "Ink" },
  { color: "#ffffff", label: "White" },
  { color: "#000000", label: "Black" },
]

function Section({
  label,
  value,
  children,
}: {
  label: string
  value?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <h3 className="font-medium text-foreground">{label}</h3>
        {value ? (
          <span className="text-muted-foreground tabular-nums">{value}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function SizeField({
  label,
  short,
  value,
  invalid,
  onChange,
}: {
  label: string
  short: string
  value: number
  invalid: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg bg-muted/70 px-3 text-xs focus-within:ring-2 focus-within:ring-ring/40">
      <span aria-hidden="true" className="font-medium text-muted-foreground">
        {short}
      </span>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid || undefined}
        min={64}
        max={4096}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-1 bg-transparent text-base text-foreground tabular-nums outline-none aria-invalid:text-destructive md:text-xs"
      />
      <span aria-hidden="true" className="text-muted-foreground">
        px
      </span>
    </label>
  )
}

export function ExportRenderSettings({
  settings,
  formats,
  video,
  disabled,
  invalidSize,
  onChange,
}: {
  settings: ExportSettings
  formats: VideoContainer[]
  video: boolean
  disabled: boolean
  invalidSize: boolean
  onChange: (patch: Partial<ExportSettings>) => void
}) {
  const transparent = settings.backgroundMode === "transparent"
  const sheet = frameSheetLayout(settings.frameGrid, settings)
  const swatchClass =
    "relative size-8 shrink-0 rounded-full inset-ring inset-ring-foreground/15 transition-[box-shadow,transform] outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover"

  return (
    <fieldset disabled={disabled} className="grid gap-6 disabled:opacity-60">
      {!video && (
        <Choice
          label="Frames"
          detail={
            settings.frameGrid === 1
              ? undefined
              : `${sheet.count} frames · ${sheet.cellWidth} × ${sheet.cellHeight} px each`
          }
          value={settings.frameGrid}
          options={FRAME_SHEET_GRIDS.map((grid) => ({
            value: grid,
            label: grid === 1 ? "Still" : `${grid} × ${grid}`,
          }))}
          onChange={(frameGrid) => onChange({ frameGrid })}
        >
          {settings.frameGrid !== 1 && (
            <p className="text-xs text-muted-foreground">
              Evenly spaced through one loop. Use it as a poster, or as a sprite
              sheet.
            </p>
          )}
        </Choice>
      )}

      <Section label="Size">
        <div
          role="group"
          aria-label="Aspect ratio"
          className="grid grid-cols-4 gap-1.5"
        >
          {EXPORT_SIZE_PRESETS.map((preset) => {
            const ratio = preset.width / preset.height
            return (
              <button
                key={preset.id}
                type="button"
                aria-label={`${preset.label} ${preset.ratio}`}
                title={preset.label}
                aria-pressed={
                  settings.width === preset.width &&
                  settings.height === preset.height
                }
                onClick={() =>
                  onChange({ width: preset.width, height: preset.height })
                }
                className="group flex flex-col items-center gap-1.5 rounded-lg border border-border px-1 pt-2.5 pb-2 text-foreground transition-[background-color,border-color,box-shadow] hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary/[0.08]"
              >
                <span
                  aria-hidden="true"
                  className="grid size-6 place-items-center"
                >
                  <span
                    className="h-(--element-height) w-(--element-width) rounded border-2 border-muted-foreground/50 transition-colors group-aria-pressed:border-primary group-aria-pressed:bg-primary/20"
                    style={
                      {
                        "--element-width": `${ratio >= 1 ? 100 : 100 * ratio}%`,
                        "--element-height": `${ratio >= 1 ? 100 / ratio : 100}%`,
                      } as React.CSSProperties
                    }
                  />
                </span>
                <span className="text-xs font-medium tabular-nums">
                  {preset.ratio}
                </span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SizeField
            label="Width"
            short="W"
            value={settings.width}
            invalid={invalidSize}
            onChange={(width) => onChange({ width })}
          />
          <SizeField
            label="Height"
            short="H"
            value={settings.height}
            invalid={invalidSize}
            onChange={(height) => onChange({ height })}
          />
        </div>
        {invalidSize ? (
          <p role="alert" className="text-xs text-destructive">
            Use a width and height between 64 and 4096 px.
          </p>
        ) : null}
      </Section>

      <Section
        label="Background"
        value={
          transparent ? "Transparent" : settings.backgroundColor.toUpperCase()
        }
      >
        <div className="flex flex-wrap items-center gap-2.5 px-0.5">
          {!video && (
            <button
              type="button"
              aria-label="Transparent background"
              aria-pressed={transparent}
              onClick={() => onChange({ backgroundMode: "transparent" })}
              className={cn(swatchClass, "bg-checkerboard")}
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
              className={cn(
                swatchClass,
                "[background:var(--preview-background)]"
              )}
              style={
                { "--preview-background": swatch.color } as React.CSSProperties
              }
            />
          ))}
          <ColorPicker
            aria-label="Custom background color"
            variant="swatch"
            selected={
              !transparent &&
              !BACKGROUND_SWATCHES.some(
                (swatch) =>
                  swatch.color === settings.backgroundColor.toLowerCase()
              )
            }
            value={settings.backgroundColor}
            onChange={(backgroundColor) =>
              onChange({ backgroundMode: "color", backgroundColor })
            }
          />
        </div>
        {video && (
          <p className="text-xs text-muted-foreground">
            Videos can’t be transparent. Use Image for a cutout.
          </p>
        )}
      </Section>

      {video && (
        <>
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
            label="Quality"
            value={settings.videoBitsPerSecond}
            options={[
              { value: 4_000_000, label: "Standard" },
              { value: 8_000_000, label: "High" },
              { value: 16_000_000, label: "Max" },
            ]}
            onChange={(videoBitsPerSecond) => onChange({ videoBitsPerSecond })}
          />
          {formats.length > 1 && (
            <Choice
              label="File type"
              value={settings.container}
              options={formats.map((format) => ({
                value: format,
                label: format.toUpperCase(),
              }))}
              onChange={(container) => onChange({ container })}
            />
          )}
        </>
      )}
    </fieldset>
  )
}

/** Small option sets read better as segmented choices than dropdowns. */
function Choice<T extends string | number>({
  label,
  detail,
  value,
  options,
  onChange,
  children,
}: {
  label: string
  detail?: React.ReactNode
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (value: T) => void
  children?: React.ReactNode
}) {
  return (
    <Section label={label} value={detail}>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded-lg bg-muted/70 p-0.5"
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
      {children}
    </Section>
  )
}
