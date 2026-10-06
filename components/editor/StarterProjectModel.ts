import { appendGlyphriseSlash } from "../3d/SvgText"
import { createAnimationPreset } from "./AnimationPresetModel"
import { PRESET_ICONS, type PresetIcon } from "./IconLibrary"
import type { EditorSnapshot } from "./EditorModel"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import { createShapeStop } from "./ShapeSequenceModel"
import { createInitialTimelineTracks } from "./PropertyRegistry"

const icon = (id: string) => PRESET_ICONS.find((item) => item.id === id)!

export type StarterMotion = "spin" | "pulse" | "slash"

/**
 * The welcome screen starts from motion, not a still icon: a full spin (what
 * most people want), a heartbeat, and an on-to-off slash. Each opens already
 * moving and stays fully editable.
 */
export const STARTERS: {
  motion: StarterMotion
  label: string
  hint: string
  icon: PresetIcon
}[] = [
  { motion: "spin", label: "Spin", hint: "A full turn", icon: icon("star") },
  { motion: "pulse", label: "Pulse", hint: "A heartbeat", icon: icon("heart") },
  {
    motion: "slash",
    label: "Slash",
    hint: "On to off",
    icon: icon("bell"),
  },
]

/** The slashed partner of a starter icon, drawn the same way as wipe pairs. */
export const slashedIcon = (base: PresetIcon): PresetIcon => ({
  ...base,
  id: `${base.id}-off`,
  name: `${base.name} Off`,
  svgContent: appendGlyphriseSlash(base.svgContent),
})

const STARTER_DURATION = 3

export function createStarterEditorSnapshot(
  base: EditorSnapshot,
  iconId: string
): EditorSnapshot {
  const starter = STARTERS.find((item) => item.icon.id === iconId)
  if (!starter) throw new Error("Choose an available starter icon.")
  const blank = createBlankEditorSnapshot(base)
  const still = {
    ...blank,
    duration: STARTER_DURATION,
    shapes: [
      { ...createShapeStop(starter.icon, 0), transitionType: "cut" as const },
    ],
    rotationOffset: { x: 0, y: 0, z: 0 },
    moveOffset: { x: 0, y: 0, z: 0 },
    objectScale: 1,
    objectScaleAxes: { x: 1, y: 1, z: 1 },
  }

  if (starter.motion === "slash") {
    return {
      ...still,
      shapes: [
        {
          ...createShapeStop(starter.icon, 0.8),
          transitionType: "wipe" as const,
          wipeDirection: { x: 0.707, y: -0.707 },
          easing: "ease-in-out" as const,
        },
        createShapeStop(slashedIcon(starter.icon), 2.2),
      ],
    }
  }

  const scaleTrack =
    still.tracks.find((track) => track.id === "scale") ??
    createInitialTimelineTracks().find((track) => track.id === "scale")!
  const preset = createAnimationPreset({
    id: starter.motion,
    duration: STARTER_DURATION,
    intensity: 1,
    rotation: still.rotationOffset,
    scale: 1,
    scaleTrack,
  })
  return {
    ...still,
    rotationAxisKeyframes: preset.rotationKeyframes ?? [],
    tracks: still.tracks.map((track) =>
      track.id === "scale" && preset.scaleTrack ? preset.scaleTrack : track
    ),
  }
}

export function createImportedEditorSnapshot(
  base: EditorSnapshot,
  svgContent: string
): EditorSnapshot {
  const blank = createBlankEditorSnapshot(base)
  return {
    ...blank,
    duration: 3,
    shapes: [
      {
        ...createShapeStop(
          { id: "custom", name: "Custom", svgContent, defaultTint: "#7c5cff" },
          0
        ),
        transitionType: "cut",
      },
    ],
  }
}
