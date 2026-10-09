import { defaultMeshPoint } from "../../lib/mesh-warp"
import type { PathOverride } from "../3d/SvgTypes"

export type NamedEasing =
  | "linear"
  | "ease-in-out"
  | "flow"
  | "spring"
  | "bounce"
  /** After Effects' hold: keep the value, then jump at the next keyframe. */
  | "hold"
/** A custom curve, written like CSS: `cubic-bezier(x1, y1, x2, y2)`. */
export type CubicBezierEasing = `cubic-bezier(${string})`
export type EasingType = NamedEasing | CubicBezierEasing
export type BezierPoints = [number, number, number, number]

const NAMED_EASINGS: readonly NamedEasing[] = [
  "linear",
  "ease-in-out",
  "flow",
  "spring",
  "bounce",
  "hold",
]

/** Named easings that are cubic béziers, so their handles can be edited. */
export const NAMED_EASING_POINTS: Partial<Record<NamedEasing, BezierPoints>> = {
  linear: [0, 0, 1, 1],
  "ease-in-out": [0.45, 0, 0.55, 1],
}

export const parseCubicBezier = (easing: string): BezierPoints | null => {
  const match = /^cubic-bezier\(([^)]*)\)$/.exec(easing.trim())
  if (!match) return null
  const numbers = match[1].split(",").map((part) => Number(part.trim()))
  if (numbers.length !== 4 || !numbers.every(Number.isFinite)) return null
  const [x1, , x2] = numbers
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null
  return numbers as BezierPoints
}

export const cubicBezierEasing = (points: BezierPoints): CubicBezierEasing =>
  `cubic-bezier(${points.map((value) => Number(value.toFixed(3))).join(", ")})`

export const easingPoints = (easing: EasingType): BezierPoints | null =>
  NAMED_EASING_POINTS[easing as NamedEasing] ?? parseCubicBezier(easing)

export const isEasingType = (value: unknown): value is EasingType =>
  typeof value === "string" &&
  (NAMED_EASINGS.includes(value as NamedEasing) ||
    parseCubicBezier(value) !== null)

/** Eases t along a CSS-style cubic bézier by solving its x(s) = t. */
export const sampleCubicBezier = (
  [x1, y1, x2, y2]: BezierPoints,
  t: number
) => {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const bezier = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3
  let low = 0
  let high = 1
  let s = t
  for (let index = 0; index < 24; index++) {
    s = (low + high) / 2
    if (bezier(x1, x2, s) < t) low = s
    else high = s
  }
  return bezier(y1, y2, s)
}
export type TransitionType = "cut" | "fade" | "wipe"

export interface Keyframe {
  id: string
  time: number
  value: number
  easing: EasingType
}

export interface FillStop {
  id: string
  color: string
  position: number
  /** Mesh only: where this node was dragged (0–1, y down). */
  x?: number
  y?: number
}

export type FillGradientType = "linear" | "radial" | "conic" | "mesh"

export interface FillKeyframe {
  id: string
  time: number
  stops: FillStop[]
  gradientType?: FillGradientType
  easing: EasingType
}

export interface TimelineTrack {
  id: string
  name: string
  color: string
  min: number
  max: number
  defaultValue: number
  keyframes: Keyframe[]
}

export interface TimelinePropertyRow {
  id: string
  name: string
  color: string
  keyframes: Array<{
    id: string
    time: number
    label?: string
    easing?: EasingType
  }>
}

export interface ShapeStop {
  id: string
  time: number
  iconId: string
  iconName?: string
  svgContent: string
  color: string
  colorSecondary: string
  fillStops?: FillStop[]
  fillGradientType?: FillGradientType
  fillKeyframes?: FillKeyframe[]
  pathOverrides?: PathOverride[]
  easing: EasingType
  transitionType: TransitionType
  wipeDirection: { x: number; y: number }
  transitionStart?: number
  transitionEnd?: number
}

// Where the transition window sits inside a shape gap, as fractions of the gap (0..1).
// Outside [start, end] the shape holds; inside it blends to the next shape.
export const DEFAULT_TRANSITION_START = 0.25
export const DEFAULT_TRANSITION_END = 0.75

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

