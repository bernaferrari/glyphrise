"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import {
  EDITOR_EDIT_BEGIN,
  EDITOR_EDIT_END,
  EDITOR_EDIT_CANCEL,
} from "@/lib/editor-transactions"
import { useLatestRef } from "@/lib/use-latest-ref"
import type { EditorSnapshot } from "./EditorModel"
import {
  editorSnapshotKey,
  beginEditorHistoryGesture,
  cancelEditorHistoryGesture,
  commitEditorHistoryGesture,
  createEditorHistoryState,
  flushEditorHistoryCommit,
  recordEditorHistorySnapshot,
  redoEditorHistory,
  resetEditorHistoryState,
  undoEditorHistory,
  updateEditorHistoryGesture,
} from "./EditorHistory"

export const useEditorHistory = ({
  snapshot,
  canRecord,
  maxSize,
  isInputDragActive,
  onRestore,
}: {
  snapshot: EditorSnapshot
  canRecord: boolean
  maxSize: number
  isInputDragActive: () => boolean
  onRestore: (snapshot: EditorSnapshot) => void
}) => {
  const historyStateRef = useRef(createEditorHistoryState())
  const isRestoringUndoRef = useRef(false)
  const pointerInteractionActiveRef = useRef(false)
  const snapshotRef = useRef(snapshot)
  const onRestoreRef = useLatestRef(onRestore)
  const isInputDragActiveRef = useLatestRef(isInputDragActive)
  const [availability, setAvailability] = useState({
    canUndo: false,
    canRedo: false,
  })

  snapshotRef.current = snapshot

  const restoreSnapshot = useCallback((nextSnapshot: EditorSnapshot) => {
    isRestoringUndoRef.current = true
    onRestoreRef.current(nextSnapshot)
  }, [])

  const syncAvailability = useCallback(() => {
    const next = {
      canUndo:
        historyStateRef.current.undoStack.length > 1 ||
        (historyStateRef.current.gestureActive &&
          historyStateRef.current.undoStack.length > 0 &&
          editorSnapshotKey(snapshotRef.current) !==
            historyStateRef.current.lastSnapshotKey),
      canRedo:
        historyStateRef.current.redoStack.length > 0 &&
        (!historyStateRef.current.gestureActive ||
          editorSnapshotKey(snapshotRef.current) ===
            historyStateRef.current.lastSnapshotKey),
    }
    setAvailability((current) =>
      current.canUndo === next.canUndo && current.canRedo === next.canRedo
        ? current
        : next
    )
  }, [])

  useLayoutEffect(() => {
    if (!canRecord) return

    if (isRestoringUndoRef.current) {
      isRestoringUndoRef.current = false
      syncAvailability()
      return
    }

    if (
      isInputDragActiveRef.current() ||
      pointerInteractionActiveRef.current ||
      historyStateRef.current.gestureActive ||
      historyStateRef.current.pendingCommit
    ) {
      updateEditorHistoryGesture(historyStateRef.current, snapshot)
      syncAvailability()
      return
    }

    const recorded = recordEditorHistorySnapshot(
      historyStateRef.current,
      snapshot,
      maxSize
    )
    if (recorded) syncAvailability()
  }, [canRecord, maxSize, snapshot, syncAvailability])

  useEffect(() => {
    const beginPointerInteraction = () => {
      pointerInteractionActiveRef.current = true
      beginEditorHistoryGesture(
        historyStateRef.current,
        snapshotRef.current,
        maxSize
      )
      syncAvailability()
    }
    const endPointerInteraction = () => {
      if (!historyStateRef.current.gestureActive) return
      pointerInteractionActiveRef.current = false
      commitEditorHistoryGesture(historyStateRef.current, snapshotRef.current)
      flushEditorHistoryCommit(
        historyStateRef.current,
        snapshotRef.current,
        maxSize
      )
      syncAvailability()
    }
    const cancelPointerInteraction = () => {
      if (!historyStateRef.current.gestureActive) return
      pointerInteractionActiveRef.current = false
      const restored = cancelEditorHistoryGesture(historyStateRef.current)
      syncAvailability()
      if (restored) restoreSnapshot(restored)
    }
    window.addEventListener(EDITOR_EDIT_BEGIN, beginPointerInteraction)
    window.addEventListener(EDITOR_EDIT_END, endPointerInteraction)
    window.addEventListener(EDITOR_EDIT_CANCEL, cancelPointerInteraction)
    return () => {
      window.removeEventListener(EDITOR_EDIT_BEGIN, beginPointerInteraction)
      window.removeEventListener(EDITOR_EDIT_END, endPointerInteraction)
      window.removeEventListener(EDITOR_EDIT_CANCEL, cancelPointerInteraction)
    }
  }, [maxSize, restoreSnapshot, syncAvailability])

  const undo = useCallback(() => {
    pointerInteractionActiveRef.current = false
    const previous = undoEditorHistory(
      historyStateRef.current,
      snapshotRef.current,
      maxSize
    )
    syncAvailability()
    if (previous) restoreSnapshot(previous)
  }, [maxSize, restoreSnapshot, syncAvailability])

  const redo = useCallback(() => {
    pointerInteractionActiveRef.current = false
    const next = redoEditorHistory(
      historyStateRef.current,
      snapshotRef.current,
      maxSize
    )
    syncAvailability()
    if (next) restoreSnapshot(next)
  }, [maxSize, restoreSnapshot, syncAvailability])

  const resetHistory = useCallback(
    (nextSnapshot: EditorSnapshot, expectStateChange = false) => {
      resetEditorHistoryState(historyStateRef.current, nextSnapshot)
      pointerInteractionActiveRef.current = false
      isRestoringUndoRef.current = expectStateChange
      syncAvailability()
    },
    [syncAvailability]
  )

  return {
    undo,
    redo,
    resetHistory,
    ...availability,
  }
}
