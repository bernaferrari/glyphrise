import { describe, expect, it } from "vitest"
import { shouldScheduleSvgRenderFrame } from "./SvgRenderLoopModel"

describe("shouldScheduleSvgRenderFrame", () => {
  it("schedules the visible active loop when no frame is queued", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: false,
        animationFrameId: null,
      })
    ).toBe(true)
  })

  it("does not schedule while hidden or disposed", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: true,
        animationFrameId: null,
      })
    ).toBe(false)
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: true,
        documentHidden: false,
        animationFrameId: null,
      })
    ).toBe(false)
  })

  it("does not queue a duplicate animation frame", () => {
    expect(
      shouldScheduleSvgRenderFrame({
        disposed: false,
        documentHidden: false,
        animationFrameId: 42,
      })
    ).toBe(false)
  })
})
