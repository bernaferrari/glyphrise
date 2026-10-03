"use client"

import { useState } from "react"
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
import { ExportFormatDetails } from "./ExportFormatDetails"

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

const FORMATS = [
  { id: "image", name: "Image", detail: "PNG", Icon: ImageIcon },
  { id: "video", name: "Video", detail: "Full animation", Icon: Video },
  { id: "model", name: "3D model", detail: "GLB", Icon: Box },
] as const

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
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-2" aria-label="Export format">
        {FORMATS.map(({ id, name, detail, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={format === id}
            disabled={busy}
            onClick={() => setFormat(id)}
            className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 px-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 aria-pressed:border-primary/60 aria-pressed:bg-primary/5"
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{name}</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {detail}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {format === "image"
          ? "A still image of this moment, with your colors and finish intact."
          : format === "video"
            ? `${props.durationSeconds.toFixed(1)} seconds of motion at ${props.settings.frameRate} fps, exactly as rendered. Keep this window open while it records.`
            : "An editable 3D model with supported motion. Some gradients and finishes are simplified; icon transitions are excluded."}
      </p>
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
          Video recording isn’t supported in this browser. Choose Image or 3D
          model, or try a browser that supports video recording.
        </p>
      )}
      {invalidSize && format !== "model" && (
        <p role="alert" className="text-xs text-destructive">
          Enter a width and height between 64 and 4096 pixels.
        </p>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="flex min-h-11 cursor-pointer items-center rounded-lg px-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
          Format details
        </summary>
        <ExportFormatDetails />
      </details>
      <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 grid gap-2 border-t border-border bg-background px-6 py-4">
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
          disabled={
            !props.isRecording &&
            (busy ||
              (format !== "model" && invalidSize) ||
              (format === "video" && !videoSupported))
          }
          onClick={props.isRecording ? props.onCancelVideoExport : action}
          className="relative min-h-12 w-full overflow-hidden rounded-xl"
        >
          {props.isRecording ? (
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left bg-white/15"
                style={{ transform: `scaleX(${progress})` }}
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
  )
}
