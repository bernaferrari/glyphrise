import {
  DEFAULT_TRANSITION_END,
  DEFAULT_TRANSITION_START,
  type ShapeStop,
  type TimelineTrack,
} from "./TimelineModel"
import {
  type MaterialKeyframe,
  type Vector3Keyframe,
  clampNumber,
  quantizeTimeToFrame,
} from "./EditorModel"
import { KEYFRAME_TIME_EPSILON } from "./EditorKeyframeModel"
import type { FillKeyframe } from "./TimelineModel"

export const createShapeTransitionKeyMoments = (shapes: ShapeStop[]) =>
  shapes.slice(0, -1).flatMap((from, index) => {
    const to = shapes[index + 1]
    const gap = Math.max(0, to.time - from.time)
    const start =
      from.time + (from.transitionStart ?? DEFAULT_TRANSITION_START) * gap
    const end = from.time + (from.transitionEnd ?? DEFAULT_TRANSITION_END) * gap
    return [start, end]
  })

export const createTimelineKeyMoments = ({
  duration,
  shapes,
  fillKeyframes,
  tracks,
  rotationAxisKeyframes,
  moveKeyframes,
  keyLightPositionKeyframes,
  materialKeyframes,
}: {
  duration: number
  shapes: ShapeStop[]
  fillKeyframes: FillKeyframe[]
  tracks: TimelineTrack[]
  rotationAxisKeyframes: Vector3Keyframe[]
  moveKeyframes: Vector3Keyframe[]
  keyLightPositionKeyframes: Vector3Keyframe[]
  materialKeyframes: MaterialKeyframe[]
}) =>
  Array.from(
    new Set(
      [
        0,
        duration,
        ...createShapeTransitionKeyMoments(shapes),
        ...fillKeyframes.map((keyframe) => keyframe.time),
        ...tracks.flatMap((track) =>
          track.keyframes.map((keyframe) => keyframe.time)
        ),
        ...rotationAxisKeyframes.map((keyframe) => keyframe.time),
        ...moveKeyframes.map((keyframe) => keyframe.time),
        ...keyLightPositionKeyframes.map((keyframe) => keyframe.time),
        ...materialKeyframes.map((keyframe) => keyframe.time),
      ].map((time) => quantizeTimeToFrame(clampNumber(time, 0, duration)))
    )
  ).sort((a, b) => a - b)

export const getAdjacentTimelineKeyMoments = ({
  keyMoments,
  currentTime,
}: {
  keyMoments: number[]
  currentTime: number
}) => {
  let previousKeyMoment: number | undefined
  let nextKeyMoment: number | undefined
  for (const time of keyMoments) {
    if (time < currentTime - KEYFRAME_TIME_EPSILON) {
      previousKeyMoment = time
    } else if (time > currentTime + KEYFRAME_TIME_EPSILON) {
      nextKeyMoment = time
      break
    }
  }
  return { previousKeyMoment, nextKeyMoment }
}
