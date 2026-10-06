"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Check,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VideoContainer } from "../3d/SvgTypes"
import type { ExportSettings } from "./ExportSettingsModel"
import { ExportRenderSettings } from "./ExportRenderSettings"

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
  onCapturePreview: (settings: ExportSettings) => Promise<Blob>
  onSettingsChange: (patch: Partial<ExportSettings>) => void
  onExportGltf: () => void
  onExportPng: () => void
  onExportVideo: () => void
  onCancelVideoExport: () => void
}

const FORMATS = [
  { id: "image", name: "Image", detail: "PNG", Icon: ImageIcon },
  { id: "video", name: "Video", detail: "Full animation", Icon: Video },
  { id: "model", name: "3D model", detail: "GLB", Icon: Box },
] as const

const DESCRIPTIONS = {
  image: "This frame, exactly as rendered.",
  video:
    "The whole animation, start to finish. Keep this window open while it records.",
  model:
    "An editable 3D file. Some gradients and finishes are simplified; icon transitions are left out.",
} as const

/** The output frame at its real proportions, with the chosen background. */
function OutputPreview({
  format,
  settings,
  onCapturePreview,
  busy,
  durationSeconds,
}: {
  format: "image" | "video" | "model"
  settings: ExportSettings
  busy: boolean
  onCapturePreview: Props["onCapturePreview"]
  durationSeconds: number
}) {
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(
    null
  )
  const [previewError, setPreviewError] = useState(false)
  // A model has no frame or background of its own: show the artwork cut out.
  const shown: ExportSettings =
    format === "model"
      ? {
          ...settings,
          width: 1080,
          height: 1080,
          backgroundMode: "transparent",
        }
      : settings
  const key = JSON.stringify([
    shown.width,
    shown.height,
    shown.backgroundMode,
    shown.backgroundColor,
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
  const caption =
    format === "model"
      ? "GLB · editable 3D"
      : format === "video"
        ? `${settings.width} × ${settings.height} · ${durationSeconds.toFixed(1)}s · ${settings.frameRate} fps`
        : `${settings.width} × ${settings.height} · PNG`
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-muted/40 p-6 max-md:flex-row max-md:justify-start max-md:gap-4 max-md:px-5 max-md:py-4">
      <div className="grid size-56 place-items-center max-md:size-24">
        <div
          className="relative grid h-(--element-height) w-(--element-width) place-items-center overflow-hidden rounded-lg shadow-export-preview transition-[width,height] duration-200 bg-preview"
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
              alt="Rendered export frame"
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
                  : "size-full animate-pulse bg-foreground/5 motion-reduce:animate-none"
              }
            >
              {previewError ? "Preview unavailable" : null}
            </span>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground tabular-nums max-md:text-left">
        {caption}
      </p>
    </div>
  )
}

export function ExportAssetOptions(props: Props) {
  const [format, setFormat] = useState<"image" | "video" | "model">("image")
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
    !Number.isFinite(props.settings.width) ||
    !Number.isFinite(props.settings.height) ||
    props.settings.width < 64 ||
    props.settings.height < 64 ||
    props.settings.width > 4096 ||
    props.settings.height > 4096
  const title =
    format === "image"
      ? "Download image"
      : format === "video"
        ? "Download video"
        : "Download 3D model"
  const action =
    format === "image"
      ? props.onExportPng
      : format === "video"
        ? props.onExportVideo
        : props.onExportGltf
  const progress = Math.max(0, Math.min(1, props.progress))

  return (
    <div className="grid md:grid-cols-export">
      <OutputPreview
        format={format}
        settings={props.settings}
        onCapturePreview={props.onCapturePreview}
        busy={busy}
        durationSeconds={props.durationSeconds}
      />

      <div className="flex min-w-0 flex-col">
        <div className="editor-scrollbar grid gap-5 p-5 md:max-h-(--spacing-export-options) md:overflow-y-auto">
          <div className="grid gap-3">
            <div
              role="group"
              aria-label="Export format"
              className="grid grid-cols-3 gap-2"
            >
              {FORMATS.map(({ id, name, detail, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`${name} ${detail}`}
                  aria-pressed={format === id}
                  disabled={busy}
                  onClick={() => {
                    if (id === "video")
                      props.onSettingsChange({ backgroundMode: "color" })
                    setFormat(id)
                  }}
                  className="flex min-h-16 flex-col items-start justify-center gap-1 rounded-xl border border-border px-3 py-2.5 text-left transition-[background-color,border-color,box-shadow] hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-primary/[0.07] aria-pressed:shadow-preset-selection"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-foreground">
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground max-[440px]:hidden"
                    />
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {id === "video"
                      ? `${props.durationSeconds.toFixed(1)}s`
                      : detail}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {DESCRIPTIONS[format]}
            </p>
          </div>

          {format !== "model" && (
            <ExportRenderSettings
              settings={props.settings}
              formats={props.supportedVideoContainers}
              video={format === "video"}
              disabled={busy}
              onChange={props.onSettingsChange}
            />
          )}
          {format === "video" && !videoSupported && (
            <p
              role="status"
              className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"
            >
              Video recording isn’t supported in this browser. Choose Image or
              3D model, or try a browser that supports video recording.
            </p>
          )}
          {invalidSize && format !== "model" && (
            <p role="alert" className="text-xs text-destructive">
              Enter a width and height between 64 and 4096 pixels.
            </p>
          )}
        </div>

        <div className="sticky bottom-0 mt-auto grid gap-2 border-t border-border bg-popover px-5 py-4 md:static md:bg-transparent">
          {saved && (
            <p
              role="status"
              className="flex items-center gap-2 text-xs text-foreground"
            >
              <Check aria-hidden="true" className="size-4 text-primary" />
              {format === "video"
                ? "Video"
                : format === "image"
                  ? "Image"
                  : "3D model"}{" "}
              downloaded. Find it in your downloads.
            </p>
          )}
          {format === "video" && props.videoExportCanceled && (
            <p role="status" className="text-xs text-muted-foreground">
              Recording canceled. You can try again.
            </p>
          )}
          <Button
            shape="rounded"
            disabled={
              !props.isRecording &&
              (busy ||
                (format !== "model" && invalidSize) ||
                (format === "video" && !videoSupported))
            }
            onClick={props.isRecording ? props.onCancelVideoExport : action}
            className="relative min-h-11 w-full overflow-hidden"
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
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Download aria-hidden="true" className="size-4" />
                )}
                {busy ? "Preparing your download…" : title}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
