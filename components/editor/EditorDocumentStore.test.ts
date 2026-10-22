import { describe, expect, it, vi } from "vitest"
import { createEditorDocumentStore } from "./EditorDocumentStore"
import { createDefaultEditorSnapshot } from "./EditorProjectModel"
import {
  countDocumentKeyframes,
  mapDocumentKeyframes,
} from "./KeyframeChannelModel"
import {
  addPropertyRowKeyframe,
  movePropertyRowKeyframe,
  removePropertyRowKeyframe,
} from "./TimelinePropertyKeyframeModel"
import { editQuality, editRotation, editScalarTrack } from "./DocumentEditModel"

const depthKeyed = () => {
  const document = createDefaultEditorSnapshot()
  return {
    ...document,
    tracks: document.tracks.map((track) =>
      track.id === "extrusion"
        ? {
            ...track,
            keyframes: [
              { id: "d0", time: 0, value: 10, easing: "linear" as const },
              { id: "d1", time: 2, value: 30, easing: "linear" as const },
            ],
          }
        : track
    ),
  }
}

describe("EditorDocumentStore", () => {
  it("notifies once per real change and ignores equal values", () => {
    const store = createEditorDocumentStore(createDefaultEditorSnapshot())
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.get()
    store.set("objectScaleAxes", { ...before.objectScaleAxes })
    expect(store.get()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
    store.patch({ bevelSize: 0.2, activeRecipeId: null })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.get().bevelSize).toBe(0.2)
  })

  it("keeps edits an updater makes to other fields", () => {
    const store = createEditorDocumentStore(createDefaultEditorSnapshot())
    store.set("bevelSize", (size) => {
      store.set("bevelThickness", 0.5)
      return size + 1
    })
    expect(store.get().bevelThickness).toBe(0.5)
  })

  it("labels restores apart from edits, and always re-renders a restore", () => {
    const store = createEditorDocumentStore(createDefaultEditorSnapshot())
    const origins: string[] = []
    store.onChange(({ origin }) => origins.push(origin))
    store.patch({ bevelSize: 0.3 })
    store.replace(store.get())
    expect(origins).toEqual(["edit", "restore"])
  })

  it("keys curve smoothness with every Depth keyframe, keeping its values", () => {
    const store = createEditorDocumentStore(depthKeyed())
    expect(store.get().qualityKeyframes.map((k) => k.id)).toEqual([
      "quality-d0",
      "quality-d1",
    ])
    store.patch(editQuality(store.get(), 0.1, 2))
    expect(store.get().qualityKeyframes[1].value).toBe(0.1)
    store.patch(editScalarTrack(store.get(), "extrusion", 20, 1))
    const quality = store.get().qualityKeyframes
    expect(quality).toHaveLength(3)
    expect(quality.find((k) => k.id === "quality-d1")?.value).toBe(0.1)
  })
})

describe("keyframe channels", () => {
  it("counts placed keyframes once and scales every list together", () => {
    const document = createEditorDocumentStore(depthKeyed()).get()
    // Two rotation keys, two depth keys; mirrored quality keys don't count.
    expect(countDocumentKeyframes(document)).toBe(4)
    const patch = mapDocumentKeyframes(document, (keyframes) =>
      keyframes.length
        ? keyframes.map((keyframe) => ({
            ...keyframe,
            time: keyframe.time * 2,
          }))
        : keyframes
    )
    expect(patch.rotationAxisKeyframes?.at(-1)?.time).toBe(10)
    expect(
      patch.tracks?.find((t) => t.id === "extrusion")?.keyframes[1].time
    ).toBe(4)
    expect(patch.fillKeyframes).toBeUndefined()
  })

  it("edits a Style keyframe's fill and finish together, by time", () => {
    const document = createDefaultEditorSnapshot()
    const values = {
      duration: document.duration,
      selectedShapeFillStops: document.fillStops ?? [],
      selectedShapeGradientType: document.fillGradientType,
      activeMaterialSettings: document.materialSettings,
      activeKeyLightPosition: document.keyLightPosition,
      activeRotationOffset: document.rotationOffset,
      activeMoveOffset: document.moveOffset,
    }
    const added = {
      ...document,
      ...addPropertyRowKeyframe(document, "style", 1, values),
    }
    expect(added.fillKeyframes).toHaveLength(1)
    expect(added.materialKeyframes).toHaveLength(1)
    const moved = {
      ...added,
      ...movePropertyRowKeyframe(added, "style", "style-1.000", 2),
    }
    expect(moved.fillKeyframes[0].time).toBe(2)
    expect(moved.materialKeyframes[0].time).toBe(2)
    const removed = removePropertyRowKeyframe(moved, "style", "style-2.000")
    expect(removed).toEqual({ fillKeyframes: [], materialKeyframes: [] })
  })

  it("keys an animated rotation at the playhead but leaves a static one unkeyed", () => {
    const animated = createDefaultEditorSnapshot()
    const keyed = editRotation(animated, { x: 0, y: 90, z: 0 }, 2.5)
    expect(keyed.rotationAxisKeyframes).toHaveLength(3)
    const still = { ...animated, rotationAxisKeyframes: [] }
    expect(
      editRotation(still, { x: 0, y: 90, z: 0 }, 2.5).rotationAxisKeyframes
    ).toEqual([])
  })
})
