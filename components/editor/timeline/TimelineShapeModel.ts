import {
  DEFAULT_TRANSITION_END,
  DEFAULT_TRANSITION_START,
  type ShapeStop,
} from "../TimelineModel"
import { SHAPE_MIN_GAP } from "../ShapeTimeModel"

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const TRANSITION_MIN_FRACTION = 0.04

export const clampShapeStopTime = ({
  shapes,
  shapeId,
  time,
  duration,
}: {
  shapes: ShapeStop[]
  shapeId: string
  time: number
  duration: number
}) => {
  const selfTime = shapes.find((shape) => shape.id === shapeId)?.time ?? 0
  const previousTimes = shapes
    .filter((shape) => shape.id !== shapeId && shape.time < selfTime)
    .map((shape) => shape.time)
  const nextTimes = shapes
    .filter((shape) => shape.id !== shapeId && shape.time > selfTime)
    .map((shape) => shape.time)
  const minTime = previousTimes.length
    ? Math.max(...previousTimes) + SHAPE_MIN_GAP
    : 0
  const maxTime = nextTimes.length
    ? Math.min(...nextTimes) - SHAPE_MIN_GAP
    : duration

  return clamp(time, Math.min(minTime, maxTime), Math.max(minTime, maxTime))
}

export const moveShapeStop = ({
  shapes,
  shapeId,
  time,
  duration,
}: {
  shapes: ShapeStop[]
  shapeId: string
  time: number
  duration: number
}) => {
  const nextTime = Number(
    clampShapeStopTime({ shapes, shapeId, time, duration }).toFixed(3)
  )
  return shapes.map((shape) =>
    shape.id === shapeId ? { ...shape, time: nextTime } : shape
  )
}

export const setShapeTransitionFraction = ({
  shapes,
  shapeId,
  edge,
  fraction,
}: {
  shapes: ShapeStop[]
  shapeId: string
  edge: "start" | "end"
  fraction: number
}) =>
  shapes.map((shape) => {
    if (shape.id !== shapeId) return shape
    const currentStart = shape.transitionStart ?? DEFAULT_TRANSITION_START
    const currentEnd = shape.transitionEnd ?? DEFAULT_TRANSITION_END
    const nextFraction = clamp(fraction, 0, 1)

    return edge === "start"
      ? {
          ...shape,
          transitionStart: Number(
            Math.min(
              nextFraction,
              currentEnd - TRANSITION_MIN_FRACTION
            ).toFixed(3)
          ),
        }
      : {
          ...shape,
          transitionEnd: Number(
            Math.max(
              nextFraction,
              currentStart + TRANSITION_MIN_FRACTION
            ).toFixed(3)
          ),
        }
  })

/**
 * What travels with an icon when clips trade places. Times and transition
 * settings belong to the timeline slot and stay put; the id travels so
 * selection follows the icon the user moved.
 */
const ICON_FIELDS = [
  "id",
  "iconId",
  "iconName",
  "svgContent",
  "color",
  "colorSecondary",
  "fillStops",
  "fillGradientType",
  "fillKeyframes",
  "pathOverrides",
] as const satisfies ReadonlyArray<keyof ShapeStop>

const iconFieldsOf = (shape: ShapeStop) =>
  Object.fromEntries(ICON_FIELDS.map((field) => [field, shape[field]])) as Pick<
    ShapeStop,
    (typeof ICON_FIELDS)[number]
  >

/** Swap two clips' icons, leaving the timeline slots (times) where they are. */
export const swapShapeIcons = (
  shapes: ShapeStop[],
  aId: string,
  bId: string
): ShapeStop[] => {
  const a = shapes.find((shape) => shape.id === aId)
  const b = shapes.find((shape) => shape.id === bId)
  if (!a || !b || a === b) return shapes
  return shapes.map((shape) =>
    shape.id === aId
      ? { ...shape, ...iconFieldsOf(b) }
      : shape.id === bId
        ? { ...shape, ...iconFieldsOf(a) }
        : shape
  )
}

/** The clip right before or after `shapeId` in time, if any. */
export const adjacentShapeId = (
  shapes: ShapeStop[],
  shapeId: string,
  direction: -1 | 1
) => {
  const sorted = [...shapes].sort((a, b) => a.time - b.time)
  const index = sorted.findIndex((shape) => shape.id === shapeId)
  return index < 0 ? undefined : sorted[index + direction]?.id
}

/** Move a clip one place earlier or later; the icons trade slots. */
export const moveShapeOrder = (
  shapes: ShapeStop[],
  shapeId: string,
  direction: -1 | 1
) => {
  const neighborId = adjacentShapeId(shapes, shapeId, direction)
  return neighborId ? swapShapeIcons(shapes, shapeId, neighborId) : shapes
}
