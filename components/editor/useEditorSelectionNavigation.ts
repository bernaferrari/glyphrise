"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import type { MotionTrackId } from "./EditorModel"
import { useInspectorNavigation } from "./useInspectorNavigation"

export function useEditorSelectionNavigation({
  setAdvancedMaterialOpen,
  setSelectedShapeId,
}: {
  setAdvancedMaterialOpen: (open: boolean) => void
  setSelectedShapeId: Dispatch<SetStateAction<string | null>>
}) {
  const [selectedMotionTrackId, setSelectedMotionTrackId] =
    useState<MotionTrackId>("rotation")
  const navigation = useInspectorNavigation({
    setAdvancedMaterialOpen,
    setSelectedMotionTrackId,
    setSelectedShapeId,
  })

  return {
    ...navigation,
    selectedMotionTrackId,
    setSelectedMotionTrackId,
  }
}
