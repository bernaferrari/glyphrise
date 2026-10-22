"use client"

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { EditorDocumentStore } from "./EditorDocumentStore"
import type { PresetIcon } from "./IconLibrary"
import type { ShapeStop } from "./TimelineModel"
import {
  addShapeStopAtTime,
  applyShapeWipePair,
  removeShapeStopById,
  replaceShapeIcon,
} from "./ShapeSequenceModel"

import {
  createAddIconPickerTarget,
  isAddIconPickerTarget,
} from "./ShapeSequenceModel"

type ShapeSequenceEditorOptions = {
  store: EditorDocumentStore
  shapes: ShapeStop[]
  activeRecipeId: string | null
  duration: number
  /** Where the playhead is now, even mid-playback. */
  getCurrentTime: () => number
}

export function useShapeSequenceEditor({
  store,
  shapes,
  activeRecipeId,
  duration,
  getCurrentTime,
}: ShapeSequenceEditorOptions) {
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(
    () => store.get().shapes[0]?.id ?? null
  )
  const [openShapePicker, setOpenShapePickerRaw] = useState<string | null>(null)
  const pickerIdRef = useRef<string | null>(null)
  const addTimeRef = useRef(0)
  const setOpenShapePicker: Dispatch<SetStateAction<string | null>> =
    useCallback((value) => {
      const id =
        typeof value === "function" ? value(pickerIdRef.current) : value
      pickerIdRef.current = id
      setOpenShapePickerRaw(id)
    }, [])

  const setShapes = useCallback(
    (action: SetStateAction<ShapeStop[]>) => store.set("shapes", action),
    [store]
  )
  const setActiveRecipeId = useCallback(
    (action: SetStateAction<string | null>) =>
      store.set("activeRecipeId", action),
    [store]
  )
  const markCustom = useCallback(
    () => store.set("activeRecipeId", null),
    [store]
  )

  const commitIconSelection = useCallback(
    (shapeId: string, icon: PresetIcon, disabled?: PresetIcon) => {
      const adding = isAddIconPickerTarget(shapeId)
      // A canceled asynchronous symbol/file import must not insert later.
      if (adding && pickerIdRef.current !== shapeId) return
      const previous = store.get().shapes
      let next = previous
      let selectedId = shapeId
      if (adding) {
        const result = addShapeStopAtTime({
          shapes: previous,
          time: addTimeRef.current,
          duration,
          icon,
        })
        if (!result.addedShapeId) return
        next = result.shapes
        selectedId = result.addedShapeId
      } else {
        // The target may have been deleted while a symbol was loading.
        if (!previous.some((shape) => shape.id === shapeId)) return
        next = replaceShapeIcon(previous, shapeId, icon)
      }
      if (disabled)
        next = applyShapeWipePair({
          shapes: next,
          shapeId: selectedId,
          enabled: icon,
          disabled,
          duration,
        })
      store.patch({ shapes: next, activeRecipeId: null })
      setSelectedShapeId(selectedId)
      if (pickerIdRef.current === shapeId) setOpenShapePicker(null)
    },
    [duration, setOpenShapePicker, store]
  )
  const setShapeIcon = useCallback(
    (shapeId: string, icon: PresetIcon) => commitIconSelection(shapeId, icon),
    [commitIconSelection]
  )
  const setShapeWipePair = useCallback(
    (shapeId: string, enabled: PresetIcon, disabled: PresetIcon) =>
      commitIconSelection(shapeId, enabled, disabled),
    [commitIconSelection]
  )

  const addShapeAtPlayhead = useCallback(() => {
    addTimeRef.current = getCurrentTime()
    setOpenShapePicker(createAddIconPickerTarget())
  }, [getCurrentTime, setOpenShapePicker])

  const removeShape = useCallback(
    (shapeId: string) => {
      const result = removeShapeStopById(
        store.get().shapes,
        shapeId,
        selectedShapeId
      )
      if (!result.removed) return
      store.patch({ shapes: result.shapes, activeRecipeId: null })
      setOpenShapePicker(null)
      setSelectedShapeId(result.selectedShapeId)
    },
    [selectedShapeId, setOpenShapePicker, store]
  )

  return {
    shapes,
    setShapes,
    selectedShapeId,
    setSelectedShapeId,
    openShapePicker,
    setOpenShapePicker,
    activeRecipeId,
    setActiveRecipeId,
    markCustom,
    setShapeIcon,
    setShapeWipePair,
    addShapeAtPlayhead,
    removeShape,
  }
}
