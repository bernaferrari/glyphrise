import { describe, expect, it } from "vitest"
import { DEFAULT_WIPE_PAIR } from "./DefaultShapeIcons"
import {
  addShapeStopAtTime,
  applyShapeWipePair,
  createShapeStop,
} from "./ShapeSequenceModel"
import { SHAPE_MIN_GAP } from "./ShapeTimeModel"

describe("ShapeSequenceModel", () => {
  it("places repeated additions at distinct valid timestamps", () => {
    const first = createShapeStop(DEFAULT_WIPE_PAIR[0], 1, "first")
    const result = addShapeStopAtTime({
      shapes: [first],
      time: 1,
      duration: 5,
    })

    expect(result.addedShapeId).not.toBeNull()
    expect(result.shapes).toHaveLength(2)
    expect(
      Math.abs(result.shapes[1].time - result.shapes[0].time)
    ).toBeGreaterThanOrEqual(SHAPE_MIN_GAP - 0.0005)
  })

  it("does not add a clip when the available range is full", () => {
    const shapes = [
      createShapeStop(DEFAULT_WIPE_PAIR[0], 0, "first"),
      createShapeStop(DEFAULT_WIPE_PAIR[1], SHAPE_MIN_GAP, "second"),
    ]
    const result = addShapeStopAtTime({
      shapes,
      time: SHAPE_MIN_GAP / 2,
      duration: SHAPE_MIN_GAP,
    })

    expect(result.addedShapeId).toBeNull()
    expect(result.shapes).toBe(shapes)
  })

  it("does not create a duplicate wipe-pair clip at the timeline end", () => {
    const shapes = [createShapeStop(DEFAULT_WIPE_PAIR[0], 5, "timeline-end")]

    expect(
      applyShapeWipePair({
        shapes,
        shapeId: "timeline-end",
        enabled: DEFAULT_WIPE_PAIR[0],
        disabled: DEFAULT_WIPE_PAIR[1],
        duration: 5,
      })
    ).toBe(shapes)
  })

  it("creates the disabled wipe clip after the enabled clip", () => {
    const shapes = [createShapeStop(DEFAULT_WIPE_PAIR[0], 1, "enabled")]
    const result = applyShapeWipePair({
      shapes,
      shapeId: "enabled",
      enabled: DEFAULT_WIPE_PAIR[0],
      disabled: DEFAULT_WIPE_PAIR[1],
      duration: 5,
    })

    expect(result).toHaveLength(2)
    expect(result[1].time - result[0].time).toBeGreaterThanOrEqual(
      SHAPE_MIN_GAP - 0.0005
    )
  })
})
