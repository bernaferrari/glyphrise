import * as THREE from "three"
import { finiteNumber } from "./SvgGeometry"
import {
  isWarpedMesh,
  meshBlobWeight,
  meshExtraPoints,
  meshNodePoints,
  meshWarpCoordinates,
} from "../../lib/mesh-warp"
import type { GradientStop, GradientType } from "./SvgTypes"

const GOOGLE_MESH_PALETTE = [
  ["#FF9900", "#FF360A", "#D13AB3"],
  ["#FFC700", "#807AFF", "#1759FF"],
  ["#63E600", "#00C796", "#00ADF0"],
] as const

export const fallbackGoogleMeshStops: GradientStop[] =
  GOOGLE_MESH_PALETTE.flatMap((row, rowIndex) =>
    row.map((color, columnIndex) => ({
      color,
      position: (rowIndex * 3 + columnIndex) / 8,
    }))
  )

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

const colorAtPalettePosition = (palette: THREE.Color[], t: number) => {
  if (palette.length === 0) return new THREE.Color("#ffffff")
  if (palette.length === 1) return palette[0].clone()

  const scaled = Math.max(0, Math.min(1, t)) * Math.max(1, palette.length - 1)
  const start = Math.max(0, Math.min(palette.length - 1, Math.floor(scaled)))
  const end = Math.min(palette.length - 1, start + 1)
  return palette[start].clone().lerp(palette[end], scaled - start)
}

/**
 * Everything about a mesh that doesn't depend on the sample point, resolved
 * once per recolor rather than once per vertex.
 */
const createMeshSampler = (
  stops: Array<{ color: string; position: number; x?: number; y?: number }>
) => {
  const palette = stops.slice(0, 9).map((stop) => new THREE.Color(stop.color))
  const grid = Array.from({ length: 9 }, (_, index) =>
    palette.length >= 9
      ? palette[index]
      : colorAtPalettePosition(palette, index / 8)
  )
  const points = meshNodePoints(stops)
  const warped = isWarpedMesh(points)
  const extras = meshExtraPoints(stops).map((point) => ({
    ...point,
    color: new THREE.Color(point.color),
  }))
  const result = new THREE.Color()
  return (u: number, v: number) => {
    const { s, t } = warped ? meshWarpCoordinates(points, u, v) : { s: u, t: v }
    const x = smoothstep(0.02, 0.98, s)
    const y = smoothstep(0.02, 0.98, t)
    const blend = (channel: "r" | "g" | "b") => {
      const row = (offset: number) =>
        (1 - x) ** 2 * grid[offset][channel] +
        2 * x * (1 - x) * grid[offset + 1][channel] +
        x ** 2 * grid[offset + 2][channel]
      return (1 - y) ** 2 * row(0) + 2 * y * (1 - y) * row(3) + y ** 2 * row(6)
    }
    // Finishes own any saturation/brightness grading, so the mesh renders the
    // colors exactly as picked (matching the 2D preview).
    result.setRGB(blend("r"), blend("g"), blend("b"))
    for (const extra of extras) {
      result.lerp(extra.color, meshBlobWeight(extra, u, v))
    }
    return result
  }
}

/** Resolve palette data once. The returned color is reused on each sample. */
export const createIconGradientSampler = (
  type: GradientType,
  stops: Array<{ color: string; position: number; x?: number; y?: number }>
) => {
  if (type === "mesh") return createMeshSampler(stops)
  const colors = stops.map((stop) => new THREE.Color(stop.color))
  const result = new THREE.Color()
  const angle = THREE.MathUtils.degToRad(35)
  const dx = Math.cos(angle),
    dy = Math.sin(angle)
  return (u: number, v: number) => {
    let t = (u * dx + (1 - v) * dy) / (dx + dy)
    if (type === "radial") t = Math.hypot(u - 0.5, v - 0.5) / Math.SQRT1_2
    if (type === "conic") {
      t = Math.atan2(v - 0.5, u - 0.5) / (Math.PI * 2) + 0.5
      t -= Math.floor(t)
    }
    t = Math.max(0, Math.min(1, t))
    if (!stops.length) return result.set("#ffffff")
    let next = stops.findIndex((stop) => stop.position >= t)
    if (next < 0) next = stops.length - 1
    const previous = Math.max(0, next - 1)
    const span = stops[next].position - stops[previous].position
    const local =
      span > 0
        ? Math.max(0, Math.min(1, (t - stops[previous].position) / span))
        : 0
    return result.copy(colors[previous]).lerp(colors[next], local)
  }
}

export const paletteFromStops = (
  stops: GradientStop[] | undefined,
  fallbackA: string,
  fallbackB: string
) => {
  const source = stops?.length
    ? stops
    : [
        { color: fallbackA, position: 0 },
        { color: fallbackB, position: 1 },
      ]
  return [...source]
    .sort((a, b) => a.position - b.position)
    .map(
      (stop) =>
        new THREE.Color(
          stop.color.startsWith("#") ? stop.color : `#${stop.color}`
        )
    )
}

export const gradientStopsFromFill = (
  stops: GradientStop[] | undefined,
  fallbackA: string,
  fallbackB: string
) => {
  const source = stops?.length
    ? stops
    : [
        { color: fallbackA, position: 0 },
        { color: fallbackB, position: 1 },
      ]
  return [...source]
    .map((stop) => ({
      color: stop.color.startsWith("#") ? stop.color : `#${stop.color}`,
      position: Math.max(0, Math.min(1, finiteNumber(stop.position, 0))),
      x: stop.x,
      y: stop.y,
    }))
    .sort((a, b) => a.position - b.position)
}

export const applyGradientVertexColors = (
  geometry: THREE.BufferGeometry,
  type: "linear" | "radial" | "conic" | "mesh",
  stops: Array<{ color: string; position: number; x?: number; y?: number }>,
  iconBounds: THREE.Box2
) => {
  const position = geometry.getAttribute("position") as
    | THREE.BufferAttribute
    | undefined
  if (!position) return
  const width = Math.max(0.0001, iconBounds.max.x - iconBounds.min.x)
  const height = Math.max(0.0001, iconBounds.max.y - iconBounds.min.y)

  const colors = new Float32Array(position.count * 3)
  const sample = createIconGradientSampler(type, stops)
  for (let index = 0; index < position.count; index += 1) {
    const u = Math.max(
      0,
      Math.min(1, (position.getX(index) - iconBounds.min.x) / width)
    )
    const v = Math.max(
      0,
      Math.min(1, (position.getY(index) - iconBounds.min.y) / height)
    )
    const color = sample(u, v)
    colors[index * 3] = color.r
    colors[index * 3 + 1] = color.g
    colors[index * 3 + 2] = color.b
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
}
