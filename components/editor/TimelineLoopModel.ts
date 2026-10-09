import type {
  MaterialKeyframe,
  MaterialSettings,
  ScalarKeyframe,
  Vec3,
  Vector3Keyframe,
} from "./EditorModel"
import { createEditorId } from "./EditorModel"
import { keyframeTimeMatches } from "./EditorKeyframeModel"
import type { EasingType, FillKeyframe, TimelineTrack } from "./TimelineModel"

/**
 * "End where it starts": a property loops seamlessly when its value at the
 * end of the timeline equals its value at the start. Closing a loop adds (or
 * updates) a keyframe at the end with the opening value.
 *
 * Rotation is the exception that makes this worth a model: 0° → 360° already
 * loops, and a spin left at 200° should finish its turn at 360°, not unwind
 * back to 0°. So rotation closes on the full turn nearest its last keyframe.
 */

type LoopKeyframe = { id: string; time: number; easing: EasingType }

type LoopRule<T extends LoopKeyframe> = {
  idPrefix: string
  /** The keyframe the loop has to return to, shaped like `last`. */
  closingValue: (first: T, last: T) => T
  sameValue: (a: T, b: T) => boolean
}

const EPSILON = 1e-4
const near = (a: number, b: number) => Math.abs(a - b) < EPSILON
const sameVec3 = (a: Vec3, b: Vec3) =>
  near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z)

/** The angle equivalent to `start` (mod 360°) closest to `last`. */
export const nearestTurn = (start: number, last: number) =>
  start + 360 * Math.round((last - start) / 360)

const sortedByTime = <T extends LoopKeyframe>(keyframes: T[]) =>
  [...keyframes].sort((a, b) => a.time - b.time)

const loopIsOpen = <T extends LoopKeyframe>(
  keyframes: T[],
  rule: LoopRule<T>
) => {
  // No keyframes, or one, is a constant value: it always loops.
  if (keyframes.length < 2) return false
  const sorted = sortedByTime(keyframes)
  const last = sorted.at(-1)!
  return !rule.sameValue(rule.closingValue(sorted[0], last), last)
}

const closeLoop = <T extends LoopKeyframe>(
  keyframes: T[],
  duration: number,
  rule: LoopRule<T>
): T[] => {
  if (!loopIsOpen(keyframes, rule)) return keyframes
  const sorted = sortedByTime(keyframes)
  const last = sorted.at(-1)!
  const closing = rule.closingValue(sorted[0], last)
  // A keyframe already at the end is where the loop closes; anything earlier
  // gets a new closing keyframe, so the last move is kept and eased back.
  if (keyframeTimeMatches(last.time, duration)) {
    return sorted.map((keyframe) =>
      keyframe === last
        ? { ...closing, id: last.id, time: last.time, easing: last.easing }
        : keyframe
    )
  }
  return [
    ...sorted,
    {
      ...closing,
      id: createEditorId(rule.idPrefix),
      time: duration,
      easing: last.easing,
    },
  ]
}

const scalarRule = <T extends ScalarKeyframe>(
  idPrefix: string
): LoopRule<T> => ({
  idPrefix,
  closingValue: (first, last) => ({ ...last, value: first.value }),
  sameValue: (a, b) => near(a.value, b.value),
})

const vectorRule = (idPrefix: string): LoopRule<Vector3Keyframe> => ({
  idPrefix,
  closingValue: (first, last) => ({ ...last, value: { ...first.value } }),
  sameValue: (a, b) => sameVec3(a.value, b.value),
})

const rotationRule: LoopRule<Vector3Keyframe> = {
  idPrefix: "rotation",
  closingValue: (first, last) => ({
    ...last,
    value: {
      x: nearestTurn(first.value.x, last.value.x),
      y: nearestTurn(first.value.y, last.value.y),
      z: nearestTurn(first.value.z, last.value.z),
    },
  }),
  sameValue: (a, b) => sameVec3(a.value, b.value),
}

const materialRule: LoopRule<MaterialKeyframe> = {
  idPrefix: "material",
  closingValue: (first, last) => ({ ...last, value: { ...first.value } }),
  sameValue: (a, b) =>
    (Object.keys(a.value) as (keyof MaterialSettings)[]).every((key) =>
      near(a.value[key], b.value[key])
    ),
}

