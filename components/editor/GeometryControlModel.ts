import { clampNumber } from "./EditorModel"

export const GEOMETRY_TOLERANCE_MIN = 0.015
export const GEOMETRY_TOLERANCE_MAX = 0.12

export const curveDetailFromGeometryQuality = (quality: number) =>
  Math.round(
    ((GEOMETRY_TOLERANCE_MAX -
      clampNumber(quality, GEOMETRY_TOLERANCE_MIN, GEOMETRY_TOLERANCE_MAX)) /
      (GEOMETRY_TOLERANCE_MAX - GEOMETRY_TOLERANCE_MIN)) *
      100
  )

export const geometryQualityFromCurveDetail = (detail: number) =>
  GEOMETRY_TOLERANCE_MAX -
  (clampNumber(detail, 0, 100) / 100) *
    (GEOMETRY_TOLERANCE_MAX - GEOMETRY_TOLERANCE_MIN)
