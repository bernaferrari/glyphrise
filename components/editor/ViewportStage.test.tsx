// @vitest-environment happy-dom
import { act, type ComponentProps } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { ViewportStage } from "./ViewportStage"
import { SvgCanvas } from "../3d/SvgCanvas"
import { createDefaultEditorSnapshot } from "./EditorProjectModel"
import { createPlaybackClock } from "./PlaybackClock"

vi.mock("../3d/SvgCanvas", () => ({
  SvgCanvas: vi.fn(() => <canvas />),
}))
vi.mock("./ViewportControls", () => ({
  ViewOptionsPopover: () => null,
  PlaybackControls: () => null,
}))

it("waits for the restored document before preparing the 3D scene", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const root = createRoot(document.createElement("div"))
  const editorDocument = createDefaultEditorSnapshot()
  const restored = {
    ...editorDocument,
    shapes: editorDocument.shapes.map((shape, index) =>
      index === 0 ? { ...shape, svgContent: "restored" } : shape
    ),
  }
  const props = {
    zenMode: false,
    canvasReady: false,
    isDragging: false,
    canvasProps: {},
    canvasSource: {
      document: editorDocument,
      clock: createPlaybackClock(0),
      previewRotationOffset: null,
    },
  } as unknown as ComponentProps<typeof ViewportStage>
  vi.mocked(SvgCanvas).mockClear()
  try {
    act(() => root.render(<ViewportStage {...props} />))
    expect(SvgCanvas).not.toHaveBeenCalled()
    act(() =>
      root.render(
        <ViewportStage
          {...props}
          canvasReady
          canvasSource={{ ...props.canvasSource, document: restored }}
        />
      )
    )
    expect(SvgCanvas).toHaveBeenCalledTimes(1)
    expect(vi.mocked(SvgCanvas).mock.calls[0][0].iconAContent).toBe("restored")
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
