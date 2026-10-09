import { describe, expect, it } from "vitest"
import { frameSheetLayout, frameSheetTimes } from "./ExportFrameSheet"

describe("frame sheets", () => {
  it("keeps the chosen image size and splits it into equal cells", () => {
    expect(frameSheetLayout(3, { width: 1920, height: 1080 })).toEqual({
      grid: 3,
      count: 9,
      cellWidth: 640,
      cellHeight: 360,
      width: 1920,
      height: 1080,
    })
  })

  it("never renders cells below the export minimum", () => {
    const layout = frameSheetLayout(4, { width: 128, height: 128 })
    expect(layout.cellWidth).toBe(64)
    expect(layout.width).toBe(256)
  })

  it("spaces frames through one loop without repeating the first", () => {
    expect(frameSheetTimes(4, 2)).toEqual([0, 0.5, 1, 1.5])
  })
})
