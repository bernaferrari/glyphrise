import { describe, expect, it } from "vitest"
import {
  defaultMeshPoint,
  isWarpedMesh,
  meshNodePoints,
  meshWarpCoordinates,
} from "./mesh-warp"

const grid = () => Array.from({ length: 9 }, (_, i) => defaultMeshPoint(i))

describe("mesh warp", () => {
  it("leaves unmoved meshes untouched", () => {
    const points = meshNodePoints([])
    expect(isWarpedMesh(points)).toBe(false)
    expect(points).toEqual(grid())
  })

  it("maps a dragged node back to its grid spot", () => {
    const points = grid()
    points[4] = { x: 0.7, y: 0.3 }
    expect(isWarpedMesh(points)).toBe(true)
    const { s, t } = meshWarpCoordinates(points, 0.7, 0.3)
    expect(s).toBeCloseTo(0.5, 4)
    expect(t).toBeCloseTo(0.5, 4)
  })

  it("keeps corners pinned and clamps outside the hull", () => {
    const points = grid()
    points[0] = { x: 0.2, y: 0.2 }
    const inside = meshWarpCoordinates(points, 0.2, 0.2)
    expect(inside.s).toBeCloseTo(0, 4)
    expect(inside.t).toBeCloseTo(0, 4)
    const outside = meshWarpCoordinates(points, 0, 0)
    expect(outside.s).toBeGreaterThanOrEqual(0)
    expect(outside.t).toBeGreaterThanOrEqual(0)
  })

  it("only reads positions once all nine nodes exist", () => {
    const stops = [{ x: 0.9, y: 0.9 }]
    expect(meshNodePoints(stops)).toEqual(grid())
  })
})

describe("mesh keyframes", () => {
  it("animates dragged node positions between keyframes", async () => {
    const { interpolateFillKeyframes } =
      await import("../components/editor/TimelineModel")
    const stops = (x: number) =>
      Array.from({ length: 9 }, (_, i) => ({
        id: `p${i}`,
        color: "#ffffff",
        position: i / 8,
        ...(i === 4 ? { x, y: 0.5 } : {}),
      }))
    const fill = interpolateFillKeyframes(
      0.5,
      { color: "#fff", colorSecondary: "#fff", gradientType: "mesh" },
      [
        { id: "a", time: 0, stops: stops(0.2), easing: "linear" },
        { id: "b", time: 1, stops: stops(0.8), easing: "linear" },
      ]
    )
    expect(fill.stops[4].x).toBeCloseTo(0.5, 4)
    expect(fill.stops[0].x).toBeUndefined()
  })
})
