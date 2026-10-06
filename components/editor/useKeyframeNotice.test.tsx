// @vitest-environment happy-dom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, expect, it, vi } from "vitest"
import { useKeyframeNotice } from "./useKeyframeNotice"

const cleanups: Array<() => void> = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  vi.unstubAllGlobals()
})

function mount() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const host = document.createElement("div")
  document.body.append(host)
  const root = createRoot(host)
  function Harness(props: Parameters<typeof useKeyframeNotice>[0]) {
    return <output>{useKeyframeNotice(props)}</output>
  }
  cleanups.push(() => {
    act(() => root.unmount())
    host.remove()
  })
  return (keyframeCount: number, restoring = false, projectId = "project") => {
    act(() =>
      root.render(
        <Harness
          {...{ keyframeCount, restoring, projectId, currentTime: 1.2 }}
        />
      )
    )
    return host.textContent
  }
}

it("establishes a silent baseline throughout restoration before announcing new edits", () => {
  const render = mount()
  expect(render(2, true)).toBe("")
  expect(render(4, true)).toBe("")
  expect(render(6, false)).toBe("")
  expect(render(7)).toBe("Keyframe created at 1.20s")
})

it("silently switches projects and still announces presets in the open project", () => {
  const render = mount()
  expect(render(2)).toBe("")
  expect(render(4, false, "other")).toBe("")
  expect(render(6, false, "other")).toBe("2 keyframes created")
})
