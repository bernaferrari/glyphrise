"use client"

import { useEditorShortcuts } from "./useEditorShortcuts"
import { useEditorSnapshotHistory } from "./useEditorSnapshotHistory"

type UseEditorHistorySurfaceArgs = Parameters<
  typeof useEditorSnapshotHistory
>[0] & {
  onPlayPause: () => void
}

export function useEditorHistorySurface({
  onPlayPause,
  ...historyArgs
}: UseEditorHistorySurfaceArgs) {
  const history = useEditorSnapshotHistory(historyArgs)
  const { undo, redo } = history

  useEditorShortcuts({
    onUndo: undo,
    onRedo: redo,
    onPlayPause,
  })

  return history
}
