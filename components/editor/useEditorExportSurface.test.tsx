// @vitest-environment happy-dom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { useEditorExportSurface } from "./useEditorExportSurface"
import { DEFAULT_EXPORT_SETTINGS } from "./ExportSettingsModel"
import type { EditorSnapshot } from "./EditorModel"

type Args = Parameters<typeof useEditorExportSurface>[0]

it("reuses captures without serializing the document and invalidates every preview input", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const serializeDocument = vi.fn(() => "document")
  const document = { toJSON: serializeDocument } as unknown as EditorSnapshot
  const exportPng = vi.fn(async () => new Blob(["png"]))
  const args = {
    previewState: {
      document,
      currentTime: 0,
      wireframe: false,
      ambientColor: "#ffffff",
      rimLightColor: "#ffffff",
    },
    canvasRef: { current: { exportPng } },
    selectedShapeId: null,
    onShapeIconChange: vi.fn(),
    cancelVideoExport: vi.fn(),
    isVideoExporting: false,
    videoExportProgress: 0,
  } as unknown as Args
  let capture!: ReturnType<
    typeof useEditorExportSurface
  >["exportModalProps"]["onCapturePreview"]
  function Harness({ args }: { args: Args }) {
    capture = useEditorExportSurface(args).exportModalProps.onCapturePreview
    return null
  }
  const root = createRoot(window.document.createElement("div"))
  const render = (next: Args) => act(() => root.render(<Harness args={next} />))
  try {
    render(args)
    const initialCapture = capture
    const first = capture(DEFAULT_EXPORT_SETTINGS)
    expect(capture(DEFAULT_EXPORT_SETTINGS)).toBe(first)
    await first
    expect(exportPng).toHaveBeenCalledTimes(1)
    // A freshly allocated wrapper and unrelated progress must not recapture.
    render({
      ...args,
      previewState: { ...args.previewState },
      videoExportProgress: 0.5,
    })
    expect(capture).toBe(initialCapture)
    expect(capture(DEFAULT_EXPORT_SETTINGS)).toBe(first)
    for (const update of [
      { currentTime: 1 },
      { document: { ...document } },
      { wireframe: true },
      { ambientColor: "#eeeeee" },
      { rimLightColor: "#dddddd" },
    ]) {
      args.previewState = { ...args.previewState, ...update }
      render({ ...args })
      const pending = capture(DEFAULT_EXPORT_SETTINGS)
      expect(capture(DEFAULT_EXPORT_SETTINGS)).toBe(pending)
      await pending
    }
    await capture({ ...DEFAULT_EXPORT_SETTINGS, width: 512 })
    await capture({
      ...DEFAULT_EXPORT_SETTINGS,
      backgroundMode: "color",
      backgroundColor: "#123456",
    })
    expect(exportPng).toHaveBeenCalledTimes(8)
    expect(exportPng).toHaveBeenLastCalledWith({
      width: 1080,
      height: 1080,
      backgroundColor: "#123456",
    })
    expect(serializeDocument).not.toHaveBeenCalled()
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
