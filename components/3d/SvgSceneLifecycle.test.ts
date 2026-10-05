// @vitest-environment happy-dom
import * as THREE from "three"
import { expect, it, vi } from "vitest"
import { bindSvgSceneResize } from "./SvgSceneLifecycle"

it("resizes the drawing buffer once per size change, including duplicate resize events", () => {
  let notifyResize: () => void = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notifyResize = callback
      }
      observe() {}
      disconnect = disconnect
    }
  )
  let width = 640
  let height = 480
  const container = document.createElement("div")
  Object.defineProperties(container, {
    clientWidth: { get: () => width },
    clientHeight: { get: () => height },
  })
  const size = new THREE.Vector2(width, height)
  const renderer = {
    getSize: (target: THREE.Vector2) => target.copy(size),
    setSize: vi.fn((w: number, h: number) => size.set(w, h)),
  }
  const camera = new THREE.PerspectiveCamera(45, width / height)
  const requestRender = vi.fn()
  const unbind = bindSvgSceneResize({
    container,
    rendererRef: { current: renderer as unknown as THREE.WebGLRenderer },
    cameraRef: { current: camera },
    currentZoomRef: { current: 1.5 },
    requestRender,
  })
  try {
    notifyResize()
    window.dispatchEvent(new Event("resize"))
    expect(renderer.setSize).not.toHaveBeenCalled()
    width = 320
    height = 600
    notifyResize()
    window.dispatchEvent(new Event("resize"))
    expect(renderer.setSize).toHaveBeenCalledExactlyOnceWith(width, height)
    expect(requestRender).toHaveBeenCalledTimes(1)
    expect(camera.aspect).toBe(width / height)
    expect(camera.position.z).toBeGreaterThan(0)
    width = 0
    notifyResize()
    expect(renderer.setSize).toHaveBeenCalledTimes(1)
  } finally {
    unbind()
    vi.unstubAllGlobals()
  }
  expect(disconnect).toHaveBeenCalledTimes(1)
})
