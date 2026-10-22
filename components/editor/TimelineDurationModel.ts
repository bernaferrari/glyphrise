import {
  MAX_TIMELINE_DURATION,
  MIN_TIMELINE_DURATION,
  clampNumber,
  quantizeTimeToFrame,
} from "./EditorModel"
import type { ShapeStop, TimelineTrack } from "./TimelineModel"

export const clampTimelineDuration = (duration: number) =>
  Math.max(
    MIN_TIMELINE_DURATION,
    Math.min(MAX_TIMELINE_DURATION, Number(duration.toFixed(1)))
  )

export const scaleTimelineTime = ({
  time,
  ratio,
  duration,
}: {
  time: number
  ratio: number
  duration: number
}) => quantizeTimeToFrame(clampNumber(time * ratio, 0, duration))

const sortByTime = <T extends { time: number }>(items: T[]) =>
  [...items].sort((a, b) => a.time - b.time)

export const scaleKeyframeTimes = <T extends { time: number }>(
  keyframes: T[],
  ratio: number,
  duration: number
): T[] =>
  sortByTime(
    keyframes.map((keyframe) => ({
      ...keyframe,
      time: scaleTimelineTime({ time: keyframe.time, ratio, duration }),
    }))
  )

export const scaleShapeStopTimes = (
  shapes: ShapeStop[],
  ratio: number,
  duration: number
) =>
  sortByTime(
    shapes.map((shape) => ({
      ...shape,
      time: scaleTimelineTime({ time: shape.time, ratio, duration }),
      fillKeyframes: shape.fillKeyframes
        ? scaleKeyframeTimes(shape.fillKeyframes, ratio, duration)
        : shape.fillKeyframes,
    }))
  )

export const scaleTimelineTrackTimes = (
  tracks: TimelineTrack[],
  ratio: number,
  duration: number
) =>
  tracks.map((track) => ({
    ...track,
    keyframes: scaleKeyframeTimes(track.keyframes, ratio, duration),
  }))