const fillRule: LoopRule<FillKeyframe> = {
  idPrefix: "fill",
  closingValue: (first, last) => ({
    ...last,
    gradientType: first.gradientType,
    stops: first.stops.map((stop) => ({ ...stop })),
  }),
  sameValue: (a, b) =>
    a.gradientType === b.gradientType &&
    a.stops.length === b.stops.length &&
    a.stops.every((stop, index) => {
      const other = b.stops[index]
      return (
        stop.color.toLowerCase() === other.color.toLowerCase() &&
        near(stop.position, other.position) &&
        near(stop.x ?? 0, other.x ?? 0) &&
        near(stop.y ?? 0, other.y ?? 0)
      )
    }),
}

export type TimelineLoopState = {
  tracks: TimelineTrack[]
  fillKeyframes: FillKeyframe[]
  materialKeyframes: MaterialKeyframe[]
  keyLightPositionKeyframes: Vector3Keyframe[]
  rotationAxisKeyframes: Vector3Keyframe[]
  moveKeyframes: Vector3Keyframe[]
  qualityKeyframes: ScalarKeyframe[]
  innerScaleKeyframes: Vector3Keyframe[]
}

type KeyframeListKey = Exclude<keyof TimelineLoopState, "tracks">

const RULES: {
  [Key in KeyframeListKey]: LoopRule<TimelineLoopState[Key][number]>
} = {
  fillKeyframes: fillRule,
  materialKeyframes: materialRule,
  keyLightPositionKeyframes: vectorRule("light"),
  rotationAxisKeyframes: rotationRule,
  moveKeyframes: vectorRule("move"),
  qualityKeyframes: scalarRule("quality"),
  innerScaleKeyframes: vectorRule("inner-scale"),
}

/** Timeline property rows and the keyframe lists they draw. */
const ROW_LISTS: Record<string, KeyframeListKey[]> = {
  style: ["fillKeyframes", "materialKeyframes"],
  "light-position": ["keyLightPositionKeyframes"],
  rotation: ["rotationAxisKeyframes"],
  move: ["moveKeyframes"],
}

const listIsOpen = <Key extends KeyframeListKey>(
  state: TimelineLoopState,
  key: Key
) =>
  loopIsOpen(
    state[key] as LoopKeyframe[],
    RULES[key] as unknown as LoopRule<LoopKeyframe>
  )

const closeList = <Key extends KeyframeListKey>(
  state: TimelineLoopState,
  key: Key,
  duration: number
) =>
  closeLoop(
    state[key] as LoopKeyframe[],
    duration,
    RULES[key] as unknown as LoopRule<LoopKeyframe>
  ) as TimelineLoopState[Key]

const trackRule = scalarRule<ScalarKeyframe>("track")

/**
 * Row and track ids (as the timeline names them) whose end doesn't match
 * their start. Lists without a timeline row are reported by list name.
 */
export const openLoopIds = (state: TimelineLoopState): string[] => {
  const rows = Object.entries(ROW_LISTS)
    .filter(([, keys]) => keys.some((key) => listIsOpen(state, key)))
    .map(([rowId]) => rowId)
  const shown = new Set(Object.values(ROW_LISTS).flat())
  const unlisted = (Object.keys(RULES) as KeyframeListKey[]).filter(
    (key) => !shown.has(key) && listIsOpen(state, key)
  )
  const tracks = state.tracks
    .filter((track) => loopIsOpen(track.keyframes, trackRule))
    .map((track) => track.id)
  return [...rows, ...tracks, ...unlisted]
}

/**
 * Closes the loop for one row or track (by id), or for everything when no id
 * is given. Only changed lists are returned, so callers update just those.
 */
export const closeTimelineLoops = (
  state: TimelineLoopState,
  duration: number,
  id?: string
): Partial<TimelineLoopState> => {
  const keys = id
    ? (ROW_LISTS[id] ?? [])
    : (Object.keys(RULES) as KeyframeListKey[])
  const changes: Partial<TimelineLoopState> = {}
  for (const key of keys) {
    const next = closeList(state, key, duration)
    if (next !== state[key]) Object.assign(changes, { [key]: next })
  }
  const closesTracks = !id || !ROW_LISTS[id]
  if (closesTracks) {
    let changed = false
    const tracks = state.tracks.map((track) => {
      if (id && track.id !== id) return track
      const keyframes = closeLoop(track.keyframes, duration, trackRule)
      if (keyframes === track.keyframes) return track
      changed = true
      return { ...track, keyframes }
    })
    if (changed) changes.tracks = tracks
  }
  return changes
}
