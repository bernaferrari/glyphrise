import { describe, expect, it } from "vitest"
import { hexToHsv } from "./color-picker-utils"
import { hueShiftedStops, remixedMesh } from "./color-gradient-presets"

describe("hueShiftedStops", () => {
  it("spins hues around the wheel and leaves greys alone", () => {
    const [green, grey] = hueShiftedStops(
      [
        { id: "a", color: "#00ff00", position: 0, x: 0.2, y: 0.4 },
        { id: "b", color: "#808080", position: 1 },
      ],
      200
    )
    expect(Math.round(hexToHsv(green.color).h)).toBe(320)
    expect(green).toMatchObject({ id: "a", position: 0, x: 0.2, y: 0.4 })
    expect(grey.color).toBe("#808080")
  })

  it("wraps negative shifts", () => {
    const [stop] = hueShiftedStops([{ color: "#ff0000", position: 0 }], -60)
    expect(Math.round(hexToHsv(stop.color).h)).toBe(300)
  })
})

describe("remixedMesh", () => {
  it("keeps every stop and point inside the mesh", () => {
    const stops = Array.from({ length: 9 }, (_, index) => ({
      color: "#3366ff",
      position: index / 8,
      x: 0.5,
      y: 0.5,
    }))
    const remixed = remixedMesh(stops)
    expect(remixed).toHaveLength(9)
    for (const stop of remixed) {
      expect(stop.x).toBeGreaterThanOrEqual(0)
      expect(stop.x).toBeLessThanOrEqual(1)
      expect(stop.y).toBeGreaterThanOrEqual(0)
      expect(stop.y).toBeLessThanOrEqual(1)
    }
  })
})
