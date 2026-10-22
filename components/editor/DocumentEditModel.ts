import {
  type EditorSnapshot,
  type LightPosition,
  ROTATION_MAX,
  ROTATION_MIN,
  SCALE_MAX,
  clampNumber,
  createEditorId,
  quantizeTimeToFrame,
} from "./EditorModel"
import {
  findKeyframeAtTime,
  removeKeyframesAtTime,
  toggleScalarTrackKeyframeAtTime,
  upsertVectorKeyframeAtTime,
} from "./EditorKeyframeModel"
import { setScalarTrackValueAtTime } from "./TrackValueModel"

/**
 * Inspector and canvas edits as pure document patches. Each edit changes the
 * property's base value and, once the property is animated, the keyframe at
 * the playhead (After Effects' stopwatch: a static property stays a single
 * value until it is keyframed). Every edit also leaves the applied recipe.
 */
type DocumentPatch = Partial<EditorSnapshot>

/** Scalar tracks and the document field holding each one's static value. */
export const SCALAR_TRACK_FIELDS = {
  extrusion: "extrusionDepth",
  scale: "objectScale",
  lighting: "keyLightIntensity",
} as const satisfies Record<string, keyof EditorSnapshot>

export type ScalarTrackId = keyof typeof SCALAR_TRACK_FIELDS

const playheadTime = (time: number, duration: number) =>
  clampNumber(quantizeTimeToFrame(time), 0, duration)

export const clampRotation = (rotation: LightPosition): LightPosition => ({
  x: clampNumber(rotation.x, ROTATION_MIN, ROTATION_MAX),
  y: clampNumber(rotation.y, ROTATION_MIN, ROTATION_MAX),
  z: clampNumber(rotation.z, ROTATION_MIN, ROTATION_MAX),
})

export const editScalarTrack = (
  document: EditorSnapshot,
  trackId: ScalarTrackId,
  value: number,
  time: number
): DocumentPatch => {
  const result = setScalarTrackValueAtTime({
    tracks: document.tracks,
    trackId,
    value,
    time,
    duration: document.duration,
  })
  return {
    activeRecipeId: null,
    tracks: result.tracks,
    [SCALAR_TRACK_FIELDS[trackId]]: result.value,
  }
}

export const editScaleAxis = (
  document: EditorSnapshot,
  axis: keyof LightPosition,
  value: number
): DocumentPatch => ({
  activeRecipeId: null,
  objectScaleAxes: {
    ...document.objectScaleAxes,
    [axis]: clampNumber(value, 0.1, SCALE_MAX),
  },
})

export const editRotation = (
  document: EditorSnapshot,
  rotation: LightPosition,
  time: number
): DocumentPatch => ({
  activeRecipeId: null,
  rotationOffset: rotation,
  rotationAxisKeyframes: upsertVectorKeyframeAtTime({
    keyframes: document.rotationAxisKeyframes,
    idPrefix: "rotation",
    value: rotation,
    time: playheadTime(time, document.duration),
    duration: document.duration,
    createIfMissing: false,
  }),
})

export const editMove = (
  document: EditorSnapshot,
  move: LightPosition,
  time: number
): DocumentPatch => ({
  activeRecipeId: null,
  moveOffset: move,
  moveKeyframes: upsertVectorKeyframeAtTime({
    keyframes: document.moveKeyframes,
    idPrefix: "move",
    value: move,
    time,
    duration: document.duration,
    createIfMissing: false,
  }),
})

/** Curve smoothness is keyed with Depth, so it only edits Depth's moments. */
export const editQuality = (
  document: EditorSnapshot,
  value: number,
  time: number
): DocumentPatch => {
  const geometryQuality = clampNumber(value, 0.015, 0.12)
  const keyed = findKeyframeAtTime(
    document.qualityKeyframes,
    playheadTime(time, document.duration)
  )
  return {
    activeRecipeId: null,
    geometryQuality,
    qualityKeyframes: keyed
      ? document.qualityKeyframes.map((keyframe) =>
          keyframe.id === keyed.id
            ? { ...keyframe, value: geometryQuality }
            : keyframe
        )
      : document.qualityKeyframes,
  }
}

/** The inspector's ◇ on a scalar property: key the shown value, or unkey it. */
export const toggleScalarTrackKeyframe = (
  document: EditorSnapshot,
  trackId: string,
  value: number,
  time: number
): DocumentPatch => ({
  activeRecipeId: null,
  tracks: toggleScalarTrackKeyframeAtTime({
    tracks: document.tracks,
    trackId,
    value,
    time,
    duration: document.duration,
  }),
})

export const isTransformKeyedAt = (document: EditorSnapshot, time: number) =>
  Boolean(
    findKeyframeAtTime(
      document.tracks.find((track) => track.id === "scale")?.keyframes ?? [],
      time
    ) ||
    findKeyframeAtTime(document.rotationAxisKeyframes, time) ||
    findKeyframeAtTime(document.moveKeyframes, time)
  )

/**
 * Transform's ◇ keys scale, rotation and position together at `time`, or
 * removes all three when any of them is keyed there.
 */
export const toggleTransformKeyframes = (
  document: EditorSnapshot,
  time: number,
  values: { scale: number; rotation: LightPosition; move: LightPosition }
): DocumentPatch => {
  const remove = isTransformKeyedAt(document, time)
  const vector = (
    keyframes: EditorSnapshot["moveKeyframes"],
    idPrefix: string,
    value: LightPosition
  ) =>
    remove
      ? removeKeyframesAtTime(keyframes, time)
      : upsertVectorKeyframeAtTime({
          keyframes,
          idPrefix,
          value,
          time,
          duration: document.duration,
          createIfMissing: true,
        })
  return {
    activeRecipeId: null,
    tracks: document.tracks.map((track) =>
      track.id !== "scale"
        ? track
        : {
            ...track,
            keyframes: remove
              ? removeKeyframesAtTime(track.keyframes, time)
              : [
                  ...track.keyframes,
                  {
                    id: createEditorId(track.id),
                    time,
                    value: values.scale,
                    easing: "ease-in-out" as const,
                  },
                ].sort((a, b) => a.time - b.time),
          }
    ),
    rotationAxisKeyframes: vector(
      document.rotationAxisKeyframes,
      "rotation",
      values.rotation
    ),
    moveKeyframes: vector(document.moveKeyframes, "move", values.move),
  }
}
