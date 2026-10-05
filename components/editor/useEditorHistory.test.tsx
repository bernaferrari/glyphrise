// @vitest-environment happy-dom
import { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, expect, it, vi } from "vitest"
import type { EditorSnapshot } from "./EditorModel"
import { useEditorHistory } from "./useEditorHistory"
import { beginDocumentEdit, endDocumentEdit } from "@/lib/editor-transactions"

function Harness() {
  const [snapshot, setSnapshot] = useState({ objectScale: 1 } as EditorSnapshot)
  const history = useEditorHistory({
    snapshot,
    canRecord: true,
    maxSize: 50,
    isInputDragActive: () => false,
    onRestore: setSnapshot,
  })
  return (
    <>
      <output>{snapshot.objectScale}</output>
      <button
        onClick={() =>
          setSnapshot((s) => ({ ...s, objectScale: s.objectScale + 1 }))
        }
      >
        Edit
      </button>
      <button disabled={!history.canUndo} onClick={history.undo}>
        Undo
      </button>
      <button disabled={!history.canRedo} onClick={history.redo}>
        Redo
      </button>
      <button>Menu</button>
    </>
  )
}

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
  act(() => root.render(<Harness />))
  cleanups.push(() => {
    act(() => root.unmount())
    host.remove()
  })
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find((b) => b.textContent === label)!
  return {
    button,
    value: () => Number(host.querySelector("output")!.textContent),
  }
}

it("enables the actual Undo button on the first edit with no timer, and separates rapid edits", () => {
  const { button, value } = mount()
  act(() => button("Edit").click())
  expect(button("Undo").disabled).toBe(false)
  act(() => button("Undo").click())
  expect(value()).toBe(1)
  expect(button("Undo").disabled).toBe(true)
  act(() => button("Redo").click())
  act(() => button("Edit").click())
  act(() => button("Undo").click())
  expect(value()).toBe(2)
  act(() => button("Undo").click())
  expect(value()).toBe(1)
})

it("groups authored gestures, includes their pending changes in Undo, and ignores menu pointers", () => {
  const { button, value } = mount()
  act(() =>
    button("Menu").dispatchEvent(new Event("pointerdown", { bubbles: true }))
  )
  act(() => button("Edit").click())
  act(() => button("Edit").click())
  act(() => button("Undo").click())
  expect(value()).toBe(2)
  act(() => beginDocumentEdit())
  act(() => button("Edit").click())
  act(() => button("Edit").click())
  expect(button("Undo").disabled).toBe(false)
  act(() => endDocumentEdit())
  act(() => button("Undo").click())
  expect(value()).toBe(2)
})

it("rolls touch cancellation back and lets the next edit form a fresh transaction", () => {
  const { button, value } = mount()
  act(() => beginDocumentEdit())
  act(() => button("Edit").click())
  expect(button("Undo").disabled).toBe(false)
  act(() => endDocumentEdit(true))
  expect(value()).toBe(1)
  expect(button("Undo").disabled).toBe(true)
  act(() => button("Edit").click())
  act(() => button("Undo").click())
  expect(value()).toBe(1)
})
