"use client"

import { useCallback } from "react"
import { clampNumber, type EditorSnapshot } from "./EditorModel"
import { isInspectorInputDragActive } from "./InspectorControlModel"
import type { MotionRecipe } from "./MotionRecipes"
import { createEditorSnapshotFromRecipe } from "./RecipeModel"
import type { EditorBaseState } from "./useEditorBaseState"
import { useEditorProjects } from "./useEditorProjects"
import { useEditorShortcuts } from "./useEditorShortcuts"

/** Undo/redo, project files and recipes: everything that swaps the document. */
export function useEditorDocumentLifecycle(editor: EditorBaseState) {
  const { store, document, playback, shapes, selection, transform } = editor

  // Editor state outside the document that would be stale on another one.
  const resetEditorForDocument = (next: EditorSnapshot) => {
    playback.setIsPlaying(false)
    playback.setCurrentTime((time) => clampNumber(time, 0, next.duration))
    shapes.setSelectedShapeId((currentId) =>
      currentId && next.shapes.some((shape) => shape.id === currentId)
        ? currentId
        : (next.shapes[0]?.id ?? null)
    )
    shapes.setOpenShapePicker(null)
    transform.setPreviewRotationOffset(null)
    transform.setIsScaleLocked(true)
  }

  const projects = useEditorProjects({
    store,
    document,
    onRestore: resetEditorForDocument,
    isInputDragActive: isInspectorInputDragActive,
  })

  const { undo: undoHistory, redo: redoHistory } = projects
  const { canvas3DRef } = playback
  // A rotation drag in progress is part of the edit being undone.
  const undo = useCallback(() => {
    canvas3DRef.current?.commitRotationEdit()
    undoHistory()
  }, [canvas3DRef, undoHistory])
  const redo = useCallback(() => {
    canvas3DRef.current?.commitRotationEdit()
    redoHistory()
  }, [canvas3DRef, redoHistory])

  useEditorShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPlayPause: playback.togglePlayback,
  })

  const applyRecipe = (recipe: MotionRecipe) => {
    resetEditorForDocument(store.get())
    playback.setCurrentTime(0)
    selection.setSelectedMotionTrackId("rotation")
    store.patch(createEditorSnapshotFromRecipe(store.get(), recipe))
  }

  return {
    historyActions: {
      undo,
      redo,
      canUndo: projects.canUndo,
      canRedo: projects.canRedo,
    },
    projectFiles: projects,
    applyRecipe,
  }
}
