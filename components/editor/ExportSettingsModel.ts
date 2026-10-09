import type { ExportRenderOptions, VideoContainer } from "../3d/SvgTypes"
import type { FrameSheetArrangement } from "./ExportFrameSheet"

export type ExportBackgroundMode = "transparent" | "color"

export type ExportSettings = {
  width: number
  height: number
  frameRate: 24 | 30 | 60
  container: VideoContainer
  videoBitsPerSecond: number
  backgroundMode: ExportBackgroundMode
  backgroundColor: string
  /** Images only: frames in a frame sheet; 1 is a single still. */
  frames: number
  frameArrangement: FrameSheetArrangement
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  width: 1080,
  height: 1080,
  frameRate: 30,
  container: "webm",
  videoBitsPerSecond: 8_000_000,
  backgroundMode: "transparent",
  backgroundColor: "#17151f",
  frames: 1,
  frameArrangement: "auto",
}

export const EXPORT_SIZE_PRESETS = [
  { id: "square", label: "Square", ratio: "1:1", width: 1080, height: 1080 },
  {
    id: "landscape",
    label: "Landscape",
    ratio: "16:9",
    width: 1920,
    height: 1080,
  },
  {
    id: "portrait",
    label: "Portrait",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  { id: "social", label: "Social", ratio: "4:5", width: 1080, height: 1350 },
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

const hexRgb = (hex: string) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = Number.parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const
}

const hue = ([r, g, b]: readonly [number, number, number]) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return -1 // greys sort first
  const d = max - min
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4
  return h * 60
}

/**
 * Background ideas from the artwork itself: every color the icon uses (clip
 * fills, mesh points and fill keyframes), near-duplicates merged and sorted
 * by hue, so a backdrop can match the icon.
 */
export const projectPalette = (
  scene: {
    colorA: string
    colorB: string
    shapes: Array<{
      color: string
      colorSecondary: string
      fillStops?: Array<{ color: string }>
      fillKeyframes?: Array<{ stops: Array<{ color: string }> }>
    }>
    fillKeyframes: Array<{ stops: Array<{ color: string }> }>
  },
  limit = 6
) => {
  const candidates = [
    scene.colorA,
    scene.colorB,
    ...scene.shapes.flatMap((shape) => [
      ...(shape.fillStops?.map((stop) => stop.color) ?? [
        shape.color,
        shape.colorSecondary,
      ]),
      ...(shape.fillKeyframes ?? []).flatMap((keyframe) =>
        keyframe.stops.map((stop) => stop.color)
      ),
    ]),
    ...scene.fillKeyframes.flatMap((keyframe) =>
      keyframe.stops.map((stop) => stop.color)
    ),
  ]
  const picked: Array<{ hex: string; rgb: readonly [number, number, number] }> =
    []
  for (const candidate of candidates) {
    const rgb = hexRgb(candidate)
    if (!rgb) continue
    // Mesh gradients repeat near-identical tones; keep the distinct ones.
    const close = picked.some(
      ({ rgb: other }) =>
        Math.hypot(rgb[0] - other[0], rgb[1] - other[1], rgb[2] - other[2]) < 40
    )
    if (!close)
      picked.push({
        hex: `#${candidate.trim().replace(/^#/, "").toLowerCase()}`,
        rgb,
      })
    if (picked.length >= limit) break
  }
  return picked
    .sort((a, b) => hue(a.rgb) - hue(b.rgb))
    .map((color) => color.hex)
}
