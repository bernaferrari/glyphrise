import { describe, expect, it } from "vitest"
import {
  interpolateKeyframes,
  interpolatePreparedFillKeyframes,
  isEasingType,
  prepareFillKeyframes,
  type FillKeyframe,
} from "./TimelineModel"

describe("prepared fill keyframes", () => {
  it("sorts once and interpolates every fill stop from the prepared tracks", () => {
    const keyframes: FillKeyframe[] = [
      {
        id: "end",
        time: 2,
        easing: "linear",
        gradientType: "conic",
        stops: [
          { id: "a", color: "#00ff00", position: 0.3 },
          { id: "b", color: "#ffffff", position: 0.7 },
        ],
      },
      {
        id: "start",
        time: 0,
        easing: "linear",
        gradientType: "radial",
        stops: [
          { id: "a", color: "#ff0000", position: 0.1 },
          { id: "b", color: "#0000ff", position: 0.9 },
        ],
      },
    ]
    const prepared = prepareFillKeyframes(keyframes)
    const result = interpolatePreparedFillKeyframes(
      1,
      {
        color: "#000000",
        colorSecondary: "#ffffff",
        gradientType: "linear",
      },
      prepared
    )

    expect(prepared.sorted.map((keyframe) => keyframe.id)).toEqual([
      "start",
      "end",
    ])
    expect(result).toEqual({
      color: "#808000",
      colorSecondary: "#8080ff",
      gradientType: "radial",
      stops: [
        { id: "a", color: "#808000", position: 0.2 },
        { id: "b", color: "#8080ff", position: 0.8 },
      ],
    })
  })

  it("uses fallback stops when no fill keyframes exist", () => {
    const result = interpolatePreparedFillKeyframes(
      1,
      {
        color: "#123456",
        colorSecondary: "#abcdef",
        gradientType: "mesh",
      },
      prepareFillKeyframes([])
    )

    expect(result.color).toBe("#123456")
    expect(result.colorSecondary).toBe("#abcdef")
    expect(result.gradientType).toBe("mesh")
  })
})

describe("hold keyframes", () => {
  it("keep their value until the next keyframe, then jump", () => {
    const track = {
      id: "scale",
      name: "Scale",
      color: "#fff",
      min: 0,
      max: 4,
      defaultValue: 1,
      keyframes: [
        { id: "a", time: 0, value: 1, easing: "hold" as const },
        { id: "b", time: 2, value: 3, easing: "linear" as const },
      ],
    }
    expect(interpolateKeyframes(0.5, track)).toBe(1)
    expect(interpolateKeyframes(1.99, track)).toBe(1)
    expect(interpolateKeyframes(2, track)).toBe(3)
    expect(isEasingType("hold")).toBe(true)
  })
})
