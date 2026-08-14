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
  const pointerInteractionActiveRef = useRef(false)
  const pointerCoalescingRef = useRef(false)
  const pointerFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
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

  const flushPendingInteraction = useCallback(() => {
    if (
      !pendingDragSnapshotRef.current ||
      pointerInteractionActiveRef.current ||
      isInputDragActiveRef.current()
    ) {
      return
    }
    pendingDragSnapshotRef.current = false
    pointerCoalescingRef.current = false
    const recorded = pushEditorSnapshot({
      snapshot: snapshotRef.current,
      undoStackRef,
      redoStackRef,
      lastSnapshotKeyRef: lastUndoSnapshotKeyRef,
      maxSize,
    })
    if (recorded) syncAvailability()
  }, [maxSize, syncAvailability])

  const scheduleInteractionFlush = useCallback(() => {
    if (pointerFlushTimeoutRef.current !== null) {
      clearTimeout(pointerFlushTimeoutRef.current)
    }
    pointerCoalescingRef.current = true
    pointerFlushTimeoutRef.current = setTimeout(() => {
      pointerFlushTimeoutRef.current = null
      flushPendingInteraction()
    }, 180)
  }, [flushPendingInteraction])

  useEffect(() => {
    if (!canRecord) return

    if (isRestoringUndoRef.current) {
      isRestoringUndoRef.current = false
      return
    }

    if (
      isInputDragActiveRef.current() ||
      pointerInteractionActiveRef.current ||
      pointerCoalescingRef.current
    ) {
      pendingDragSnapshotRef.current = true
      if (pointerCoalescingRef.current) scheduleInteractionFlush()
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
  }, [canRecord, maxSize, scheduleInteractionFlush, snapshot, syncAvailability])

  useEffect(() => {
    const beginPointerInteraction = () => {
      pointerInteractionActiveRef.current = true
      pointerCoalescingRef.current = false
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
        pointerFlushTimeoutRef.current = null
      }
    }
    const endPointerInteraction = () => {
      pointerInteractionActiveRef.current = false
      if (pendingDragSnapshotRef.current) scheduleInteractionFlush()
    }
    window.addEventListener("pointerdown", beginPointerInteraction, true)
    window.addEventListener("pointerup", endPointerInteraction, true)
    window.addEventListener("pointercancel", endPointerInteraction, true)
    return () => {
      window.removeEventListener("pointerdown", beginPointerInteraction, true)
      window.removeEventListener("pointerup", endPointerInteraction, true)
      window.removeEventListener("pointercancel", endPointerInteraction, true)
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
      }
    }
  }, [scheduleInteractionFlush])

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
      pointerInteractionActiveRef.current = false
      pointerCoalescingRef.current = false
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
        pointerFlushTimeoutRef.current = null
      }
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
