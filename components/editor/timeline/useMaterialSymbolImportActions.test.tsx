// @vitest-environment happy-dom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { useMaterialSymbolImportActions } from "./useMaterialSymbolImportActions"

const svg = (path: string) =>
  `<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`

it("imports a wipe pair as the on icon plus a drawn slash", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const fetch = vi.fn(async () => new Response(svg("M0 0h24v24H0z")))
  vi.stubGlobal("fetch", fetch)
  const onShapeWipePairChange = vi.fn()
  let actions!: ReturnType<typeof useMaterialSymbolImportActions>

  function Harness() {
    actions = useMaterialSymbolImportActions({
      shapeSearchQuery: "",
      materialSymbolStyle: "outlined",
      onShapeIconChange: vi.fn(),
      onShapeWipePairChange,
      onSearchQueryChange: vi.fn(),
      onOpenShapePicker: vi.fn(),
    })
    return null
  }

  const root = createRoot(document.createElement("div"))
  try {
    act(() => root.render(<Harness />))
    act(() => {
      actions.chooseWipePair("shape-1", {
        label: "Alarm",
        enabled: "alarm",
      })
    })
    await act(async () => {
      await vi.waitFor(() => {
        expect(onShapeWipePairChange).toHaveBeenCalled()
      })
    })

    const [, enabled, disabled] = onShapeWipePairChange.mock.calls[0]
    expect(enabled.id).toBe("material-symbol-outlined-alarm")
    expect(disabled.id).toBe("material-symbol-outlined-alarm_off-slash")
    expect(disabled.svgContent).toContain("data-glyphrise-slash")
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/alarm/"))
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
