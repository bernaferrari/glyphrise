// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createShapeStop } from "../ShapeSequenceModel"
import { MaterialSymbolGrid } from "./MaterialSymbolGrid"

describe("symbol picker location", () => {
  let root: Root
  let container: HTMLDivElement
  const symbols = Array.from({ length: 300 }, (_, i) => `symbol_${i}`)
  const render = (query = "", iconId = "material-symbol-rounded-symbol_150") =>
    act(() =>
      root.render(
        <MaterialSymbolGrid
          stop={createShapeStop(
            {
              id: iconId,
              name: "Current",
              defaultTint: "#000000",
              svgContent: "<svg/>",
            },
            0,
            "clip"
          )}
          filteredMaterialSymbols={
            query ? symbols.filter((name) => name.includes(query)) : symbols
          }
          normalizedShapeQuery={query}
          materialSymbolClass="material-symbols-rounded"
          symbolStyle={{}}
          materialSymbolStatus={{ state: "idle" }}
          onChooseMaterialSymbol={vi.fn()}
          onImportMaterialSymbol={vi.fn()}
        />
      )
    )

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      }
    )
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      gridTemplateColumns: Array(6).fill("44px").join(" "),
      rowGap: "8px",
    } as CSSStyleDeclaration)
    container = document.createElement("div")
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("opens around the current symbol and marks it selected without rendering the entire catalog", () => {
    render()
    expect(container.firstElementChild!.scrollTop).toBeGreaterThan(0)
    expect(
      container
        .querySelector('[aria-label="symbol 150"]')
        ?.getAttribute("aria-pressed")
    ).toBe("true")
    expect(container.querySelectorAll("button").length).toBeLessThan(100)
  })

  it("starts search results at the top and returns to the current symbol when search clears", () => {
    render()
    render("symbol_2")
    expect(container.firstElementChild!.scrollTop).toBe(0)
    render()
    expect(container.firstElementChild!.scrollTop).toBeGreaterThan(0)
    expect(container.querySelector('[aria-label="symbol 150"]')).not.toBeNull()
  })

  it("starts at the top for an uploaded icon with no matching symbol", () => {
    render("", "custom")
    expect(container.firstElementChild!.scrollTop).toBe(0)
    expect(container.querySelector('[aria-pressed="true"]')).toBeNull()
  })
})
