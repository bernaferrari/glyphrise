import { describe, expect, it, vi } from "vitest"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { createEditorDocumentStore } from "./EditorDocumentStore"
import type { EditorSnapshot } from "./EditorModel"
import { createDefaultEditorSnapshot } from "./EditorProjectModel"
import {
  createMotionEditActions,
  type MotionEditActionsOptions,
} from "./MotionEditActions"

const scaleTrack = (
  overrides: Partial<EditorSnapshot["tracks"][number]> = {}
): EditorSnapshot["tracks"][number] => ({
  id: "scale",
  name: "Scale",
  color: "",
  min: 0.1,
  max: 3,
  defaultValue: 1,
  keyframes: [],
  ...overrides,
})

function setup(
  document: Partial<EditorSnapshot> = {},
  overrides: Partial<Omit<MotionEditActionsOptions, "store">> = {}
) {
  const store = createEditorDocumentStore({
    ...createDefaultEditorSnapshot(),
    activeRecipeId: "recipe",
    duration: 3,
    tracks: [scaleTrack()],
    rotationAxisKeyframes: [],
    ...document,
  })
  const initial = store.get()
  const options: MotionEditActionsOptions = {
    store,
    currentTime: 1.5,
    isPlaying: false,
    activeRotationOffset: { x: 0, y: 0, z: 0 },
    activeMoveOffset: { x: 0, y: 0, z: 0 },
    activeObjectScale: 1,
    setSelectedMotionTrackId: vi.fn(),
    setPreviewRotationOffset: vi.fn(),
    setIsScaleLocked: vi.fn(),
    canvas3DRef: {
      current: { resetRotation: vi.fn() } as unknown as SvgCanvasRef,
    },
    ...overrides,
  }
  const controls = createMotionEditActions(options)
  return { store, initial, options, controls }
}

describe("Reset view scale", () => {
  it("does not author transforms during playback", () => {
    const { store, initial, options, controls } = setup(
      { objectScaleAxes: { x: 2, y: 1, z: 0.5 } },
      {
        isPlaying: true,
        activeRotationOffset: { x: 0, y: 90, z: 0 },
        activeMoveOffset: { x: 12, y: 0, z: 0 },
        activeObjectScale: 2,
      }
    )
    controls.resetView()
    expect(options.canvas3DRef.current?.resetRotation).toHaveBeenCalledOnce()
    expect(store.get()).toBe(initial)
  })

  it("restores uniform scale without adding animation to a static object", () => {
    const { store, controls } = setup(
      { objectScale: 2, tracks: [scaleTrack({ defaultValue: 2 })] },
      { activeObjectScale: 2 }
    )
    controls.resetView()
    expect(store.get().objectScale).toBe(1)
    expect(store.get().tracks).toEqual([
      expect.objectContaining({ defaultValue: 1, keyframes: [] }),
    ])
    expect(store.get().activeRecipeId).toBeNull()
  })

  it("restores every separate scale axis", () => {
    const { store, initial, controls } = setup({
      objectScaleAxes: { x: 0.1, y: 2, z: 0.6 },
    })
    controls.resetView()
    expect(store.get().objectScaleAxes).toEqual({ x: 1, y: 1, z: 1 })
    expect(store.get().tracks).toBe(initial.tracks)
  })

  it("keys animated scale at the playhead while preserving the other moments", () => {
    const { store, controls } = setup(
      {
        tracks: [
          scaleTrack({
            defaultValue: 2,
            keyframes: [
              { id: "start", time: 0, value: 2, easing: "linear" },
              { id: "end", time: 3, value: 3, easing: "linear" },
            ],
          }),
        ],
      },
      { activeObjectScale: 2 }
    )
    controls.resetView()
    expect(store.get().tracks[0].keyframes).toEqual([
      expect.objectContaining({ id: "start", time: 0, value: 2 }),
      expect.objectContaining({ time: 1.5, value: 1 }),
      expect.objectContaining({ id: "end", time: 3, value: 3 }),
    ])
  })

  it("leaves a neutral object unchanged when resetting only the camera", () => {
    const { store, initial, options, controls } = setup()
    controls.resetView()
    expect(options.canvas3DRef.current?.resetRotation).toHaveBeenCalledOnce()
    expect(store.get()).toBe(initial)
  })
})

describe("Canvas rotation preview", () => {
  it("keeps drag and momentum frames out of the document until the final commit", () => {
    const { store, initial, options, controls } = setup()
    for (let frame = 1; frame <= 60; frame++) {
      controls.handleViewRotationSet(
        { x: 10, y: frame, z: 5 },
        { commit: false }
      )
    }
    expect(options.setPreviewRotationOffset).toHaveBeenLastCalledWith({
      x: 10,
      y: 60,
      z: 5,
    })
    expect(store.get()).toBe(initial)
    expect(options.setSelectedMotionTrackId).not.toHaveBeenCalled()

    controls.handleViewRotationSet({ x: 10, y: 60, z: 5 }, { commit: true })
    expect(store.get().rotationOffset).toEqual({ x: 10, y: 60, z: 5 })
    expect(store.get().activeRecipeId).toBeNull()
    expect(options.setPreviewRotationOffset).toHaveBeenLastCalledWith(null)
  })
})
