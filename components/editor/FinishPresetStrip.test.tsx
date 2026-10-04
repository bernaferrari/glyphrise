// @vitest-environment happy-dom

import React, { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FinishPresetStrip } from "./FinishPresetStrip"

const { renderThumbnail } = vi.hoisted(() => ({
  renderThumbnail: vi.fn(async () => "data:image/png;base64,preview"),
}))

vi.mock("../3d/FinishThumbnails", () => ({
  THUMBNAIL_SPHERE_FILL: 0.85,
  cachedFinishThumbnail: () => null,
  finishPreviewFillKey: (fill: { color: string }) => fill.color,
  renderFinishThumbnail: renderThumbnail,
}))

describe("finish thumbnail startup work", () => {
  let root: Root
  let container: HTMLDivElement
  let visibility: IntersectionObserverCallback

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
    vi.stubGlobal("requestIdleCallback", undefined)
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          visibility = callback
        }
        observe() {}
        disconnect() {}
      }
    )
    renderThumbnail.mockClear()
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root.render(
        <FinishPresetStrip
          value="satin"
          fill={{ color: "#ff5b9a" }}
          onChange={() => {}}
        />
      )
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const show = (visible: boolean) =>
    act(() => {
      visibility(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })

  it("does no WebGL thumbnail work while the phone inspector is hidden", async () => {
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(renderThumbnail).not.toHaveBeenCalled()
  })

  it("yields between visible thumbnails instead of rendering a batch in one task", async () => {
    show(true)
    await act(() => vi.advanceTimersByTimeAsync(152))
    // Strip and mosaic each render one thumbnail on their first turn.
    expect(renderThumbnail).toHaveBeenCalledTimes(2)
    await act(() => vi.advanceTimersByTimeAsync(32))
    expect(renderThumbnail).toHaveBeenCalledTimes(4)
  })

  it("cancels remaining work when the inspector leaves the screen", async () => {
    show(true)
    await act(() => vi.advanceTimersByTimeAsync(152))
    const rendered = renderThumbnail.mock.calls.length
    show(false)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(renderThumbnail).toHaveBeenCalledTimes(rendered)
  })
})
