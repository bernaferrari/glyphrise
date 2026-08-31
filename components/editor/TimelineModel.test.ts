import { describe, expect, it } from "vitest"
import {
  interpolatePreparedFillKeyframes,
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
