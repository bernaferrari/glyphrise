import type { ExportRenderOptions, VideoContainer } from "../3d/SvgTypes"

export type ExportBackgroundMode = "transparent" | "color"

export type ExportSettings = {
  width: number
  height: number
  frameRate: 24 | 30 | 60
  container: VideoContainer
  videoBitsPerSecond: number
  backgroundMode: ExportBackgroundMode
  backgroundColor: string
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  width: 1080,
  height: 1080,
  frameRate: 30,
  container: "webm",
  videoBitsPerSecond: 8_000_000,
  backgroundMode: "transparent",
  backgroundColor: "#17151f",
}

export const EXPORT_SIZE_PRESETS = [
  { id: "square", label: "Square", width: 1080, height: 1080 },
  { id: "landscape", label: "Landscape", width: 1920, height: 1080 },
  { id: "portrait", label: "Portrait", width: 1080, height: 1920 },
  { id: "social", label: "Social", width: 1080, height: 1350 },
] as const

const VIDEO_MIME_CANDIDATES: Record<VideoContainer, string[]> = {
  webm: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
  mp4: ["video/mp4;codecs=avc1.42E01E", "video/mp4"],
}

export const resolveVideoMimeType = (
  container: VideoContainer,
  isTypeSupported: (mimeType: string) => boolean
) => VIDEO_MIME_CANDIDATES[container].find(isTypeSupported) ?? null

export const availableVideoContainers = (
  isTypeSupported: (mimeType: string) => boolean
) =>
  (["webm", "mp4"] as const).filter((container) =>
    resolveVideoMimeType(container, isTypeSupported)
  )

export const exportRenderOptions = (
  settings: ExportSettings
): ExportRenderOptions => ({
  width: Math.max(64, Math.min(4096, Math.round(settings.width))),
  height: Math.max(64, Math.min(4096, Math.round(settings.height))),
  backgroundColor:
    settings.backgroundMode === "transparent" ? null : settings.backgroundColor,
})

export const extensionForVideoBlob = (blob: Blob, fallback: VideoContainer) =>
  blob.type.toLowerCase().includes("mp4") ? "mp4" : fallback
