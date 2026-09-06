import { describe, expect, it } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import {
  beginEditorHistoryGesture,
  cancelEditorHistoryGesture,
  commitEditorHistoryGesture,
  createEditorHistoryState,
  recordEditorHistorySnapshot,
  redoEditorHistory,
  undoEditorHistory,
  updateEditorHistoryGesture,
} from "./EditorHistory"

const snapshotAt = (fillColor: string): EditorSnapshot => ({
  activeRecipeId: null,
  shapes: [
    {
      id: "clip-1",
      time: 0,
      iconId: "heart",
      iconName: "Heart",
      svgContent: `<svg viewBox="0 0 24 24"><path d="M0 0h10v10H0z"/></svg>`,
      color: "#ffffff",
      colorSecondary: "#000000",
      easing: "ease-in-out",
      transitionType: "fade",
      wipeDirection: { x: 0, y: 0 },
    },
  ],
  duration: 5,
  materialPreset: "chrome",
  materialSettings: {
    roughness: 0.2,
    metalness: 0.5,
    reflectance: 0.8,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    transmission: 0,
    thickness: 0.4,
    emissiveIntensity: 0,
  },
  materialKeyframes: [],
  extrusionDepth: 10,
  bevelEnabled: true,
  bevelThickness: 0.12,
  bevelSize: 0.06,
  bevelSegments: 4,
  geometryQuality: 0.045,
  qualityKeyframes: [],
  layerSpacing: 0.16,
  innerElementScale: { x: 1, y: 1, z: 1 },
  innerScaleKeyframes: [],
  objectScale: 1,
  objectScaleAxes: { x: 1, y: 1, z: 1 },
  moveOffset: { x: 0, y: 0, z: 0 },
  moveKeyframes: [],
  enableGradient: false,
  fillMode: "solid",
  fillColor,
  fillColorSecondary: "#000000",
  fillGradientType: "linear",
  fillStops: [],
  fillKeyframes: [],
  rotationOffset: { x: 0, y: 0, z: 0 },
  rotationAxisKeyframes: [],
  keyLightColor: "#ffffff",
  keyLightIntensity: 1,
  keyLightPosition: { x: 5, y: 5, z: 4 },
  keyLightSoftness: 0.35,
  keyLightPositionKeyframes: [],
  tracks: [],
})

const seededHistory = () => {
  const a = snapshotAt("#aaaaaa")
  const b = snapshotAt("#bbbbbb")
  const state = createEditorHistoryState(a)
  recordEditorHistorySnapshot(state, b, 50)
  return { state, a, b }
}

describe("editor history gesture transactions", () => {
  it("undoes a just-committed gesture immediately, then redoes it", () => {
    const { state, b } = seededHistory()
    const c = snapshotAt("#cccccc")

    beginEditorHistoryGesture(state, b, 50)
    updateEditorHistoryGesture(state, c)
    commitEditorHistoryGesture(state, c)

    const undone = undoEditorHistory(state, c, 50)
    expect(undone).toEqual(b)

    const redone = redoEditorHistory(state, undone!, 50)
    expect(redone).toEqual(c)
  })

  it("undoes a committed gesture after 50 ms without waiting for the 180 ms flush", async () => {
    const { state, b } = seededHistory()
    const c = snapshotAt("#cccccc")

    beginEditorHistoryGesture(state, b, 50)
    updateEditorHistoryGesture(state, c)
    commitEditorHistoryGesture(state, c)

    await new Promise((resolve) => setTimeout(resolve, 50))

    const undone = undoEditorHistory(state, c, 50)
    expect(undone).toEqual(b)
    expect(redoEditorHistory(state, undone!, 50)).toEqual(c)
  })

  it("records two rapid gestures as separate undo steps", () => {
    const { state, b } = seededHistory()
    const c = snapshotAt("#cccccc")
    const d = snapshotAt("#dddddd")

    beginEditorHistoryGesture(state, b, 50)
    updateEditorHistoryGesture(state, c)
    commitEditorHistoryGesture(state, c)

    beginEditorHistoryGesture(state, c, 50)
    updateEditorHistoryGesture(state, d)
    commitEditorHistoryGesture(state, d)

    const undone = undoEditorHistory(state, d, 50)
    expect(undone).toEqual(c)
    expect(redoEditorHistory(state, undone!, 50)).toEqual(d)
  })

  it("discards a cancelled gesture so undo/redo stay on the pre-gesture document", () => {
    const { state, a, b } = seededHistory()
    const c = snapshotAt("#cccccc")

    beginEditorHistoryGesture(state, b, 50)
    updateEditorHistoryGesture(state, c)
    const restored = cancelEditorHistoryGesture(state)

    expect(restored).toEqual(b)
    expect(undoEditorHistory(state, restored!, 50)).toEqual(a)
    expect(redoEditorHistory(state, a, 50)).toEqual(b)
  })
})
