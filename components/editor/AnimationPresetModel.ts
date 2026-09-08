import {
  createEditorId,
  type Vector3Keyframe,
  type LightPosition,
} from "./EditorModel"
import type { TimelineTrack } from "./TimelineModel"

export type AnimationPresetId = "spin" | "tilt" | "pulse"
export const ANIMATION_PRESETS = [
  {
    id: "spin",
    name: "Spin",
    description: "Turn around the vertical axis.",
    property: "Rotation",
  },
  {
    id: "tilt",
    name: "Tilt",
    description: "Lean to one side and return.",
    property: "Rotation",
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Grow gently and return to size.",
    property: "Scale",
  },
] as const

// Presets return only the affected animation. Artwork and material state never enter this boundary.
export function createAnimationPreset({
  id,
  duration,
  intensity,
  rotation,
  scale,
  scaleTrack,
}: {
  id: AnimationPresetId
  duration: number
  intensity: number
  rotation: LightPosition
  scale: number
  scaleTrack: TimelineTrack
}): { rotationKeyframes?: Vector3Keyframe[]; scaleTrack?: TimelineTrack } {
  const amount = Math.max(0.25, Math.min(2, intensity))
  const end = Math.max(0.5, Math.min(30, duration))
  if (id === "pulse") {
    const expanded = Math.min(scaleTrack.max, scale * (1 + 0.25 * amount))
    const peak =
      expanded > scale
        ? expanded
        : Math.max(scaleTrack.min, scale * (1 - 0.25 * amount))
    return {
      scaleTrack: {
        ...scaleTrack,
        keyframes: [
          {
            id: createEditorId("scale"),
            time: 0,
            value: scale,
            easing: "ease-in-out",
          },
          {
            id: createEditorId("scale"),
            time: end / 2,
            value: peak,
            easing: "ease-in-out",
          },
          {
            id: createEditorId("scale"),
            time: end,
            value: scale,
            easing: "ease-in-out",
          },
        ],
      },
    }
  }
  const values =
    id === "spin"
      ? [
          { time: 0, value: rotation },
          { time: end, value: { ...rotation, y: rotation.y + 360 * amount } },
        ]
      : [
          { time: 0, value: rotation },
          {
            time: end / 2,
            value: { ...rotation, z: rotation.z + 25 * amount },
          },
          { time: end, value: rotation },
        ]
  return {
    rotationKeyframes: values.map(({ time, value }) => ({
      id: createEditorId("rotation"),
      time,
      value: { ...value },
      easing: id === "spin" ? "linear" : "ease-in-out",
    })),
  }
}
