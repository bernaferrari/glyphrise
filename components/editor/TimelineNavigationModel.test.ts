import { describe, expect, it } from "vitest"
import {
  createTimelineKeyMoments,
  getAdjacentTimelineKeyMoments,
} from "./TimelineNavigationModel"
import { quantizeTimeToFrame } from "./EditorModel"

function moments(times: number[]) {
  return createTimelineKeyMoments({
    duration: 5,
    shapes: [],
    fillKeyframes: [],
    tracks: [],
    rotationAxisKeyframes: times.map((time, i) => ({
      id: String(i),
      time,
      value: { x: 0, y: 0, z: 0 },
      easing: "linear",
    })),
    moveKeyframes: [],
    keyLightPositionKeyframes: [],
    materialKeyframes: [],
  })
}

describe("timeline checkpoint navigation", () => {
  it("advances beyond a checkpoint whose time rounds down to the playhead frame", () => {
    const currentTime = quantizeTimeToFrame(2.02)
    expect(
      getAdjacentTimelineKeyMoments({
        keyMoments: moments([2.02, 3]),
        currentTime,
      }).nextKeyMoment
    ).toBe(3)
  })
  it("goes back beyond a checkpoint whose time rounds up to the playhead frame", () => {
    const currentTime = quantizeTimeToFrame(2.01)
    expect(
      getAdjacentTimelineKeyMoments({
        keyMoments: moments([1, 2.01]),
        currentTime,
      }).previousKeyMoment
    ).toBe(1)
  })
  it("merges checkpoints on the same frame into one stop", () => {
    expect(moments([2.01, 2.02])).toEqual([0, 2.017, 5])
  })
})
