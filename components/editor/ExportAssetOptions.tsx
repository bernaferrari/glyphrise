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
import { cn } from "@/lib/utils"
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
  artwork?: { svgContent: string; label: string; color: string }
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

const CHECKERBOARD =
  "repeating-conic-gradient(color-mix(in oklab, var(--foreground) 9%, transparent) 0 25%, transparent 0 50%) 0 0 / 14px 14px"

/** The output frame at its real proportions, with the chosen background. */
function OutputPreview({
  format,
  settings,
  artwork,
  durationSeconds,
}: {
  format: "image" | "video" | "model"
  settings: ExportSettings
  artwork?: Props["artwork"]
  durationSeconds: number
}) {
  const ratio =
    Number.isFinite(settings.width / settings.height) && settings.height > 0
      ? settings.width / settings.height
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
    <div className="flex flex-col items-center justify-center gap-3 bg-muted/40 p-6 max-md:py-4">
      <div className="grid size-[200px] place-items-center max-md:size-[120px]">
        {format === "model" ? (
          <div className="grid size-full place-items-center rounded-xl border border-dashed border-border">
            <Box aria-hidden="true" className="size-14 text-muted-foreground" />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="[container-type:size] grid place-items-center overflow-hidden rounded-md shadow-[0_0_0_1px_var(--border),0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-[width,height] duration-200"
            style={{
              width: `${width}%`,
              height: `${height}%`,
              background:
                settings.backgroundMode === "color"
                  ? settings.backgroundColor
                  : CHECKERBOARD,
            }}
          >
            {artwork && (
              <span
                className="grid aspect-square w-[min(50cqw,50cqh)] place-items-center [&_svg]:size-full [&_svg_*]:fill-current"
                style={{ color: artwork.color }}
                dangerouslySetInnerHTML={{ __html: artwork.svgContent }}
              />
            )}
          </div>
        )}
      </div>
      <p className="text-center text-[11px] text-muted-foreground tabular-nums">
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
    <div className="grid md:grid-cols-[248px_minmax(0,1fr)]">
      <OutputPreview
        format={format}
        settings={props.settings}
        artwork={props.artwork}
        durationSeconds={props.durationSeconds}
      />

      <div className="flex min-w-0 flex-col">
        <div className="editor-scrollbar grid gap-5 p-5 md:max-h-[min(460px,calc(100dvh-240px))] md:overflow-y-auto">
          <div className="grid gap-2">
            <div
              role="group"
              aria-label="Export format"
              className="grid grid-cols-3 gap-0.5 rounded-lg bg-muted p-0.5"
            >
              {FORMATS.map(({ id, name, detail, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`${name} ${detail}`}
                  aria-pressed={format === id}
                  disabled={busy}
                  onClick={() => setFormat(id)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {name}
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {format === "image"
                ? "A still of the current frame, colors and finish intact."
                : format === "video"
                  ? "The whole animation, exactly as rendered. Keep this window open while it records."
                  : "An editable 3D file with supported motion. Some gradients and finishes are simplified; icon transitions are left out."}
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
          <details className="text-xs text-muted-foreground">
            <summary className="flex min-h-8 w-fit cursor-pointer items-center rounded-md px-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              Format details
            </summary>
            <div className="pt-2">
              <ExportFormatDetails />
            </div>
          </details>
        </div>

        <div className="sticky bottom-0 mt-auto grid gap-2 border-t border-border bg-popover p-4 md:static md:bg-transparent">
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
            className={cn(
              "relative min-h-11 w-full overflow-hidden rounded-lg"
            )}
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
    </div>
  )
}
