import type {
  ShapeStop,
  TimelinePropertyRow,
  TimelineTrack,
} from "../TimelineModel"

export type ShapeTransitionWindow = {
  from: ShapeStop
  to: ShapeStop
  startTime: number
  endTime: number
}

export type TransitionWindow = ShapeTransitionWindow & {
  stop: ShapeStop
  next: ShapeStop
  mStart: number
  mEnd: number
}

export type ShapeClipBounds = {
  left: number
  right: number
  isOnly: boolean
}

export type KeyMomentTimeOptions = {
  excludeShapeId?: string
  excludeKeyframe?: { trackId: string; kfId: string }
  excludeTrackId?: string
}

export const computeTransitionWindows = (
  sortedShapes: ShapeStop[],
  defaultTransitionStart: number,
  defaultTransitionEnd: number
): TransitionWindow[] =>
  sortedShapes.slice(0, -1).map((stop, index) => {
    const next = sortedShapes[index + 1]
    const gap = Math.max(0, next.time - stop.time)
    const startFrac = stop.transitionStart ?? defaultTransitionStart
    const endFrac = stop.transitionEnd ?? defaultTransitionEnd
    const startTime = stop.time + startFrac * gap
    const endTime = stop.time + endFrac * gap

    return {
      from: stop,
      to: next,
      startTime,
      endTime,
      stop,
      next,
      mStart: startTime,
      mEnd: endTime,
    }
  })

export const computeShapeClipBounds = (
  sortedShapes: ShapeStop[],
  transitionWindows: TransitionWindow[],
  duration: number
): ShapeClipBounds[] =>
  sortedShapes.map((_, index) => {
    if (sortedShapes.length === 1)
      return { left: 0, right: duration, isOnly: true }
    const left = index === 0 ? 0 : transitionWindows[index - 1].endTime
    const right =
      index === sortedShapes.length - 1
        ? duration
        : transitionWindows[index].startTime
    return { left, right, isOnly: false }
  })

export const collectKeyMomentTimes = ({
  duration,
  transitionWindows,
  shapes,
  tracks,
  propertyRows,
  excludeShapeId,
  excludeKeyframe,
  excludeTrackId,
}: {
  duration: number
  transitionWindows: TransitionWindow[]
  shapes: ShapeStop[]
  tracks: TimelineTrack[]
  propertyRows: TimelinePropertyRow[]
} & KeyMomentTimeOptions) => {
  const shapeTransitionTimes = transitionWindows.flatMap(
    ({ from, to, startTime, endTime }) => {
      if (from.id === excludeShapeId || to.id === excludeShapeId) return []
      return [startTime, endTime]
    }
  )
  const numericKeyframeTimes = tracks.flatMap((track) => {
    if (track.id === excludeTrackId) return []
    return track.keyframes
      .filter(
        (keyframe) =>
          !(
            excludeKeyframe?.trackId === track.id &&
            excludeKeyframe.kfId === keyframe.id
          )
      )
      .map((keyframe) => keyframe.time)
  })
  const colorKeyframeTimes = shapes
    .filter((shape) => shape.id !== excludeShapeId)
    .flatMap((shape) =>
      (shape.fillKeyframes ?? []).map((keyframe) => keyframe.time)
    )
  const propertyRowTimes = propertyRows.flatMap((row) =>
    row.keyframes.map((keyframe) => keyframe.time)
  )

  return Array.from(
    new Set([
      ...shapeTransitionTimes,
      ...numericKeyframeTimes,
      ...colorKeyframeTimes,
      ...propertyRowTimes,
      0,
      duration,
    ])
  )
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b)
}
