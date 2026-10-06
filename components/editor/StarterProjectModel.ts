import type { MaterialPresetId } from "../3d/MaterialPresets"
import { appendGlyphriseSlash } from "../3d/SvgText"
import { createAnimationPreset } from "./AnimationPresetModel"
import {
  createEditorId,
  type EditorSnapshot,
  type Vec3,
  type Vector3Keyframe,
} from "./EditorModel"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import { materialDefaultSettings } from "./FinishRegistry"
import { PRESET_ICONS, type PresetIcon } from "./IconLibrary"
import { createInitialTimelineTracks } from "./PropertyRegistry"
import { createShapeStop } from "./ShapeSequenceModel"
import { completePathOverride } from "./SvgLayerModel"
import type { EasingType, FillGradientType, FillStop } from "./TimelineModel"

const icon = (id: string) => PRESET_ICONS.find((item) => item.id === id)!

export type StarterMotion = "spin" | "pulse" | "slash-turn" | "ring"

export type Starter = {
  id: string
  label: string
  hint: string
  motion: StarterMotion
  icon: PresetIcon
  finish: MaterialPresetId
  fill: { type: FillGradientType; stops: FillStop[] }
  /** Key light intensity, when the finish reads better brighter. */
  brightness?: number
  /** Per-layer depth, keyed by SVG layer id (`path:shape`). */
  layerDepths?: Record<string, number>
}

/** Nine mesh nodes, row by row; the editor's gradients are always meshes. */
const mesh = (id: string, colors: string[]) => ({
  type: "mesh" as const,
  stops: colors.map((color, index) => ({
    id: `${id}-${index}`,
    color,
    position: index / 8,
  })),
})

const CANDY = mesh("candy", [
  "#FFF7AD",
  "#FF8BC7",
  "#C9A7FF",
  "#FFB86B",
  "#FF4FA3",
  "#8B6DFF",
  "#62EAD9",
  "#29C7FF",
  "#6E7BFF",
])

/**
 * The welcome screen starts from a finished look, not a still icon. Each
 * starter shows off something different (mesh color, a pulse, a wipe, a
 * keyframed wobble), opens already moving, and stays fully editable.
 */
export const STARTERS: Starter[] = [
  {
    id: "calendar",
    label: "Calendar",
    hint: "Spins",
    motion: "spin",
    // The Material Symbol itself, so the icon picker shows it as selected.
    icon: {
      ...icon("calendar"),
      id: "material-symbol-outlined-calendar_month",
    },
    finish: "satin",
    fill: CANDY,
  },
  {
    id: "heart",
    label: "Heart",
    hint: "Pulses",
    motion: "pulse",
    icon: icon("heart"),
    finish: "satin",
    fill: mesh("rose", [
      "#FFD1E3",
      "#FF8FB8",
      "#FF5C8F",
      "#FFB3CE",
      "#FF6B9A",
      "#F43F75",
      "#FF9EC0",
      "#E8336A",
      "#C81E55",
    ]),
  },
  {
    id: "wifi",
    label: "Wi‑Fi off",
    hint: "Switches off",
    motion: "slash-turn",
    icon: icon("wifi"),
    finish: "satin",
    brightness: 1.4,
    fill: mesh("sky", [
      "#B8EBFF",
      "#6FD3FF",
      "#3DB5FF",
      "#8AD8FF",
      "#3D9BFF",
      "#2F6BFF",
      "#5EC0FF",
      "#3557F5",
      "#2A3FD9",
    ]),
  },
  {
    id: "bell",
    label: "Bell",
    hint: "Rings",
    motion: "ring",
    icon: icon("bell"),
    finish: "satin",
    fill: mesh("gold", [
      "#FFF3C4",
      "#FFE08A",
      "#FFC94D",
      "#FFE7A3",
      "#FFC93D",
      "#F5A623",
      "#FFD56B",
      "#F59E0B",
      "#D97706",
    ]),
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

const rotationKeys = (
  values: Array<[time: number, rotation: Partial<Vec3>]>,
  easing: EasingType
): Vector3Keyframe[] =>
  values.map(([time, rotation]) => ({
    id: createEditorId("rotation"),
    time,
    value: { x: 0, y: 0, z: 0, ...rotation },
    easing,
  }))

export function createStarterEditorSnapshot(
  base: EditorSnapshot,
  starterId: string
): EditorSnapshot {
  const starter = STARTERS.find((item) => item.id === starterId)
  if (!starter) throw new Error("Choose an available starter.")
  const blank = createBlankEditorSnapshot(base)
  const { fill } = starter
  const shapeLook = {
    color: fill.stops[0].color,
    colorSecondary: fill.stops.at(-1)!.color,
    fillGradientType: fill.type,
    fillStops: fill.stops.map((stop) => ({ ...stop })),
    pathOverrides: Object.entries(starter.layerDepths ?? {}).map(
      ([id, depthMultiplier]) =>
        completePathOverride(id, undefined, { depthMultiplier })
    ),
  }
  const still: EditorSnapshot = {
    ...blank,
    duration: STARTER_DURATION,
    shapes: [
      {
        ...createShapeStop(starter.icon, 0),
        ...shapeLook,
        transitionType: "cut" as const,
      },
    ],
    materialPreset: starter.finish,
    materialSettings: materialDefaultSettings(starter.finish),
    enableGradient: true,
    fillMode: "gradient",
    fillColor: shapeLook.color,
    fillColorSecondary: shapeLook.colorSecondary,
    fillGradientType: fill.type,
    fillStops: fill.stops.map((stop) => ({ ...stop })),
    keyLightIntensity: starter.brightness ?? blank.keyLightIntensity,
    rotationOffset: { x: 0, y: 0, z: 0 },
    moveOffset: { x: 0, y: 0, z: 0 },
    objectScale: 1,
    objectScaleAxes: { x: 1, y: 1, z: 1 },
  }

  if (starter.motion === "slash-turn") {
    return {
      ...still,
      shapes: [
        {
          ...createShapeStop(starter.icon, 0.8),
          ...shapeLook,
          transitionType: "wipe" as const,
          wipeDirection: { x: 0.707, y: -0.707 },
          easing: "ease-in-out" as const,
        },
        { ...createShapeStop(slashedIcon(starter.icon), 2.2), ...shapeLook },
      ],
      // One full turn that eases through the wipe, so the slash lands mid-spin.
      rotationAxisKeyframes: rotationKeys(
        [
          [0, {}],
          [STARTER_DURATION, { y: 360 }],
        ],
        "ease-in-out"
      ),
    }
  }

  if (starter.motion === "ring") {
    // A quick, decaying swing, then a rest before the loop rings again.
    return {
      ...still,
      rotationAxisKeyframes: rotationKeys(
        [
          [0, {}],
          [0.2, { z: 22 }],
          [0.45, { z: -18 }],
          [0.7, { z: 12 }],
          [0.95, { z: -6 }],
          [1.2, {}],
          [STARTER_DURATION, {}],
        ],
        "ease-in-out"
      ),
    }
  }

  const scaleTrack =
    still.tracks.find((track) => track.id === "scale") ??
    createInitialTimelineTracks().find((track) => track.id === "scale")!
  const preset = createAnimationPreset({
    id: starter.motion,
    duration: STARTER_DURATION,
    intensity: starter.motion === "pulse" ? 0.7 : 1,
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
