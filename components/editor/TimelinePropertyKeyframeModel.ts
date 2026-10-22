import type {
  EditorSnapshot,
  LightPosition,
  MaterialSettings,
} from "./EditorModel"
import { createEditorId } from "./EditorModel"
import {
  addKeyframeAtTime,
  keyframeTimeMatches,
  upsertVectorKeyframeAtTime,
} from "./EditorKeyframeModel"
import {
  KEYFRAME_CHANNELS,
  type KeyframeChannelField,
  type KeyframeChannelId,
  type KeyframeChannels,
} from "./KeyframeChannelModel"
import type { EasingType, FillKeyframe } from "./TimelineModel"

/**
 * Timeline property rows edit one or more keyframe channels. Every operation
 * here is pure: it takes the document's keyframe lists and returns a patch
 * with only the lists it changed.
 *
 * A Style keyframe is the fill and the finish keyed at the same moment, so the
 * Style row addresses its keyframes by time (`style-1.250`), not by id.
 */
const ROW_CHANNELS: Record<string, KeyframeChannelId[]> = {
  style: ["fill", "material"],
  fill: ["fill"],
  material: ["material"],
  "light-position": ["lightPosition"],
  rotation: ["rotation"],
  move: ["move"],
  quality: ["quality"],
}

const STYLE_ROW_ID = "style"
const STYLE_ROW_PREFIX = "style-"

type RowKeyframe = { id: string; time: number; easing: EasingType }
type RowPatch = Partial<EditorSnapshot>

export const styleKeyframeTimeFromId = (keyframeId: string) =>
  Number(keyframeId.replace(STYLE_ROW_PREFIX, ""))

const keyframeMatcher = (rowId: string, keyframeId: string | null) => {
  if (keyframeId === null) return () => true
  if (rowId !== STYLE_ROW_ID)
    return (keyframe: RowKeyframe) => keyframe.id === keyframeId
  const time = styleKeyframeTimeFromId(keyframeId)
  return (keyframe: RowKeyframe) => keyframeTimeMatches(keyframe.time, time)
}

const editRow = (
  document: KeyframeChannels,
  rowId: string,
  edit: (keyframes: RowKeyframe[], idPrefix: string) => RowKeyframe[]
): RowPatch => {
  const patch: RowPatch = {}
  for (const channelId of ROW_CHANNELS[rowId] ?? []) {
    const { field, idPrefix } = KEYFRAME_CHANNELS[channelId]
    const keyframes = document[field] as RowKeyframe[]
    const next = edit(keyframes, idPrefix)
    if (next !== keyframes) Object.assign(patch, { [field]: next })
  }
  return patch
}

const byTime = <T extends { time: number }>(a: T, b: T) => a.time - b.time

export const clearPropertyRowKeyframes = (
  document: KeyframeChannels,
  rowId: string
) =>
  editRow(document, rowId, (keyframes) => (keyframes.length ? [] : keyframes))

export const removePropertyRowKeyframe = (
  document: KeyframeChannels,
  rowId: string,
  keyframeId: string
) => {
  const matches = keyframeMatcher(rowId, keyframeId)
  return editRow(document, rowId, (keyframes) =>
    keyframes.filter((keyframe) => !matches(keyframe))
  )
}

export const movePropertyRowKeyframe = (
  document: KeyframeChannels,
  rowId: string,
  keyframeId: string,
  time: number
) => {
  const matches = keyframeMatcher(rowId, keyframeId)
  return editRow(document, rowId, (keyframes) =>
    keyframes
      .map((keyframe) => (matches(keyframe) ? { ...keyframe, time } : keyframe))
      .sort(byTime)
  )
}

