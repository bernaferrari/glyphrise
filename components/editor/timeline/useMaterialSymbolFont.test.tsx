// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MaterialSymbolStyle } from "../IconLibrary"
import { useMaterialSymbolFont } from "./useMaterialSymbolFont"

function Picker({
  open,
  symbolStyle,
}: {
  open: boolean
  symbolStyle: MaterialSymbolStyle
}) {
  useMaterialSymbolFont(open, symbolStyle)
  return null
}

describe("symbol font loading", () => {
  let root: Root
  let container: HTMLDivElement
  const fonts = () =>
    document.head.querySelectorAll('[id^="glyphrise-symbol-font-"]')
  const render = (open: boolean, style: MaterialSymbolStyle = "outlined") =>
    act(() => root.render(<Picker open={open} symbolStyle={style} />))

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    container = document.createElement("div")
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    fonts().forEach((link) => link.remove())
    vi.unstubAllGlobals()
  })

  it("does not load remote symbol stylesheets before the picker opens", () => {
    render(false)
    expect(fonts()).toHaveLength(0)
  })

  it("loads only the selected family and reuses it on reopening", () => {
    render(true, "rounded")
    expect(fonts()).toHaveLength(1)
    const link = fonts()[0] as HTMLLinkElement
    expect(link.href).toContain("Material+Symbols+Rounded")
    render(false, "rounded")
    render(true, "rounded")
    expect(fonts()).toHaveLength(1)
    expect(fonts()[0]).toBe(link)
  })

  it("loads another style only when it is actually browsed", () => {
    render(true)
    render(false, "sharp")
    expect(fonts()).toHaveLength(1)
    render(true, "sharp")
    expect(fonts()).toHaveLength(2)
    expect(
      document.getElementById("glyphrise-symbol-font-sharp")
    ).not.toBeNull()
  })
})
