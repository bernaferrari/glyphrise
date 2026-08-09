import type { EditorSnapshot } from "./EditorModel"
import { createBlankShapeSequence } from "./ShapeSequenceModel"

export const createBlankEditorSnapshot = (
  baseSnapshot: EditorSnapshot
): EditorSnapshot => ({
  ...baseSnapshot,
  activeRecipeId: null,
  shapes: createBlankShapeSequence(),
  materialKeyframes: [],
  qualityKeyframes: [],
  innerScaleKeyframes: [],
  moveKeyframes: [],
  fillKeyframes: [],
  rotationAxisKeyframes: [],
  keyLightPositionKeyframes: [],
  tracks: baseSnapshot.tracks.map((track) => ({ ...track, keyframes: [] })),
})
