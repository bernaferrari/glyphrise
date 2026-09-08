import { describe, expect, it } from "vitest"
import { createAnimationPreset } from "./AnimationPresetModel"
import { createInitialTimelineTracks } from "./PropertyRegistry"
import { withStarterAnimation } from "./timeline/StarterTrackModel"

const scaleTrack = createInitialTimelineTracks().find(
  (track) => track.id === "scale"
)!
const base = {
  duration: 4,
  intensity: 0.5,
  rotation: { x: 10, y: 20, z: 30 },
  scale: 1.5,
  scaleTrack,
}

describe("motion presets", () => {
  it("spins from the existing orientation without altering the scale track", () => {
    const result = createAnimationPreset({ ...base, id: "spin" })
    expect(result.rotationKeyframes?.map((k) => [k.time, k.value])).toEqual([
      [0, base.rotation],
      [4, { x: 10, y: 200, z: 30 }],
    ])
    expect(result.scaleTrack).toBeUndefined()
    expect(base.rotation).toEqual({ x: 10, y: 20, z: 30 })
  })
  it("tilts and returns to the original pose", () => {
    const frames = createAnimationPreset({
      ...base,
      id: "tilt",
    }).rotationKeyframes!
    expect(frames.map((k) => k.value.z)).toEqual([30, 42.5, 30])
    expect(frames.map((k) => k.time)).toEqual([0, 2, 4])
  })
  it("pulses within the allowed scale range and preserves orientation", () => {
    const result = createAnimationPreset({
      ...base,
      id: "pulse",
      scale: 2.8,
      intensity: 2,
    })
    expect(result.scaleTrack?.keyframes.map((k) => k.value)).toEqual([
      2.8, 3, 2.8,
    ])
    expect(result.rotationKeyframes).toBeUndefined()
    expect(scaleTrack.keyframes).toEqual([])
  })
  it("still pulses when the starting scale is already at its maximum", () => {
    const frames = createAnimationPreset({ ...base, id: "pulse", scale: 3 })
      .scaleTrack!.keyframes
    expect(frames[1].value).toBeLessThan(3)
    expect(frames[2].value).toBe(3)
  })
  it("starts hidden scalar properties with movement, but never overwrites existing animation", () => {
    for (const track of createInitialTimelineTracks()) {
      const animated = withStarterAnimation(track, 6)
      expect(animated.keyframes.map((k) => k.time)).toEqual([0, 3, 6])
      expect(animated.keyframes[1].value).not.toBe(animated.keyframes[0].value)
      expect(withStarterAnimation(animated, 10)).toBe(animated)
    }
  })
})
