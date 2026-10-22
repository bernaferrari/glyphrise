import type { EditorSnapshot } from "./EditorModel"
import { linkQualityKeyframes } from "./KeyframeChannelModel"

/**
 * The one home of the editable document. Every persisted field lives here, so
 * history, autosave and export read a single value instead of reassembling it
 * from per-property React state.
 *
 * "edit" changes come from the user; "restore" replaces the document wholesale
 * (undo, redo, opening a project) and is not treated as new work.
 */
export type EditorDocumentChangeOrigin = "edit" | "restore"

export type EditorDocumentChange = {
  next: EditorSnapshot
  previous: EditorSnapshot
  origin: EditorDocumentChangeOrigin
}

type ValueAction<T> = T | ((previous: T) => T)

export type EditorDocumentStore = {
  get: () => EditorSnapshot
  subscribe: (listener: () => void) => () => void
  onChange: (listener: (change: EditorDocumentChange) => void) => () => void
  set: <Key extends keyof EditorSnapshot>(
    key: Key,
    action: ValueAction<EditorSnapshot[Key]>
  ) => void
  patch: (patch: Partial<EditorSnapshot>) => void
  replace: (next: EditorSnapshot) => void
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Setting `{ x: 1 }` over an equal `{ x: 1 }` is not an edit. */
export const isSameDocumentValue = (previous: unknown, next: unknown) => {
  if (Object.is(previous, next)) return true
  if (!isPlainRecord(previous) || !isPlainRecord(next)) return false
  const keys = Object.keys(previous)
  return (
    keys.length === Object.keys(next).length &&
    keys.every((key) => Object.is(previous[key], next[key]))
  )
}

export function createEditorDocumentStore(
  initial: EditorSnapshot
): EditorDocumentStore {
  let document = linkQualityKeyframes(initial)
  const listeners = new Set<() => void>()
  const changeListeners = new Set<(change: EditorDocumentChange) => void>()

  const commit = (
    candidate: EditorSnapshot,
    origin: EditorDocumentChangeOrigin
  ) => {
    const previous = document
    const next = linkQualityKeyframes(candidate)
    if (next === previous) return
    document = next
    changeListeners.forEach((listener) => listener({ next, previous, origin }))
    listeners.forEach((listener) => listener())
  }

  const patch = (changes: Partial<EditorSnapshot>) => {
    let next = document
    for (const key of Object.keys(changes) as Array<keyof EditorSnapshot>) {
      if (isSameDocumentValue(next[key], changes[key])) continue
      next = { ...next, [key]: changes[key] }
    }
    commit(next, "edit")
  }

  return {
    get: () => document,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    onChange: (listener) => {
      changeListeners.add(listener)
      return () => changeListeners.delete(listener)
    },
    set: (key, action) => {
      const value =
        typeof action === "function"
          ? (action as (previous: unknown) => EditorSnapshot[typeof key])(
              document[key]
            )
          : action
      // Read `document` again: the updater may itself have edited other keys.
      patch({ [key]: value } as Partial<EditorSnapshot>)
    },
    patch,
    // Always a new value: a restore must re-render even onto an equal document,
    // because history waits for that render to finish restoring.
    replace: (next) => commit({ ...next }, "restore"),
  }
}
