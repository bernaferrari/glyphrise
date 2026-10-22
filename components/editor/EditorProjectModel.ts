import {
  DEFAULT_GEOMETRY_SETTINGS,
  DEFAULT_LIGHT_SETTINGS,
  DEFAULT_ROTATION_END,
  DEFAULT_ROTATION_START,
  DEFAULT_TRANSFORM_SETTINGS,
  type EditorSnapshot,
} from "./EditorModel"
import { googleMeshFillStops } from "./FillStopModel"
import { mapDocumentKeyframes } from "./KeyframeChannelModel"
import { DEFAULT_MATERIAL_SETTINGS } from "./MaterialEditorModel"
import { createInitialTimelineTracks } from "./PropertyRegistry"
import {
  createBlankShapeSequence,
  createDefaultShapeSequence,
} from "./ShapeSequenceModel"

const DEFAULT_DURATION = 5

/** The example document a fresh editor opens with: a spinning chrome icon. */
export const createDefaultEditorSnapshot = (): EditorSnapshot => ({
  activeRecipeId: null,
  shapes: createDefaultShapeSequence(),
  duration: DEFAULT_DURATION,
  materialPreset: "chrome",
  materialSettings: { ...DEFAULT_MATERIAL_SETTINGS },
  materialKeyframes: [],
  ...DEFAULT_GEOMETRY_SETTINGS,
  qualityKeyframes: [],
  innerScaleKeyframes: [],
  objectScale: DEFAULT_TRANSFORM_SETTINGS.objectScale,
  objectScaleAxes: DEFAULT_TRANSFORM_SETTINGS.objectScaleAxes,
  moveOffset: DEFAULT_TRANSFORM_SETTINGS.moveOffset,
  moveKeyframes: [],
  enableGradient: true,
  fillMode: "gradient",
  fillColor: "#4285F4",
  fillColorSecondary: "#00C796",
  fillGradientType: "mesh",
  fillStops: googleMeshFillStops(),
  fillKeyframes: [],
  rotationOffset: DEFAULT_TRANSFORM_SETTINGS.rotationOffset,
  rotationAxisKeyframes: [
    {
      id: "rotation-axis-start",
      time: 0,
      value: { x: 0, y: DEFAULT_ROTATION_START, z: 0 },
      easing: "ease-in-out",
    },
    {
      id: "rotation-axis-end",
      time: DEFAULT_DURATION,
      value: { x: 0, y: DEFAULT_ROTATION_END, z: 0 },
      easing: "ease-in-out",
    },
  ],
  ...DEFAULT_LIGHT_SETTINGS,
  keyLightPositionKeyframes: [],
  tracks: createInitialTimelineTracks(),
})

export const createBlankEditorSnapshot = (
  baseSnapshot: EditorSnapshot
): EditorSnapshot => ({
  ...baseSnapshot,
  ...mapDocumentKeyframes(baseSnapshot, (keyframes) =>
    keyframes.length ? [] : keyframes
  ),
  activeRecipeId: null,
  shapes: createBlankShapeSequence(),
})
