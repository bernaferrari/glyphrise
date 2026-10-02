"use client"

import {
  Box,
  Check,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VideoContainer } from "../3d/SvgTypes"
import { EXPORT_SIZE_PRESETS, type ExportSettings } from "./ExportSettingsModel"

type Props = {
  isRecording: boolean
  isGltfExporting: boolean
  isPngExporting: boolean
  exportedGltf: boolean
  exportedPng: boolean
  exportedVideo: boolean
  durationSeconds: number
  progress: number
  videoExportCanceled: boolean
  settings: ExportSettings
  supportedVideoContainers: VideoContainer[]
  onSettingsChange: (patch: Partial<ExportSettings>) => void
  onExportGltf: () => void
  onExportPng: () => void
  onExportVideo: () => void
  onCancelVideoExport: () => void
}

const fieldClass =
  "h-10 w-full rounded-md border border-border bg-background px-2 text-base text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-xs"

function Settings({
  settings,
  formats,
  disabled,
  onChange,
}: {
  settings: ExportSettings
  formats: VideoContainer[]
  disabled: boolean
  onChange: Props["onSettingsChange"]
}) {
  const activePreset = EXPORT_SIZE_PRESETS.find(
    (preset) =>
      preset.width === settings.width && preset.height === settings.height
  )?.id
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-xl border border-border bg-muted/25 p-3 disabled:opacity-60"
    >
      <legend className="px-1 text-xs font-semibold text-foreground">
        Render settings
      </legend>
      <div>
        <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
          Canvas size
        </div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {EXPORT_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={activePreset === preset.id}
              onClick={() =>
                onChange({ width: preset.width, height: preset.height })
              }
              className={cn(
                "min-h-10 rounded-md border px-2 text-[11px] font-medium transition-[background-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97]",
                activePreset === preset.id
                  ? "border-primary/40 bg-primary/12 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Width
          </span>
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
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Height
          </span>
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Frame rate
          </span>
          <select
            value={settings.frameRate}
            onChange={(event) =>
              onChange({
                frameRate: Number(event.target.value) as 24 | 30 | 60,
              })
            }
            className={fieldClass}
          >
            <option value={24}>24 fps</option>
            <option value={30}>30 fps</option>
            <option value={60}>60 fps</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Video format
          </span>
          <select
            value={settings.container}
            disabled={formats.length === 0}
            onChange={(event) =>
              onChange({ container: event.target.value as VideoContainer })
            }
            className={fieldClass}
          >
            {formats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Video quality
          </span>
          <select
            value={settings.videoBitsPerSecond}
            onChange={(event) =>
              onChange({ videoBitsPerSecond: Number(event.target.value) })
            }
            className={fieldClass}
          >
            <option value={4_000_000}>Standard</option>
            <option value={8_000_000}>High</option>
            <option value={16_000_000}>Maximum</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Background
          </span>
          <select
            value={settings.backgroundMode}
            onChange={(event) =>
              onChange({
                backgroundMode: event.target.value as "transparent" | "color",
              })
            }
            className={fieldClass}
          >
            <option value="transparent">Transparent</option>
            <option value="color">Solid color</option>
          </select>
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground">
          <span>Color</span>
          <input
            type="color"
            value={settings.backgroundColor}
            disabled={settings.backgroundMode === "transparent"}
            onChange={(event) =>
              onChange({ backgroundColor: event.target.value })
            }
            className="size-7 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
          />
        </label>
      </div>
      {formats.length === 0 ? (
        <p role="status" className="text-[11px] text-amber-600">
          This browser cannot record a supported video format. PNG and GLB
          remain available.
        </p>
      ) : null}
    </fieldset>
  )
}

function Asset({
  icon,
  title,
  copy,
  action,
}: {
  icon: React.ReactNode
  title: string
  copy: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {copy}
        </p>
      </div>
      {action}
    </div>
  )
}

export function ExportAssetOptions(props: Props) {
  const progress = Math.max(0, Math.min(1, props.progress))
  const size = `${props.settings.width}×${props.settings.height}`
  return (
    <div className="space-y-3">
      <Settings
        settings={props.settings}
        formats={props.supportedVideoContainers}
        disabled={props.isRecording}
        onChange={props.onSettingsChange}
      />
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-muted/25">
        <Asset
          icon={<ImageIcon aria-hidden="true" className="size-4" />}
          title="PNG still"
          copy={`${size}, ${props.settings.backgroundMode === "transparent" ? "transparent" : "solid background"}. Editor guides are excluded.`}
          action={
            <Button
              variant="secondary"
              disabled={props.isPngExporting || props.isRecording}
              onClick={props.onExportPng}
              className="shrink-0 gap-1.5"
            >
              {props.isPngExporting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3.5 animate-spin motion-reduce:animate-none"
                />
              ) : props.exportedPng ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Download aria-hidden="true" className="size-3.5" />
              )}
              {props.isPngExporting
                ? "Rendering…"
                : props.exportedPng
                  ? "Saved"
                  : "PNG"}
            </Button>
          }
        />
        <Asset
          icon={
            <Video
              aria-hidden="true"
              className={cn(
                "size-4",
                props.isRecording &&
                  "animate-pulse text-destructive motion-reduce:animate-none"
              )}
            />
          }
          title="Motion video"
          copy={`${props.durationSeconds.toFixed(1)}s at ${props.settings.frameRate} fps, ${size}. ${props.settings.container.toUpperCase()} availability follows this browser.`}
          action={
            <Button
              variant="secondary"
              disabled={
                !props.isRecording &&
                props.supportedVideoContainers.length === 0
              }
              onClick={
                props.isRecording
                  ? props.onCancelVideoExport
                  : props.onExportVideo
              }
              className="relative shrink-0 gap-1.5 overflow-hidden"
            >
              {props.isRecording ? (
                <>
                  <span
                    className="absolute inset-0 origin-left bg-primary/20"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                  <span className="relative">
                    {Math.round(progress * 100)}% · Cancel
                  </span>
                </>
              ) : (
                <>
                  {props.exportedVideo ? (
                    <Check aria-hidden="true" className="size-3.5" />
                  ) : (
                    <Video aria-hidden="true" className="size-3.5" />
                  )}
                  {props.exportedVideo
                    ? "Saved"
                    : props.settings.container.toUpperCase()}
                </>
              )}
            </Button>
          }
        />
        <Asset
          icon={<Box aria-hidden="true" className="size-4" />}
          title="3D model"
          copy="Current icon as a GLB with supported transform and depth animation. Wipes and editor guides are excluded."
          action={
            <Button
              variant="secondary"
              disabled={props.isGltfExporting || props.isRecording}
              onClick={props.onExportGltf}
              className="shrink-0 gap-1.5"
            >
              {props.isGltfExporting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-3.5 animate-spin motion-reduce:animate-none"
                />
              ) : props.exportedGltf ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Download aria-hidden="true" className="size-3.5" />
              )}
              {props.isGltfExporting
                ? "Preparing…"
                : props.exportedGltf
                  ? "Saved"
                  : "GLB"}
            </Button>
          }
        />
      </div>
      {props.exportedVideo ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[11px] font-medium text-foreground"
        >
          <Check aria-hidden="true" className="size-3.5 text-primary" />
          Video saved — check your downloads.
        </div>
      ) : props.videoExportCanceled ? (
        <div
          role="status"
          className="rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground"
        >
          Canceled — nothing was saved.
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-[11px]">
          <caption className="bg-muted/35 px-3 py-2 text-left font-semibold text-foreground">
            Export fidelity
          </caption>
          <thead className="border-t border-border bg-muted/20 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Output</th>
              <th className="px-2 py-2 font-medium">Motion</th>
              <th className="px-2 py-2 font-medium">Materials</th>
              <th className="px-2 py-2 font-medium">Editable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            <tr>
              <td className="px-3 py-2 font-medium">PNG</td>
              <td className="px-2 py-2">Still</td>
              <td className="px-2 py-2">Exact render</td>
              <td className="px-2 py-2">No</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium">Video</td>
              <td className="px-2 py-2">Full timeline</td>
              <td className="px-2 py-2">Exact render</td>
              <td className="px-2 py-2">No</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium">GLB</td>
              <td className="px-2 py-2">Subset</td>
              <td className="px-2 py-2">Compatible PBR</td>
              <td className="px-2 py-2">Yes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
