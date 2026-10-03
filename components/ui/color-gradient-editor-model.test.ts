import { describe, expect, it } from "vitest"
import {
  removeMeshPointAt,
  reorderMeshColors,
} from "./color-gradient-editor-model"

const mesh = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    color: `#${String(i).repeat(6).slice(0, 6)}`,
    position: Math.min(1, i / 8),
    ...(i === 4 ? { x: 0.7, y: 0.3 } : {}),
  }))

describe("mesh point list", () => {
  it("reorders colors while positions stay with their slots", () => {
    const next = reorderMeshColors(mesh(9), 0, 4)
    expect(next[4].color).toBe("#000000")
    expect(next[0].color).toBe("#111111")
    expect(next[4].x).toBe(0.7)
  })

  it("pulls the first free point into the grid when a grid color goes", () => {
    const next = removeMeshPointAt(mesh(10), 2)
    expect(next).toHaveLength(9)
    expect(next[2].color).toBe("#333333")
    expect(next[8].color).toBe("#999999")
  })

  it("drops a free point outright", () => {
    const next = removeMeshPointAt(mesh(10), 9)
    expect(next.map((stop) => stop.id)).toEqual(mesh(9).map((s) => s.id))
  })

  it("spreads the remaining colors when only the grid is left", () => {
    const next = removeMeshPointAt(mesh(9), 8)
    expect(next).toHaveLength(9)
    expect(next[8].color).toBe("#777777")
    expect(next.some((stop) => stop.color === "#888888")).toBe(false)
  })
})
