import { describe, expect, it } from "vitest"
import { upsertVectorKeyframeAtTime } from "./EditorKeyframeModel"

const value = { x: 0, y: 20, z: 0 }

describe("upsertVectorKeyframeAtTime", () => {
  it("does not create a keyframe when auto-key is off", () => {
    const existing = [
      { id: "rotation-1", time: 0, value, easing: "linear" as const },
    ]
    expect(
      upsertVectorKeyframeAtTime({
        keyframes: existing,
        idPrefix: "rotation",
        value: { x: 0, y: 45, z: 0 },
        time: 1,
        duration: 5,
        createIfMissing: false,
      })
    ).toEqual(existing)
  })

  it("updates the exact keyframe even when auto-key is off", () => {
    const existing = [
      { id: "rotation-1", time: 1, value, easing: "linear" as const },
    ]
    expect(
      upsertVectorKeyframeAtTime({
        keyframes: existing,
        idPrefix: "rotation",
        value: { x: 0, y: 45, z: 0 },
        time: 1,
        duration: 5,
        createIfMissing: false,
      })[0].value
    ).toEqual({ x: 0, y: 45, z: 0 })
  })
})
