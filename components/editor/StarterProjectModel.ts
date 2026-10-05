import { PRESET_ICONS } from "./IconLibrary"
import type { EditorSnapshot } from "./EditorModel"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import { createShapeStop } from "./ShapeSequenceModel"

export const STARTER_ARTWORK = ["heart", "star", "bolt"].map((id) =>
  PRESET_ICONS.find((icon) => icon.id === id)!
)

export function createStarterEditorSnapshot(
  base: EditorSnapshot,
  iconId: string
): EditorSnapshot {
  const icon = STARTER_ARTWORK.find((item) => item.id === iconId)
  if (!icon) throw new Error("Choose an available starter icon.")
  const blank = createBlankEditorSnapshot(base)
  return {
    ...blank,
    duration: 3,
    shapes: [{ ...createShapeStop(icon, 0), transitionType: "cut" }],
    rotationOffset: { x: 0, y: 0, z: 0 },
    moveOffset: { x: 0, y: 0, z: 0 },
    objectScale: 1,
    objectScaleAxes: { x: 1, y: 1, z: 1 },
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
