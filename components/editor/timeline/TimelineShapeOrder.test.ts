import { describe, expect, it } from "vitest"
import type { ShapeStop } from "../TimelineModel"
import { moveShapeOrder, swapShapeIcons } from "./TimelineShapeModel"

const stop = (id: string, time: number, extra: Partial<ShapeStop> = {}) =>
  ({
    id,
    time,
    iconId: `icon-${id}`,
    svgContent: `<svg id="${id}"/>`,
    color: `#${id}${id}${id}`,
    colorSecondary: "#000000",
    easing: "linear",
    transitionType: "fade",
    wipeDirection: { x: 0, y: 0 },
    ...extra,
  }) as ShapeStop

describe("icon clip order", () => {
  it("swaps icons while slots keep their time and transition", () => {
    const shapes = [
      stop("a", 0, { transitionType: "wipe" }),
      stop("b", 1.5, { transitionType: "cut" }),
    ]
    const next = swapShapeIcons(shapes, "a", "b")
    expect(next[0]).toMatchObject({
      id: "b",
      iconId: "icon-b",
      time: 0,
      transitionType: "wipe",
    })
    expect(next[1]).toMatchObject({
      id: "a",
      iconId: "icon-a",
      time: 1.5,
      transitionType: "cut",
    })
  })

  it("moves a clip earlier or later by one place", () => {
    const shapes = [stop("a", 0), stop("b", 1), stop("c", 2)]
    const later = moveShapeOrder(shapes, "a", 1)
    expect([...later].sort((x, y) => x.time - y.time).map((s) => s.id)).toEqual(
      ["b", "a", "c"]
    )
    expect(moveShapeOrder(shapes, "a", -1)).toBe(shapes)
    expect(moveShapeOrder(shapes, "c", 1)).toBe(shapes)
  })
})
