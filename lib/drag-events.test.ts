import { afterEach, describe, expect, it, vi } from "vitest"
import { bindWindowPointerDrag } from "./drag-events"

class DragPointerEvent extends Event {
  readonly buttons: number
  readonly pointerId: number

  constructor(
    type: string,
    { pointerId, buttons = 1 }: { pointerId: number; buttons?: number }
  ) {
    super(type)
    this.pointerId = pointerId
    this.buttons = buttons
  }
}

describe("bindWindowPointerDrag", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("only responds to the pointer that started the drag", () => {
    const windowTarget = new EventTarget()
    vi.stubGlobal("window", windowTarget)
    const onMove = vi.fn()
    const onEnd = vi.fn()

    bindWindowPointerDrag({ pointerId: 7, onMove, onEnd })

    windowTarget.dispatchEvent(
      new DragPointerEvent("pointermove", { pointerId: 8 })
    )
    windowTarget.dispatchEvent(
      new DragPointerEvent("pointerup", { pointerId: 8, buttons: 0 })
    )
    expect(onMove).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()

    windowTarget.dispatchEvent(
      new DragPointerEvent("pointermove", { pointerId: 7 })
    )
    windowTarget.dispatchEvent(
      new DragPointerEvent("pointerup", { pointerId: 7, buttons: 0 })
    )
    expect(onMove).toHaveBeenCalledOnce()
    expect(onEnd).toHaveBeenCalledOnce()

    windowTarget.dispatchEvent(
      new DragPointerEvent("pointermove", { pointerId: 7 })
    )
    expect(onMove).toHaveBeenCalledOnce()
  })
})
