"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import type { EditorSnapshot } from "./EditorModel"
import {
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
    onRestoreRef.current(nextSnapshot)
  }, [])

  const syncAvailability = useCallback(() => {
    const next = {
      canUndo: historyStateRef.current.undoStack.length > 1,
      canRedo: historyStateRef.current.redoStack.length > 0,
    }
    setAvailability((current) =>
      current.canUndo === next.canUndo && current.canRedo === next.canRedo
        ? current
        : next
    )
  }, [])

  const flushPendingInteraction = useCallback(() => {
    if (pointerInteractionActiveRef.current || isInputDragActiveRef.current()) {
      return
    }
    pointerCoalescingRef.current = false
    const recorded = flushEditorHistoryCommit(
      historyStateRef.current,
      snapshotRef.current,
      maxSize
    )
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
      pointerCoalescingRef.current ||
      historyStateRef.current.gestureActive ||
      historyStateRef.current.pendingCommit
    ) {
      updateEditorHistoryGesture(historyStateRef.current, snapshot)
      if (pointerCoalescingRef.current) scheduleInteractionFlush()
      return
    }

    const recorded = recordEditorHistorySnapshot(
      historyStateRef.current,
      snapshot,
      maxSize
    )
    if (recorded) syncAvailability()
  }, [canRecord, maxSize, scheduleInteractionFlush, snapshot, syncAvailability])

  useEffect(() => {
    const beginPointerInteraction = () => {
      pointerInteractionActiveRef.current = true
      pointerCoalescingRef.current = false
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
        pointerFlushTimeoutRef.current = null
      }
      beginEditorHistoryGesture(
        historyStateRef.current,
        snapshotRef.current,
        maxSize
      )
      syncAvailability()
    }
    const endPointerInteraction = () => {
      pointerInteractionActiveRef.current = false
      commitEditorHistoryGesture(historyStateRef.current, snapshotRef.current)
      scheduleInteractionFlush()
    }
    const cancelPointerInteraction = () => {
      pointerInteractionActiveRef.current = false
      pointerCoalescingRef.current = false
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
        pointerFlushTimeoutRef.current = null
      }
      const restored = cancelEditorHistoryGesture(historyStateRef.current)
      syncAvailability()
      if (restored) restoreSnapshot(restored)
    }
    window.addEventListener("pointerdown", beginPointerInteraction, true)
    window.addEventListener("pointerup", endPointerInteraction, true)
    window.addEventListener("pointercancel", cancelPointerInteraction, true)
    return () => {
      window.removeEventListener("pointerdown", beginPointerInteraction, true)
      window.removeEventListener("pointerup", endPointerInteraction, true)
      window.removeEventListener(
        "pointercancel",
        cancelPointerInteraction,
        true
      )
      if (pointerFlushTimeoutRef.current !== null) {
        clearTimeout(pointerFlushTimeoutRef.current)
      }
    }
  }, [maxSize, restoreSnapshot, scheduleInteractionFlush, syncAvailability])

  const undo = useCallback(() => {
    if (pointerFlushTimeoutRef.current !== null) {
      clearTimeout(pointerFlushTimeoutRef.current)
      pointerFlushTimeoutRef.current = null
    }
    pointerCoalescingRef.current = false
    const previous = undoEditorHistory(
      historyStateRef.current,
      snapshotRef.current,
      maxSize
    )
    syncAvailability()
    if (previous) restoreSnapshot(previous)
  }, [maxSize, restoreSnapshot, syncAvailability])

  const redo = useCallback(() => {
    if (pointerFlushTimeoutRef.current !== null) {
      clearTimeout(pointerFlushTimeoutRef.current)
      pointerFlushTimeoutRef.current = null
    }
    pointerCoalescingRef.current = false
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
