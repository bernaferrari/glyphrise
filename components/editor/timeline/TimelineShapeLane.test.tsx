// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createShapeStop } from "../ShapeSequenceModel"
import { TimelineShapeLane } from "./TimelineShapeLane"

describe("icon clip selection", () => {
  let root: Root
  let container: HTMLDivElement
  const onTimeChange = vi.fn()
  const onSelectShape = vi.fn()
  const onOpenShapePicker = vi.fn()
  const stop = createShapeStop(
    {
      id: "calendar",
      name: "Calendar",
      defaultTint: "#000000",
      svgContent: "<svg/>",
    },
    0,
    "clip"
  )

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    vi.clearAllMocks()
    container = document.createElement("div")
    root = createRoot(container)
    act(() =>
      root.render(
        <TimelineShapeLane
          duration={5}
          shapes={[stop]}
          sortedShapes={[stop]}
          selectedShapeId={stop.id}
          openClipEditor={null}
          wipeDirections={[]}
          transitionWindows={[]}
          clipBounds={[{ left: 0, right: 5, isOnly: true }]}
          shapeDraggedRef={{ current: false }}
          shapeLabel={(shape) => shape.iconName!}
          timeFromClientX={() => 2.5}
          onClearSelectedKeyframe={vi.fn()}
          onTimeChange={onTimeChange}
          onOpenClipEditorChange={vi.fn()}
          onShapeBlendChange={vi.fn()}
          onShapeEasingChange={vi.fn()}
          onTransitionEdgeDrag={vi.fn()}
          onSelectShape={onSelectShape}
          onOpenShapePicker={onOpenShapePicker}
          onUploadShape={vi.fn()}
          onMoveShapeOrder={vi.fn()}
          onRemoveShape={vi.fn()}
          onShapeDrag={vi.fn()}
          onOpenContextMenu={vi.fn()}
          createGoToMenuItem={() => ({ label: "Go to", onSelect: vi.fn() })}
          onAddShape={vi.fn()}
        />
      )
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  })

  it("selects an icon clip without seeking to its start", () => {
    act(() => (container.querySelector("button") as HTMLButtonElement).click())
    expect(onSelectShape).toHaveBeenCalledWith(stop.id)
    expect(onTimeChange).not.toHaveBeenCalled()
  })

  it("keeps the playhead when double-click opens the icon picker", () => {
    const clip = container.querySelector("button") as HTMLButtonElement
    act(() => {
      clip.click()
      clip.click()
      clip.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    })
    expect(onOpenShapePicker).toHaveBeenCalledWith(stop.id)
    expect(onTimeChange).not.toHaveBeenCalled()
  })

  it("still seeks when clicking empty lane space", () => {
    act(() =>
      container.firstElementChild!.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 })
      )
    )
    expect(onTimeChange).toHaveBeenCalledWith(2.5)
  })
})