const springEase = (t: number) => {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

const bounceEase = (t: number) => {
  const n1 = 7.5625
  const d1 = 2.75

  if (t < 1 / d1) {
    return n1 * t * t
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

export const applyEasing = (easing: EasingType, t: number): number => {
  if (easing === "ease-in-out") return easeInOut(t)
  // A flowing turn varies speed while keeping equal, nonzero endpoint velocity.
  if (easing === "flow")
    return t - (0.35 * Math.sin(t * Math.PI * 2)) / (Math.PI * 2)
  if (easing === "spring") return springEase(t)
  if (easing === "bounce") return bounceEase(t)
  if (easing === "hold") return t >= 1 ? 1 : 0
  const points = parseCubicBezier(easing)
  return points ? sampleCubicBezier(points, t) : t
}

export const interpolateKeyframes = (
  time: number,
  track: TimelineTrack
): number => {
  const keyframes = track.keyframes

  if (keyframes.length === 0) return track.defaultValue
  if (time <= keyframes[0].time) return keyframes[0].value
  if (time >= keyframes[keyframes.length - 1].time)
    return keyframes[keyframes.length - 1].value

  let prev = keyframes[0]
  let next = keyframes[keyframes.length - 1]
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      prev = keyframes[i]
      next = keyframes[i + 1]
      break
    }
  }

  const timeDiff = next.time - prev.time
  if (timeDiff === 0) return prev.value

  const ratio = (time - prev.time) / timeDiff
  const easedRatio = applyEasing(prev.easing, ratio)
  return prev.value + (next.value - prev.value) * easedRatio
}

const parseHexColor = (
  value: string
): { r: number; g: number; b: number } | null => {
  let hex = value.trim().replace(/^#/, "")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("")
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

const toHexColor = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const channel = (next: number) =>
    Math.max(0, Math.min(255, Math.round(next)))
      .toString(16)
      .padStart(2, "0")
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

type PreparedFillPoint = {
  time: number
  easing: EasingType
  stop: FillStop | null
  parsedColor?: { r: number; g: number; b: number } | null
}

type PreparedFillStopTrack = {
  id?: string
  points: PreparedFillPoint[]
}

export type PreparedFillKeyframes = {
  sorted: FillKeyframe[]
  stopTracks: PreparedFillStopTrack[]
}

export const prepareFillKeyframes = (
  keyframes: FillKeyframe[] = []
): PreparedFillKeyframes => {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  const maxStops = Math.max(
    0,
    ...sorted.map((keyframe) => keyframe.stops?.length ?? 0)
  )
  const stopTracks = Array.from({ length: maxStops }, (_, index) => ({
    id: sorted.find((keyframe) => keyframe.stops?.[index])?.stops[index].id,
    points: sorted.map((keyframe) => {
      const stop = keyframe.stops?.length
        ? (keyframe.stops[index] ?? keyframe.stops[keyframe.stops.length - 1])
        : null
      return {
        time: keyframe.time,
        easing: keyframe.easing,
        stop,
        parsedColor: stop ? parseHexColor(stop.color) : undefined,
      }
    }),
  }))

  return { sorted, stopTracks }
}

const interpolatePreparedNumber = (
  time: number,
  fallback: number,
  points: PreparedFillPoint[],
  read: (stop: FillStop) => number | undefined = (stop) => stop.position
) => {
  if (points.length === 0) return fallback
  const valueAt = (point: PreparedFillPoint) =>
    (point.stop ? read(point.stop) : undefined) ?? fallback
  if (time <= points[0].time) return valueAt(points[0])
  if (time >= points[points.length - 1].time)
    return valueAt(points[points.length - 1])

  let previous = points[0]
  let next = points[0]
  for (let index = 0; index < points.length - 1; index++) {
    if (time >= points[index].time && time <= points[index + 1].time) {
      previous = points[index]
      next = points[index + 1]
      break
    }
  }
  const span = next.time - previous.time
  const ratio = span > 0 ? (time - previous.time) / span : 0
  const eased = applyEasing(previous.easing, ratio)
  return valueAt(previous) + (valueAt(next) - valueAt(previous)) * eased
}

const interpolatePreparedColor = (
  time: number,
  fallback: string,
  points: PreparedFillPoint[]
) => {
  const fallbackColor = parseHexColor(fallback)
  const valueAt = (point: PreparedFillPoint) => point.stop?.color ?? fallback
  const parsedAt = (point: PreparedFillPoint) =>
    point.stop ? point.parsedColor : fallbackColor
  let first: PreparedFillPoint | null = null
  let previous: PreparedFillPoint | null = null
  let next: PreparedFillPoint | null = null
  let last: PreparedFillPoint | null = null
  for (const point of points) {
    if (!parsedAt(point)) continue
    first ??= point
    last = point
    if (point.time <= time) previous = point
    if (point.time >= time && !next) next = point
  }
  if (!first || !last) return fallback
  if (!previous) return valueAt(first)
  if (!next) return valueAt(last)
  const previousColor = parsedAt(previous)
  const nextColor = parsedAt(next)
  if (!previousColor || !nextColor) return fallback
  const span = next.time - previous.time
  const ratio = span > 0 ? (time - previous.time) / span : 0
  const eased = applyEasing(previous.easing, ratio)
  return toHexColor({
    r: previousColor.r + (nextColor.r - previousColor.r) * eased,
    g: previousColor.g + (nextColor.g - previousColor.g) * eased,
    b: previousColor.b + (nextColor.b - previousColor.b) * eased,
  })
}

export const interpolatePreparedFillKeyframes = (
  time: number,
  fallback: {
    color: string
    colorSecondary: string
    gradientType?: FillGradientType
    stops?: FillStop[]
  },
  prepared: PreparedFillKeyframes
) => {
  const fallbackStops: FillStop[] = fallback.stops?.length
    ? fallback.stops
    : [
        { id: "start", color: fallback.color, position: 0 },
        { id: "end", color: fallback.colorSecondary, position: 1 },
      ]
  const maxStops = Math.max(fallbackStops.length, prepared.stopTracks.length)
  const stops = Array.from({ length: maxStops }, (_, index) => {
    const fallbackStop =
      fallbackStops[index] ?? fallbackStops[fallbackStops.length - 1]
    const track = prepared.stopTracks[index]
    const points = track?.points ?? []
    // Dragged mesh nodes animate too; unmoved ones stay on the default grid.
    const positioned =
      fallbackStop.x !== undefined ||
      points.some((point) => point.stop?.x !== undefined)
    const gridPoint = defaultMeshPoint(index)
    return {
      id: track?.id ?? fallbackStop.id ?? `stop-${index}`,
      position: interpolatePreparedNumber(time, fallbackStop.position, points),
      color: interpolatePreparedColor(time, fallbackStop.color, points),
      ...(positioned
        ? {
            x: interpolatePreparedNumber(
              time,
              fallbackStop.x ?? gridPoint.x,
              points,
              (stop) => stop.x ?? gridPoint.x
            ),
            y: interpolatePreparedNumber(
              time,
              fallbackStop.y ?? gridPoint.y,
              points,
              (stop) => stop.y ?? gridPoint.y
            ),
          }
        : {}),
    }
  })

  let gradientType = fallback.gradientType ?? "linear"
  for (let index = prepared.sorted.length - 1; index >= 0; index--) {
    const keyframe = prepared.sorted[index]
    if (keyframe.time <= time) {
      gradientType = keyframe.gradientType ?? gradientType
      break
    }
  }

  return {
    color: stops[0]?.color ?? fallback.color,
    colorSecondary:
      stops[1]?.color ?? stops[0]?.color ?? fallback.colorSecondary,
    gradientType,
    stops,
  }
}

export const interpolateFillKeyframes = (
  time: number,
  fallback: {
    color: string
    colorSecondary: string
    gradientType?: FillGradientType
    stops?: FillStop[]
  },
  keyframes: FillKeyframe[] = []
) =>
  interpolatePreparedFillKeyframes(
    time,
    fallback,
    prepareFillKeyframes(keyframes)
  )
