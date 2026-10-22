import type { EditorSnapshot, ScalarKeyframe } from "./EditorModel"
import { keyframeTimeMatches } from "./EditorKeyframeModel"

/**
 * Every keyframed property besides the scalar `tracks` (depth, scale,
 * brightness), keyed by a short id and pointing at the document field that
 * holds its keyframes. Code that treats keyframes generically (counting,
 * scaling, clearing, looping) walks this table instead of naming each list.
 */
export const KEYFRAME_CHANNELS = {
  fill: { field: "fillKeyframes", idPrefix: "fill" },
  material: { field: "materialKeyframes", idPrefix: "material" },
  lightPosition: {
    field: "keyLightPositionKeyframes",
    idPrefix: "light-position",
  },
  rotation: { field: "rotationAxisKeyframes", idPrefix: "rotation" },
  move: { field: "moveKeyframes", idPrefix: "move" },
  quality: { field: "qualityKeyframes", idPrefix: "quality" },
  innerScale: { field: "innerScaleKeyframes", idPrefix: "inner-scale" },
} as const satisfies Record<
  string,
  { field: keyof EditorSnapshot; idPrefix: string }
>

export type KeyframeChannelId = keyof typeof KEYFRAME_CHANNELS
export type KeyframeChannelField =
  (typeof KEYFRAME_CHANNELS)[KeyframeChannelId]["field"]
export type KeyframeChannels = Pick<EditorSnapshot, KeyframeChannelField>

export const KEYFRAME_CHANNEL_IDS = Object.keys(
  KEYFRAME_CHANNELS
) as KeyframeChannelId[]

export const KEYFRAME_CHANNEL_FIELDS: KeyframeChannelField[] =
  KEYFRAME_CHANNEL_IDS.map((id) => KEYFRAME_CHANNELS[id].field)

type TimedKeyframe = { time: number }
type KeyframeListUpdate = <T extends TimedKeyframe>(keyframes: T[]) => T[]

/**
 * Applies `update` to every keyframe list in the document, the scalar tracks
 * included, and returns only the lists that changed.
 */
export const mapDocumentKeyframes = (
  document: Pick<EditorSnapshot, KeyframeChannelField | "tracks">,
  update: KeyframeListUpdate
): Partial<EditorSnapshot> => {
  const patch: Partial<EditorSnapshot> = {}
  for (const field of KEYFRAME_CHANNEL_FIELDS) {
    const next = update(document[field] as TimedKeyframe[])
    if (next !== document[field]) Object.assign(patch, { [field]: next })
  }
  let tracksChanged = false
  const tracks = document.tracks.map((track) => {
    const keyframes = update(track.keyframes)
    if (keyframes === track.keyframes) return track
    tracksChanged = true
    return { ...track, keyframes }
  })
  if (tracksChanged) patch.tracks = tracks
  return patch
}

/** Keyframes a person placed. Quality mirrors Depth, so it isn't counted twice. */
export const countDocumentKeyframes = (
  document: Pick<EditorSnapshot, KeyframeChannelField | "tracks">
) =>
  document.tracks.reduce((count, track) => count + track.keyframes.length, 0) +
  KEYFRAME_CHANNEL_IDS.filter((id) => id !== "quality").reduce(
    (count, id) => count + document[KEYFRAME_CHANNELS[id].field].length,
    0
  )

const sameScalarKeyframes = (a: ScalarKeyframe[], b: ScalarKeyframe[]) =>
  a.length === b.length &&
  a.every((keyframe, index) => {
    const other = b[index]
    return (
      keyframe.id === other.id &&
      Math.abs(keyframe.time - other.time) < 0.001 &&
      Math.abs(keyframe.value - other.value) < 0.0001 &&
      keyframe.easing === other.easing
    )
  })

/**
 * Curve smoothness is keyed alongside Depth: a deeper extrusion needs more
 * curve segments at the same moment. Quality keyframes therefore follow the
 * Depth keyframes one for one, keeping each one's own value. Returns the same
 * document when nothing needs to change.
 */
export const linkQualityKeyframes = (
  document: EditorSnapshot
): EditorSnapshot => {
  const previous = document.qualityKeyframes
  const depth = document.tracks.find((track) => track.id === "extrusion")
  if (!depth || depth.keyframes.length === 0)
    return previous.length === 0
      ? document
      : { ...document, qualityKeyframes: [] }

  const previousById = new Map(
    previous.map((keyframe) => [keyframe.id, keyframe])
  )
  const next = depth.keyframes.map((keyframe) => {
    const id = `quality-${keyframe.id}`
    const existing =
      previousById.get(id) ??
      previous.find((item) => keyframeTimeMatches(item.time, keyframe.time))
    return {
      id,
      time: keyframe.time,
      value: existing?.value ?? document.geometryQuality,
      easing: keyframe.easing,
    }
  })
  return sameScalarKeyframes(previous, next)
    ? document
    : { ...document, qualityKeyframes: next }
}
