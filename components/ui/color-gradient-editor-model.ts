import {
  colorAtGradientPoint,
  colorAtStopPosition,
  gradientPreviewCss,
  meshGridColors,
} from "./color-picker-utils"
import type { GradientType } from "./color-gradient-mode-toggle"
import type { NormalizedColorStop } from "./color-stop-model"

export const gradientEditorPreviewCss = ({
  gradientType,
  stops,
  fallback,
}: {
  gradientType: GradientType
  stops: NormalizedColorStop[]
  fallback: string
}) => {
  const gradientStopsCss = stops
    .map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`)
    .join(", ")

  if (stops.length <= 1) return fallback
  if (gradientType === "mesh") return gradientPreviewCss("mesh", stops)
  if (gradientType === "radial")
    return `radial-gradient(circle at 35% 35%, ${gradientStopsCss})`
  if (gradientType === "conic")
    return `conic-gradient(from 45deg, ${gradientStopsCss}, ${stops[0]?.color ?? fallback})`
  return `linear-gradient(90deg, ${gradientStopsCss})`
}

export const createGradientStopAtPoint = ({
  gradientType,
  stops,
  point,
  fallback,
}: {
  gradientType: GradientType
  stops: NormalizedColorStop[]
  point: { x: number; y: number }
  fallback: string
}) => ({
  color: colorAtGradientPoint(gradientType, stops, point, fallback),
  position: Number(Math.max(0, Math.min(1, point.x)).toFixed(3)),
})

export const createGradientStopAtPosition = ({
  stops,
  position,
  fallback,
}: {
  stops: NormalizedColorStop[]
  position: number
  fallback: string
}) => ({
  color: colorAtStopPosition(stops, position, fallback),
  position,
})

export const insertGradientStop = (
  stops: NormalizedColorStop[],
  stop: { color: string; position: number }
) => [...stops, stop].sort((a, b) => a.position - b.position)

export const findInsertedGradientStopIndex = (
  stops: Array<{ color: string; position: number }>,
  stop: { color: string; position: number }
) =>
  stops.findIndex(
    (item) =>
      Math.abs(item.position - stop.position) < 0.0005 &&
      item.color.toLowerCase() === stop.color.toLowerCase()
  )

export const normalizedGradientPosition = (position: number) =>
  Number(Math.max(0, Math.min(1, position)).toFixed(3))

export const updateGradientStopPositionById = (
  stops: NormalizedColorStop[],
  stopId: string,
  position: number
) =>
  stops
    .map((stop) =>
      stop.id === stopId
        ? { ...stop, position: normalizedGradientPosition(position) }
        : stop
    )
    .sort((a, b) => a.position - b.position)

export const updateGradientStopColorById = (
  stops: NormalizedColorStop[],
  stopId: string,
  color: string
) => stops.map((stop) => (stop.id === stopId ? { ...stop, color } : stop))

export const parseGradientStopPositionInput = (rawValue: string) => {
  const parsed = Number.parseFloat(rawValue.replace("%", ""))
  return Number.isFinite(parsed) ? parsed / 100 : null
}

export const gradientRailPointFromClient = ({
  rect,
  clientX,
  clientY,
}: {
  rect: DOMRect
  clientX: number
  clientY?: number
}) => {
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  const y =
    clientY === undefined
      ? 0.5
      : Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))

  return {
    x: normalizedGradientPosition(x),
    y,
  }
}

/**
 * A mesh is always nine points. Present exactly the nine the renderer uses so
 * editing one point never reshuffles or silently drops the others.
 */
export const meshEditorStops = (
  stops: NormalizedColorStop[],
  fallback: string
): NormalizedColorStop[] =>
  meshGridColors(stops, fallback)
    .map((color, index) => {
      const source = stops.length >= 9 ? stops[index] : undefined
      return {
        id: source?.id ?? `mesh-${index}`,
        color,
        position: index / 8,
        ...(source?.x !== undefined && source.y !== undefined
          ? { x: source.x, y: source.y }
          : {}),
      }
    })
    .concat(
      // Free points ride after the grid (position 1 keeps them there).
      stops.slice(9).map((stop) => ({
        ...stop,
        position: 1,
        x: stop.x ?? 0.5,
        y: stop.y ?? 0.5,
      }))
    )

export const addMeshFreePoint = (
  stops: NormalizedColorStop[],
  point: { x: number; y: number },
  fallback: string
): NormalizedColorStop[] => [
  ...stops,
  {
    id: `mesh-free-${Date.now().toString(36)}`,
    color: colorAtGradientPoint("mesh", stops, point, fallback),
    position: 1,
    x: point.x,
    y: point.y,
  },
]

/**
 * Mesh order decides which slot a color sits in; positions belong to slots.
 * Moving a row moves its color to another slot.
 */
export const reorderMeshColors = (
  stops: NormalizedColorStop[],
  from: number,
  to: number
): NormalizedColorStop[] => {
  if (from === to || !stops[from] || !stops[to]) return stops
  const colors = stops.map((stop) => stop.color)
  const [moved] = colors.splice(from, 1)
  colors.splice(to, 0, moved)
  return stops.map((stop, index) => ({ ...stop, color: colors[index] }))
}

/**
 * Removing a grid color shifts the later colors up a slot, so the first free
 * point joins the grid; with no free points left, the remaining colors
 * spread across the nine slots. Removing a free point just drops that blob.
 */
export const removeMeshPointAt = (
  stops: NormalizedColorStop[],
  index: number
): NormalizedColorStop[] => {
  if (!stops[index] || stops.length <= 2) return stops
  if (index >= 9) return stops.filter((_, i) => i !== index)
  if (stops.length <= 9) {
    // The grid always has nine slots: spread the remaining colors across
    // them so the removed color disappears and its neighbours blend in.
    const remaining = stops
      .filter((_, i) => i !== index)
      .map((stop, i, list) => ({
        color: stop.color,
        position: i / (list.length - 1),
      }))
    return stops.map((stop, i) => ({
      ...stop,
      color: colorAtStopPosition(remaining, i / (stops.length - 1), stop.color),
    }))
  }
  const colors = stops.map((stop) => stop.color).filter((_, i) => i !== index)
  return stops
    .filter((_, i) => i !== 9)
    .map((stop, i) => ({ ...stop, color: colors[i] }))
}

export const removeGradientStopAt = (
  stops: NormalizedColorStop[],
  index: number
) => (stops.length > 1 ? stops.filter((_, i) => i !== index) : stops)
