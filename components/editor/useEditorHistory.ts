"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import type { EditorSnapshot } from "./EditorModel"
import {
  pushEditorSnapshot,
  rememberRestoredSnapshot,
  stepEditorHistoryBack,
  stepEditorHistoryForward,
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
  const undoStackRef = useRef<EditorSnapshot[]>([])
  const redoStackRef = useRef<EditorSnapshot[]>([])
  const lastUndoSnapshotKeyRef = useRef("")
  const isRestoringUndoRef = useRef(false)
  const pendingDragSnapshotRef = useRef(false)
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
    rememberRestoredSnapshot(nextSnapshot, lastUndoSnapshotKeyRef)
    onRestoreRef.current(nextSnapshot)
  }, [])

  const syncAvailability = useCallback(() => {
    const next = {
      canUndo: undoStackRef.current.length > 1,
      canRedo: redoStackRef.current.length > 0,
    }
    setAvailability((current) =>
      current.canUndo === next.canUndo && current.canRedo === next.canRedo
        ? current
        : next
    )
  }, [])

  useEffect(() => {
    if (!canRecord) return

    if (isRestoringUndoRef.current) {
      isRestoringUndoRef.current = false
      return
    }

    if (isInputDragActiveRef.current()) {
      pendingDragSnapshotRef.current = true
      return
    }

    const recorded = pushEditorSnapshot({
      snapshot,
      undoStackRef,
      redoStackRef,
      lastSnapshotKeyRef: lastUndoSnapshotKeyRef,
      maxSize,
    })
    if (recorded) syncAvailability()
    pendingDragSnapshotRef.current = false
  }, [canRecord, maxSize, snapshot, syncAvailability])

  useEffect(() => {
    const flush = () => {
      if (pendingDragSnapshotRef.current && !isInputDragActiveRef.current()) {
        pendingDragSnapshotRef.current = false
        const recorded = pushEditorSnapshot({
          snapshot: snapshotRef.current,
          undoStackRef,
          redoStackRef,
          lastSnapshotKeyRef: lastUndoSnapshotKeyRef,
          maxSize,
        })
        if (recorded) syncAvailability()
      }
    }
    window.addEventListener("pointerup", flush)
    return () => window.removeEventListener("pointerup", flush)
  }, [maxSize, syncAvailability])

  const undo = useCallback(() => {
    const previous = stepEditorHistoryBack(undoStackRef, redoStackRef, maxSize)
    syncAvailability()
    if (previous) restoreSnapshot(previous)
  }, [maxSize, restoreSnapshot, syncAvailability])

  const redo = useCallback(() => {
    const next = stepEditorHistoryForward(undoStackRef, redoStackRef, maxSize)
    syncAvailability()
    if (next) restoreSnapshot(next)
  }, [maxSize, restoreSnapshot, syncAvailability])

  const resetHistory = useCallback(
    (nextSnapshot: EditorSnapshot, expectStateChange = false) => {
      undoStackRef.current = [nextSnapshot]
      redoStackRef.current = []
      rememberRestoredSnapshot(nextSnapshot, lastUndoSnapshotKeyRef)
      pendingDragSnapshotRef.current = false
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
