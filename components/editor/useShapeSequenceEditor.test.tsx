// @vitest-environment happy-dom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import { useShapeSequenceEditor } from "./useShapeSequenceEditor"
import { DEFAULT_WIPE_PAIR } from "./DefaultShapeIcons"
import { createEditorDocumentStore } from "./EditorDocumentStore"
import { createDefaultEditorSnapshot } from "./EditorProjectModel"
import { useEditorDocument } from "./useEditorBaseState"

const store = () => createEditorDocumentStore(createDefaultEditorSnapshot())

function useHarnessEditor(documentStore: ReturnType<typeof store>) {
  const document = useEditorDocument(documentStore)
  return useShapeSequenceEditor({
    store: documentStore,
    shapes: document.shapes,
    activeRecipeId: document.activeRecipeId,
    duration: 5,
    getCurrentTime: () => 2,
  })
}

it("keeps the document untouched until an icon is chosen and cancels without an edit", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  let editor!: ReturnType<typeof useShapeSequenceEditor>
  const documentStore = store()
  function Harness() {
    editor = useHarnessEditor(documentStore)
    return null
  }
  const root = createRoot(document.createElement("div"))
  try {
    act(() => root.render(<Harness />))
    act(() => editor.setActiveRecipeId("test-recipe"))
    const shapes = editor.shapes
    const selected = editor.selectedShapeId
    act(() => editor.addShapeAtPlayhead())
    expect(editor.shapes).toBe(shapes)
    expect(editor.selectedShapeId).toBe(selected)
    expect(editor.activeRecipeId).toBe("test-recipe")
    expect(editor.openShapePicker).not.toBeNull()
    const canceledTarget = editor.openShapePicker!
    act(() => editor.setOpenShapePicker(null))
    act(() => editor.setShapeIcon(canceledTarget, DEFAULT_WIPE_PAIR[1]))
    expect(editor.shapes).toBe(shapes)
    act(() => editor.addShapeAtPlayhead())
    const target = editor.openShapePicker!
    act(() => editor.setShapeIcon(target, DEFAULT_WIPE_PAIR[1]))
    expect(editor.shapes).toHaveLength(shapes.length + 1)
    expect(
      editor.shapes.find((shape) => shape.id === editor.selectedShapeId)
    ).toMatchObject({
      time: 2,
      iconId: DEFAULT_WIPE_PAIR[1].id,
      svgContent: DEFAULT_WIPE_PAIR[1].svgContent,
    })
    expect(editor.activeRecipeId).toBeNull()
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})

it("inserts a selected wipe pair without a placeholder clip", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  let editor!: ReturnType<typeof useShapeSequenceEditor>
  const documentStore = store()
  function Harness() {
    editor = useHarnessEditor(documentStore)
    return null
  }
  const root = createRoot(document.createElement("div"))
  try {
    act(() => root.render(<Harness />))
    act(() => editor.setShapes([editor.shapes[0]]))
    const original = editor.shapes[0]
    act(() => editor.addShapeAtPlayhead())
    expect(editor.shapes).toHaveLength(1)
    act(() =>
      editor.setShapeWipePair(
        editor.openShapePicker!,
        DEFAULT_WIPE_PAIR[0],
        DEFAULT_WIPE_PAIR[1]
      )
    )
    expect(editor.shapes).toHaveLength(3)
    expect(editor.shapes[0]).toBe(original)
    expect(editor.shapes[1]).toMatchObject({
      time: 2,
      iconId: DEFAULT_WIPE_PAIR[0].id,
      transitionType: "wipe",
    })
    expect(editor.shapes[2].iconId).toBe(DEFAULT_WIPE_PAIR[1].id)
    expect(editor.shapes[2].time).toBeGreaterThan(2)
    expect(editor.selectedShapeId).toBe(editor.shapes[1].id)
    expect(editor.openShapePicker).toBeNull()
    act(() => editor.setShapeIcon(original.id, DEFAULT_WIPE_PAIR[1]))
    expect(editor.shapes).toHaveLength(3)
    expect(editor.shapes[0].iconId).toBe(DEFAULT_WIPE_PAIR[1].id)
  } finally {
    act(() => root.unmount())
    vi.unstubAllGlobals()
  }
})
