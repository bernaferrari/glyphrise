"use client"

import { useCallback } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import { useEditorShortcuts } from "./useEditorShortcuts"
import { useEditorSnapshotHistory } from "./useEditorSnapshotHistory"

type UseEditorHistorySurfaceArgs = Parameters<
  typeof useEditorSnapshotHistory
>[0] & {
  onPlayPause: () => void
  beforeHistoryChange: () => void
}

export function useEditorHistorySurface({
  onPlayPause,
  beforeHistoryChange,
  ...historyArgs
}: UseEditorHistorySurfaceArgs) {
  const history = useEditorSnapshotHistory(historyArgs)
  const { undo: undoHistory, redo: redoHistory } = history
  const beforeHistoryChangeRef = useLatestRef(beforeHistoryChange)
  const undo = useCallback(() => {
    beforeHistoryChangeRef.current()
    undoHistory()
  }, [undoHistory])
  const redo = useCallback(() => {
    beforeHistoryChangeRef.current()
    redoHistory()
  }, [redoHistory])

  useEditorShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPlayPause,
  })

  return { ...history, undo, redo }
}
