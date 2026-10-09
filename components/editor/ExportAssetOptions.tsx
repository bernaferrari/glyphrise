"use client"

import { useEffect, useState } from "react"
import { Check, Download, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VideoContainer } from "../3d/SvgTypes"
import type { ExportSettings } from "./ExportSettingsModel"
import { ExportRenderSettings } from "./ExportRenderSettings"

export type AssetFormat = "image" | "video" | "model"

type Props = {
  format: AssetFormat
  isRecording: boolean
  isGltfExporting: boolean
  isPngExporting: boolean
  exportedGltf: boolean
  exportedPng: boolean
  exportedVideo: boolean
  progress: number
  videoExportCanceled: boolean
  settings: ExportSettings
  supportedVideoContainers: VideoContainer[]
  onCapturePreview: (settings: ExportSettings) => Promise<Blob>
  onSettingsChange: (patch: Partial<ExportSettings>) => void
  onExportGltf: () => void
  onExportPng: () => void
  onExportVideo: () => void
  onCancelVideoExport: () => void
}

const NAMES = { image: "Image", video: "Video", model: "GLB" } as const

const MODEL_NOTES = [
  "Shape, depth, bevels and finish",
  "Gradients become standard 3D materials",
  "Icon-to-icon transitions are left out",
]

/** The output frame at its real proportions, with the chosen background. */
function OutputPreview({
  format,
  settings,
  onCapturePreview,
  busy,
}: {
  format: AssetFormat
  settings: ExportSettings
  busy: boolean
  onCapturePreview: Props["onCapturePreview"]
}) {
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(
    null
  )
  const [previewError, setPreviewError] = useState(false)
  // A model has no frame or background of its own: show the artwork cut out.
  // Only images come as frame sheets; video and models preview a still.
  const shown: ExportSettings =
    format === "model"
      ? {
          ...settings,
          width: 1080,
          height: 1080,
          backgroundMode: "transparent",
          frameGrid: 1,
        }
      : format === "video"
        ? { ...settings, frameGrid: 1 }
        : settings
  const key = JSON.stringify([
    shown.width,
    shown.height,
    shown.backgroundMode,
    shown.backgroundColor,
    shown.frameGrid,
  ])
  useEffect(() => {
    if (
      busy ||
      shown.width < 64 ||
      shown.height < 64 ||
      shown.width > 4096 ||
      shown.height > 4096
    )
      return
    let canceled = false
    let url: string | null = null
    setPreviewError(false)
    const timer = window.setTimeout(() => {
      void onCapturePreview(shown)
        .then((blob) => {
          if (canceled) return
          url = URL.createObjectURL(blob)
          setPreview({ url, key })
        })
        .catch(() => {
          if (!canceled) setPreviewError(true)
        })
    }, 120)
    return () => {
      canceled = true
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
    // `shown` is fully described by `key`.
  }, [key, onCapturePreview, busy])
  const ready = preview?.key === key && !previewError
  const ratio =
    Number.isFinite(shown.width / shown.height) && shown.height > 0
      ? shown.width / shown.height
      : 1
  // Percent of a square stage, so the frame scales with the stage size.
  const width = ratio >= 1 ? 100 : 100 * ratio
  const height = ratio >= 1 ? 100 / ratio : 100
  return (
    <div className="grid place-items-center bg-muted/40 p-6 max-md:p-4">
      <div className="grid size-72 place-items-center max-md:size-40">
        <div
          className="relative grid h-(--element-height) w-(--element-width) place-items-center overflow-hidden rounded-lg shadow-lg ring-1 ring-border transition-[width,height] duration-200 [background:var(--preview-background)]"
          style={
            {
              "--element-width": `${width}%`,
              "--element-height": `${height}%`,
              "--preview-background":
                shown.backgroundMode === "color"
                  ? shown.backgroundColor
                  : "var(--background-export-checkerboard)",
            } as React.CSSProperties
          }
        >
          {ready ? (
            <img
              src={preview.url}
              alt={
                shown.frameGrid === 1
                  ? "Rendered export frame"
                  : "Rendered frame sheet"
              }
              className="size-full object-contain"
            />
          ) : (
            <span
              role="status"
              aria-label={
                previewError ? "Preview unavailable" : "Rendering preview"
              }
              className={
                previewError
                  ? "px-3 text-center text-xs text-muted-foreground"
                  : "size-full animate-pulse bg-foreground/5"
              }
            >
              {previewError ? "Preview unavailable" : null}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ExportAssetOptions(props: Props) {
  const { format, settings } = props
  const busy =
    props.isRecording || props.isGltfExporting || props.isPngExporting
  const videoSupported = props.supportedVideoContainers.length > 0
  const saved =
    format === "image"
      ? props.exportedPng
      : format === "video"
        ? props.exportedVideo
        : props.exportedGltf
  const invalidSize =
    !Number.isFinite(settings.width) ||
    !Number.isFinite(settings.height) ||
    settings.width < 64 ||
    settings.height < 64 ||
    settings.width > 4096 ||
    settings.height > 4096
  const action =
    format === "image"
      ? props.onExportPng
      : format === "video"
        ? props.onExportVideo
        : props.onExportGltf
  const progress = Math.max(0, Math.min(1, props.progress))
  const status = saved
    ? `${NAMES[format]} downloaded. Find it in your downloads.`
    : format === "video" && props.videoExportCanceled
      ? "Recording canceled. You can try again."
      : props.isRecording
        ? "Keep this window open while it records."
        : null

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border">
      <div className="editor-scrollbar grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_320px] md:overflow-hidden">
        <OutputPreview
          format={format}
          settings={settings}
          onCapturePreview={props.onCapturePreview}
          busy={busy}
        />

        <div className="editor-scrollbar grid content-start gap-6 p-5 md:min-h-0 md:overflow-y-auto md:border-l md:border-border">
          {format === "model" ? (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-foreground">
                GLB (.glb), the binary glTF format. Includes geometry, materials
                and textures in one file.
              </p>
              <ul className="grid gap-2 text-xs text-muted-foreground">
                {MODEL_NOTES.map((note) => (
                  <li key={note} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-1 shrink-0 rounded-full bg-muted-foreground/60"
                    />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ExportRenderSettings
              settings={settings}
              formats={props.supportedVideoContainers}
              video={format === "video"}
              disabled={busy}
              invalidSize={invalidSize}
              onChange={props.onSettingsChange}
            />
          )}
          {format === "video" && !videoSupported && (
            <p
              role="status"
              className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"
            >
              This browser can’t record video. Try Image or 3D model, or open
              Glyphrise in Chrome, Edge or Safari.
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border bg-popover px-5 py-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-2 max-sm:pb-safe-bottom">
        <p
          role="status"
          className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground empty:hidden max-sm:justify-center"
        >
          {status ? (
            <>
              {saved ? (
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
              ) : null}
              <span className={saved ? "text-foreground" : undefined}>
                {status}
              </span>
            </>
          ) : null}
        </p>
        <Button
          shape="rounded"
          disabled={
            !props.isRecording &&
            (busy ||
              (format !== "model" && invalidSize) ||
              (format === "video" && !videoSupported))
          }
          onClick={props.isRecording ? props.onCancelVideoExport : action}
          className="relative h-10 min-w-48 overflow-hidden max-sm:h-11 max-sm:w-full"
        >
          {props.isRecording ? (
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left transform-(--element-transform) bg-white/15 transition-transform"
                style={
                  {
                    "--element-transform": `scaleX(${progress})`,
                  } as React.CSSProperties
                }
              />
              <span className="relative tabular-nums">
                Recording {Math.round(progress * 100)}% · Cancel
              </span>
            </>
          ) : (
            <>
              {busy ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Download aria-hidden="true" className="size-4" />
              )}
              {busy
                ? "Preparing…"
                : `Download ${format === "model" ? "GLB" : format}`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