/** `keyframeId: null` eases every keyframe on the row. */
export const setPropertyRowKeyframeEasing = (
  document: KeyframeChannels,
  rowId: string,
  keyframeId: string | null,
  easing: EasingType
) => {
  const matches = keyframeMatcher(rowId, keyframeId)
  return editRow(document, rowId, (keyframes) =>
    keyframes.map((keyframe) =>
      matches(keyframe) ? { ...keyframe, easing } : keyframe
    )
  )
}

/**
 * Copies one keyframe to `time` (After Effects' copy and paste at the
 * playhead), replacing whatever was keyed there on the same property.
 */
export const duplicateKeyframeToTime = <T extends { id: string; time: number }>(
  keyframes: T[],
  matches: (keyframe: T) => boolean,
  time: number,
  idPrefix: string
): T[] => {
  const sources = keyframes.filter(matches)
  if (sources.length === 0) return keyframes
  return [
    ...keyframes.filter(
      (keyframe) => !keyframeTimeMatches(keyframe.time, time)
    ),
    ...sources.map((source) => ({
      ...structuredClone(source),
      id: createEditorId(idPrefix),
      time,
    })),
  ].sort(byTime)
}

export const duplicatePropertyRowKeyframe = (
  document: KeyframeChannels,
  rowId: string,
  keyframeId: string,
  time: number
) => {
  const matches = keyframeMatcher(rowId, keyframeId)
  return editRow(document, rowId, (keyframes, idPrefix) =>
    duplicateKeyframeToTime(keyframes, matches, time, idPrefix)
  )
}

export type TimelinePropertyKeyframeValues = {
  duration: number
  selectedShapeFillStops: FillKeyframe["stops"]
  selectedShapeGradientType: FillKeyframe["gradientType"]
  activeMaterialSettings: MaterialSettings
  activeKeyLightPosition: LightPosition
  activeRotationOffset: LightPosition
  activeMoveOffset: LightPosition
}

/** What a new keyframe on each channel holds: the value shown at the playhead. */
const createChannelKeyframes = (
  document: KeyframeChannels,
  channelId: KeyframeChannelId,
  time: number,
  values: TimelinePropertyKeyframeValues
): Partial<KeyframeChannels> => {
  const vector = (
    field: KeyframeChannelField & keyof KeyframeChannels,
    idPrefix: string,
    value: LightPosition
  ) => ({
    [field]: upsertVectorKeyframeAtTime({
      keyframes: document[field] as KeyframeChannels["moveKeyframes"],
      idPrefix,
      value,
      time,
      duration: values.duration,
      createIfMissing: true,
    }),
  })
  switch (channelId) {
    case "fill":
      return {
        fillKeyframes: addKeyframeAtTime({
          keyframes: document.fillKeyframes,
          time,
          create: (easing) => ({
            id: createEditorId("fill"),
            time,
            stops: values.selectedShapeFillStops,
            gradientType: values.selectedShapeGradientType,
            easing,
          }),
        }),
      }
    case "material":
      return {
        materialKeyframes: addKeyframeAtTime({
          keyframes: document.materialKeyframes,
          time,
          create: (easing) => ({
            id: createEditorId("material"),
            time,
            value: values.activeMaterialSettings,
            easing,
          }),
        }),
      }
    case "lightPosition":
      return vector(
        "keyLightPositionKeyframes",
        "light-position",
        values.activeKeyLightPosition
      )
    case "rotation":
      return vector(
        "rotationAxisKeyframes",
        "rotation",
        values.activeRotationOffset
      )
    case "move":
      return vector("moveKeyframes", "move", values.activeMoveOffset)
    // Quality follows Depth, and inner scale has no row of its own.
    case "quality":
    case "innerScale":
      return {}
  }
}

export const addPropertyRowKeyframe = (
  document: KeyframeChannels,
  rowId: string,
  time: number,
  values: TimelinePropertyKeyframeValues
): RowPatch =>
  Object.assign(
    {},
    ...(ROW_CHANNELS[rowId] ?? []).map((channelId) =>
      createChannelKeyframes(document, channelId, time, values)
    )
  )
