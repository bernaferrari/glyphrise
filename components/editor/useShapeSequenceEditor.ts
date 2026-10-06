"use client"

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { PresetIcon } from "./IconLibrary"
import type { ShapeStop } from "./TimelineModel"
import {
  addShapeStopAtTime,
  applyShapeWipePair,
  createDefaultShapeSequence,
  removeShapeStopById,
  replaceShapeIcon,
} from "./ShapeSequenceModel"

import {
  createAddIconPickerTarget,
  isAddIconPickerTarget,
} from "./ShapePickerTarget"

type ShapeSequenceEditorOptions = {
  currentTime: number
  duration: number
}

export function useShapeSequenceEditor({
  currentTime,
  duration,
}: ShapeSequenceEditorOptions) {
  const initialShapesRef = useRef<ShapeStop[] | null>(null)
  if (!initialShapesRef.current) {
    initialShapesRef.current = createDefaultShapeSequence()
  }
  const [shapes, setShapes] = useState<ShapeStop[]>(
    () => initialShapesRef.current ?? []
  )
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(
    () => initialShapesRef.current?.[0]?.id ?? null
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
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null)

  const markCustom = useCallback(() => setActiveRecipeId(null), [])

  const commitIconSelection = useCallback(
    (shapeId: string, icon: PresetIcon, disabled?: PresetIcon) => {
      const adding = isAddIconPickerTarget(shapeId)
      // A canceled asynchronous symbol/file import must not insert later.
      if (adding && pickerIdRef.current !== shapeId) return
      const insertionTime = addTimeRef.current
      setShapes((prev) => {
        let next = prev
        let selectedId = shapeId
        if (adding) {
          const result = addShapeStopAtTime({
            shapes: prev,
            time: insertionTime,
            duration,
            icon,
          })
          if (!result.addedShapeId) return prev
          next = result.shapes
          selectedId = result.addedShapeId
        } else {
          // The target may have been deleted while a symbol was loading.
          if (!prev.some((shape) => shape.id === shapeId)) return prev
          next = replaceShapeIcon(prev, shapeId, icon)
        }
        if (disabled)
          next = applyShapeWipePair({
            shapes: next,
            shapeId: selectedId,
            enabled: icon,
            disabled,
            duration,
          })
        markCustom()
        setSelectedShapeId(selectedId)
        return next
      })
      if (pickerIdRef.current === shapeId) setOpenShapePicker(null)
    },
    [duration, markCustom, setOpenShapePicker]
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
    addTimeRef.current = currentTime
    setOpenShapePicker(createAddIconPickerTarget())
  }, [currentTime, setOpenShapePicker])

  const removeShape = useCallback(
    (shapeId: string) => {
      setShapes((prev) => {
        const result = removeShapeStopById(prev, shapeId, selectedShapeId)
        if (!result.removed) return prev
        markCustom()
        setOpenShapePicker(null)
        setSelectedShapeId(result.selectedShapeId)
        return result.shapes
      })
    },
    [markCustom, selectedShapeId]
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
