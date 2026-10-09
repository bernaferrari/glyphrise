import { describe, expect, it } from "vitest"
import { frameSheetLayout, frameSheetTimes } from "./ExportFrameSheet"

describe("frame sheets", () => {
  it("fits auto grids to the image so cells stay close to square", () => {
    const wide = frameSheetLayout(
      { frames: 8, frameArrangement: "auto" },
      { width: 1920, height: 1080 }
    )
    expect([wide.columns, wide.rows]).toEqual([4, 2])
    expect(wide.width).toBe(1920)
    expect(wide.height).toBe(1080)

    const square = frameSheetLayout(
      { frames: 16, frameArrangement: "auto" },
      { width: 1080, height: 1080 }
    )
    expect([square.columns, square.rows]).toEqual([4, 4])
  })

  it("lays a filmstrip out in one row or one column", () => {
    const row = frameSheetLayout(
      { frames: 6, frameArrangement: "row" },
      { width: 1920, height: 320 }
    )
    expect([row.columns, row.rows, row.cellWidth, row.cellHeight]).toEqual([
      6, 1, 320, 320,
    ])
    const column = frameSheetLayout(
      { frames: 4, frameArrangement: "column" },
      { width: 256, height: 1024 }
    )
    expect([column.columns, column.rows]).toEqual([1, 4])
  })

  it("never renders cells below the export minimum", () => {
    const layout = frameSheetLayout(
      { frames: 16, frameArrangement: "auto" },
      { width: 128, height: 128 }
    )
    expect(layout.cellWidth).toBe(64)
    expect(layout.width).toBe(256)
  })

  it("spaces frames through one loop without repeating the first", () => {
    expect(frameSheetTimes(4, 2)).toEqual([0, 0.5, 1, 1.5])
  })
})
