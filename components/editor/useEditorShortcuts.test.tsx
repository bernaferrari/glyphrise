// @vitest-environment happy-dom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { useTimelineStepShortcuts } from "./useEditorShortcuts"

it("steps with arrows on transport surfaces while preserving inputs and controls that handle keys", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const onStepFrames = vi.fn()
  const onPreviousKeyframe = vi.fn()
  const onNextKeyframe = vi.fn()
  function Harness() {
    useTimelineStepShortcuts({
      onStepFrames,
      onPreviousKeyframe,
      onNextKeyframe,
    })
    return (
      <div data-timeline-step-surface>
        <button>Play</button>
        <input aria-label="Time" />
        <button onKeyDown={(event) => event.preventDefault()}>Keyframe</button>
      </div>
    )
  }
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  const send = (
    target: Element,
    key: string,
    extra: KeyboardEventInit = {}
  ) => {
    const event = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...extra,
    })
    act(() => target.dispatchEvent(event))
    return event
  }
  try {
    act(() => root.render(<Harness />))
    const play = container.querySelector("button")!
    expect(send(play, "ArrowRight").defaultPrevented).toBe(true)
    send(play, "ArrowLeft")
    send(play, "ArrowRight", { shiftKey: true })
    send(play, "ArrowLeft", { shiftKey: true, repeat: true })
    expect(onStepFrames.mock.calls).toEqual([[1], [-1], [10], [-10]])
    send(container.querySelector("input")!, "ArrowRight")
    send(container.querySelectorAll("button")[1], "ArrowRight")
    send(play, "ArrowRight", { ctrlKey: true })
    send(document.body, "ArrowRight")
    expect(onStepFrames).toHaveBeenCalledTimes(4)
    const dialog = document.createElement("div")
    dialog.setAttribute("role", "dialog")
    document.body.append(dialog)
    send(play, "ArrowRight")
    expect(onStepFrames).toHaveBeenCalledTimes(4)
    dialog.remove()
    send(play, ",")
    send(play, ".")
    expect(onPreviousKeyframe).toHaveBeenCalledOnce()
    expect(onNextKeyframe).toHaveBeenCalledOnce()
  } finally {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  }
})
