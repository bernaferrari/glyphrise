import type { EditorSnapshot } from "./EditorModel"

export const editorSnapshotKey = (snapshot: EditorSnapshot) =>
  JSON.stringify(snapshot)

export type EditorHistoryState = {
  undoStack: EditorSnapshot[]
  redoStack: EditorSnapshot[]
  lastSnapshotKey: string
  gestureActive: boolean
  gestureSnapshot: EditorSnapshot | null
  pendingCommit: EditorSnapshot | null
}

export const createEditorHistoryState = (
  initial?: EditorSnapshot
): EditorHistoryState => ({
  undoStack: initial ? [initial] : [],
  redoStack: [],
  lastSnapshotKey: initial ? editorSnapshotKey(initial) : "",
  gestureActive: false,
  gestureSnapshot: null,
  pendingCommit: null,
})

const pushSnapshot = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot,
  maxSize: number
) => {
  const key = editorSnapshotKey(snapshot)
  if (state.lastSnapshotKey === key) return false

  state.undoStack = [...state.undoStack, snapshot].slice(-maxSize)
  state.redoStack = []
  state.lastSnapshotKey = key
  return true
}

export const flushEditorHistoryCommit = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot | null,
  maxSize: number
) => {
  if (!state.pendingCommit && !state.gestureActive) return false
  const toCommit = snapshot ?? state.pendingCommit ?? state.gestureSnapshot
  if (!toCommit) return false

  state.pendingCommit = null
  state.gestureActive = false
  state.gestureSnapshot = null
  return pushSnapshot(state, toCommit, maxSize)
}

export const beginEditorHistoryGesture = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot,
  maxSize: number
) => {
  flushEditorHistoryCommit(state, snapshot, maxSize)
  state.gestureActive = true
  state.gestureSnapshot = snapshot
}

export const updateEditorHistoryGesture = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot
) => {
  if (state.gestureActive) {
    state.gestureSnapshot = snapshot
    return
  }
  if (state.pendingCommit) {
    state.pendingCommit = snapshot
  }
}

export const commitEditorHistoryGesture = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot
) => {
  if (!state.gestureActive) return
  state.pendingCommit = snapshot
  state.gestureActive = false
  state.gestureSnapshot = null
}

export const cancelEditorHistoryGesture = (state: EditorHistoryState) => {
  state.gestureActive = false
  state.gestureSnapshot = null
  state.pendingCommit = null
  return state.undoStack[state.undoStack.length - 1] ?? null
}

export const recordEditorHistorySnapshot = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot,
  maxSize: number
) => {
  if (state.gestureActive) {
    state.gestureSnapshot = snapshot
    return false
  }
  if (state.pendingCommit) {
    state.pendingCommit = snapshot
    return false
  }
  return pushSnapshot(state, snapshot, maxSize)
}

export const undoEditorHistory = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot,
  maxSize: number
) => {
  flushEditorHistoryCommit(state, snapshot, maxSize)
  if (state.undoStack.length <= 1) return null

  const current = state.undoStack[state.undoStack.length - 1]
  state.undoStack = state.undoStack.slice(0, -1)
  state.redoStack = [...state.redoStack, current].slice(-maxSize)
  const previous = state.undoStack[state.undoStack.length - 1] ?? null
  if (previous) state.lastSnapshotKey = editorSnapshotKey(previous)
  return previous
}

export const redoEditorHistory = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot,
  maxSize: number
) => {
  flushEditorHistoryCommit(state, snapshot, maxSize)
  if (state.redoStack.length === 0) return null

  const next = state.redoStack[state.redoStack.length - 1]
  state.redoStack = state.redoStack.slice(0, -1)
  state.undoStack = [...state.undoStack, next].slice(-maxSize)
  state.lastSnapshotKey = editorSnapshotKey(next)
  return next
}

export const resetEditorHistoryState = (
  state: EditorHistoryState,
  snapshot: EditorSnapshot
) => {
  state.undoStack = [snapshot]
  state.redoStack = []
  state.lastSnapshotKey = editorSnapshotKey(snapshot)
  state.gestureActive = false
  state.gestureSnapshot = null
  state.pendingCommit = null
}
