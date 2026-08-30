import { describe, expect, it } from "vitest"
import { timelineTimeForKeyboardKey } from "./TimelineRuler"

describe("timelineTimeForKeyboardKey", () => {
  it("moves by a tenth of a second with arrow keys", () => {
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "ArrowRight",
      })
    ).toBe(1.1)
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "ArrowLeft",
      })
    ).toBe(0.9)
  })

  it("supports large steps and timeline boundaries", () => {
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "ArrowRight",
        shiftKey: true,
      })
    ).toBe(2)
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "Home",
      })
    ).toBe(0)
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "End",
      })
    ).toBe(5)
  })

  it("clamps movement and ignores unrelated keys", () => {
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 0,
        duration: 5,
        key: "ArrowLeft",
      })
    ).toBe(0)
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 5,
        duration: 5,
        key: "PageUp",
      })
    ).toBe(5)
    expect(
      timelineTimeForKeyboardKey({
        currentTime: 1,
        duration: 5,
        key: "Enter",
      })
    ).toBeNull()
  })
})
