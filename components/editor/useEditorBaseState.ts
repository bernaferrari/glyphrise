"use client"

import { useState, useSyncExternalStore } from "react"
import {
  createEditorDocumentStore,
  type EditorDocumentStore,
} from "./EditorDocumentStore"
import type { LightPosition, MotionTrackId } from "./EditorModel"
import { createDefaultEditorSnapshot } from "./EditorProjectModel"
import { useEditorPlaybackState } from "./useEditorPlaybackState"
import { useInspectorNavigation } from "./useInspectorNavigation"
import { useShapeSequenceEditor } from "./useShapeSequenceEditor"
import { useThemeControls } from "./useThemeControls"
import { useViewportOptions } from "./useViewportOptions"

export const useEditorDocument = (store: EditorDocumentStore) =>
  useSyncExternalStore(store.subscribe, store.get, store.get)

/**
 * The editor's state: the document (one store) plus the session around it —
 * playhead, selection, open panels and view options, none of which is saved.
 */
export function useEditorBaseState() {
  const [store] = useState(() =>
    createEditorDocumentStore(createDefaultEditorSnapshot())
  )
  const document = useEditorDocument(store)
  const theme = useThemeControls()
  const playback = useEditorPlaybackState({
    store,
    duration: document.duration,
  })
  const shapes = useShapeSequenceEditor({
    store,
    shapes: document.shapes,
    activeRecipeId: document.activeRecipeId,
    duration: document.duration,
    getCurrentTime: playback.clock.get,
  })
  const [isAdvancedMaterialOpen, setIsAdvancedMaterialOpen] = useState(false)
  const viewport = useViewportOptions()
  const [selectedMotionTrackId, setSelectedMotionTrackId] =
    useState<MotionTrackId>("rotation")
  const navigation = useInspectorNavigation({
    setAdvancedMaterialOpen: setIsAdvancedMaterialOpen,
    setSelectedMotionTrackId,
    setSelectedShapeId: shapes.setSelectedShapeId,
  })
  // A canvas drag previews rotation here; it reaches the document on release.
  const [previewRotationOffset, setPreviewRotationOffset] =
    useState<LightPosition | null>(null)
  const [isScaleLocked, setIsScaleLocked] = useState(true)

  return {
    store,
    document,
    theme,
    playback,
    shapes,
    advancedMaterial: {
      open: isAdvancedMaterialOpen,
      setOpen: setIsAdvancedMaterialOpen,
    },
    viewport,
    selection: {
      ...navigation,
      selectedMotionTrackId,
      setSelectedMotionTrackId,
    },
    transform: {
      previewRotationOffset,
      setPreviewRotationOffset,
      isScaleLocked,
      setIsScaleLocked,
    },
  }
}

export type EditorBaseState = ReturnType<typeof useEditorBaseState>
