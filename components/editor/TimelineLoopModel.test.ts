import { describe, expect, it } from "vitest"
import type { Vector3Keyframe } from "./EditorModel"
import { createInitialTimelineTracks } from "./PropertyRegistry"
import {
  closeTimelineLoops,
  nearestTurn,
  openLoopIds,
  type TimelineLoopState,
} from "./TimelineLoopModel"

const rotation = (time: number, y: number): Vector3Keyframe => ({
  id: `r-${time}`,
  time,
  value: { x: 0, y, z: 0 },
  easing: "ease-in-out",
})

const state = (patch: Partial<TimelineLoopState> = {}): TimelineLoopState => ({
  tracks: createInitialTimelineTracks(),
  fillKeyframes: [],
  materialKeyframes: [],
  keyLightPositionKeyframes: [],
  rotationAxisKeyframes: [],
  moveKeyframes: [],
  qualityKeyframes: [],
  innerScaleKeyframes: [],
  ...patch,
})

describe("nearestTurn", () => {
  it("finishes a turn forward or backward, whichever is closer", () => {
    expect(nearestTurn(0, 200)).toBe(360)
    expect(nearestTurn(0, 170)).toBe(0)
    expect(nearestTurn(10, -340)).toBe(-350)
  })
})

describe("closeTimelineLoops", () => {
  it("treats a full spin as already looping", () => {
    const spin = state({
      rotationAxisKeyframes: [rotation(0, 0), rotation(5, 360)],
    })
    expect(openLoopIds(spin)).toEqual([])
    expect(closeTimelineLoops(spin, 5)).toEqual({})
  })

  it("finishes a partial turn instead of unwinding it", () => {
    const partial = state({
      rotationAxisKeyframes: [rotation(0, 0), rotation(3, 200)],
    })
    expect(openLoopIds(partial)).toEqual(["rotation"])
    const closed = closeTimelineLoops(partial, 5).rotationAxisKeyframes!
    expect(closed).toHaveLength(3)
    expect(closed[2]).toMatchObject({ time: 5, value: { x: 0, y: 360, z: 0 } })
    // The closing move eases the same way the last one did.
    expect(closed[2].easing).toBe("ease-in-out")
  })

  it("updates a keyframe that already sits at the end", () => {
    const tracks = createInitialTimelineTracks().map((track) =>
      track.id === "scale"
        ? {
            ...track,
            keyframes: [
              { id: "a", time: 0, value: 1, easing: "linear" as const },
              { id: "b", time: 4, value: 1.4, easing: "linear" as const },
            ],
          }
        : track
    )
    const closed = closeTimelineLoops(state({ tracks }), 4, "scale").tracks!
    const scale = closed.find((track) => track.id === "scale")!
    expect(scale.keyframes).toEqual([
      { id: "a", time: 0, value: 1, easing: "linear" },
      { id: "b", time: 4, value: 1, easing: "linear" },
    ])
  })

  it("holds a property that already came back, without adding keyframes", () => {
    const tracks = createInitialTimelineTracks().map((track) =>
      track.id === "scale"
        ? {
            ...track,
            keyframes: [
              { id: "a", time: 0, value: 1, easing: "linear" as const },
              { id: "b", time: 1, value: 1.2, easing: "linear" as const },
              { id: "c", time: 2, value: 1, easing: "linear" as const },
            ],
          }
        : track
    )
    expect(openLoopIds(state({ tracks }))).toEqual([])
  })

  it("closes only the requested row", () => {
    const open = state({
      rotationAxisKeyframes: [rotation(0, 0), rotation(2, 90)],
      moveKeyframes: [
        { id: "m1", time: 0, value: { x: 0, y: 0, z: 0 }, easing: "linear" },
        { id: "m2", time: 2, value: { x: 4, y: 0, z: 0 }, easing: "linear" },
      ],
    })
    expect(openLoopIds(open)).toEqual(["rotation", "move"])
    const changes = closeTimelineLoops(open, 4, "move")
    expect(Object.keys(changes)).toEqual(["moveKeyframes"])
    expect(changes.moveKeyframes!.at(-1)).toMatchObject({
      time: 4,
      value: { x: 0, y: 0, z: 0 },
    })
  })

  it("copies the opening fill instead of sharing its stops", () => {
    const stops = [{ id: "s", color: "#ff0000", position: 0 }]
    const open = state({
      fillKeyframes: [
        { id: "f1", time: 0, stops, easing: "linear" },
        {
          id: "f2",
          time: 1,
          stops: [{ id: "s", color: "#0000ff", position: 0 }],
          easing: "linear",
        },
      ],
    })
    const closed = closeTimelineLoops(open, 3, "style").fillKeyframes!
    expect(closed.at(-1)!.stops).toEqual(stops)
    expect(closed.at(-1)!.stops).not.toBe(stops)
  })
})
