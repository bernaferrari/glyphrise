import { finiteNumber } from "./SvgGeometry"

export const clamp01Number = (value: unknown, fallback = 0) =>
  Math.max(0, Math.min(1, finiteNumber(value, fallback)))
