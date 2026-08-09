import { describe, expect, it } from "vitest"
import {
  curveDetailFromGeometryQuality,
  geometryQualityFromCurveDetail,
} from "./GeometryControlModel"

describe("GeometryControlModel", () => {
  it("maps the user-facing detail scale in the intuitive direction", () => {
    expect(curveDetailFromGeometryQuality(0.12)).toBe(0)
    expect(curveDetailFromGeometryQuality(0.015)).toBe(100)
    expect(geometryQualityFromCurveDetail(0)).toBeCloseTo(0.12)
    expect(geometryQualityFromCurveDetail(100)).toBeCloseTo(0.015)
  })

  it("clamps values beyond the control range", () => {
    expect(curveDetailFromGeometryQuality(2)).toBe(0)
    expect(geometryQualityFromCurveDetail(120)).toBeCloseTo(0.015)
  })
})
