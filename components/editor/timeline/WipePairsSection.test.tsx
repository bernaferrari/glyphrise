// @vitest-environment happy-dom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MATERIAL_WIPE_PAIRS } from "../MaterialWipePairs"
import { createShapeStop } from "../ShapeSequenceModel"
import { WipePairsSection } from "./WipePairsSection"

describe("wipe pair picker", () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it("shows every pair as the on icon with a drawn slash", () => {
    const onChooseWipePair = vi.fn()
    act(() => {
      root.render(
        <WipePairsSection
          stop={createShapeStop(
            {
              id: "icon",
              name: "Current",
              defaultTint: "#000000",
              svgContent: "<svg/>",
            },
            0,
            "clip"
          )}
          filteredWipePairs={MATERIAL_WIPE_PAIRS}
          materialSymbolClass="material-symbols-outlined"
          symbolStyle={{}}
          onChooseWipePair={onChooseWipePair}
        />
      )
    })

    const buttons = container.querySelectorAll("button")
    expect(buttons).toHaveLength(MATERIAL_WIPE_PAIRS.length)
    expect(container.querySelector('[title="Wifi: wifi"]')).not.toBeNull()
    expect(
      container.querySelector('[title="Mobile Data Arrows: 1x_mobiledata"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[title="Wifi Tethering: wifi_tethering"]')
    ).not.toBeNull()
    expect(container.querySelectorAll('[class*="-rotate-45"]')).toHaveLength(
      MATERIAL_WIPE_PAIRS.length
    )
    expect(container.textContent).not.toContain("wifi_off")
    expect(container.textContent).toContain("1x_mobiledata")

    act(() => {
      container
        .querySelector<HTMLButtonElement>('[title="Wifi: wifi"]')
        ?.click()
    })
    expect(onChooseWipePair).toHaveBeenCalledWith(
      "clip",
      expect.objectContaining({ enabled: "wifi" })
    )
  })
})
