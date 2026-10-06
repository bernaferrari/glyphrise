import { useEffect } from "react"
import { useLatestRef } from "@/lib/use-latest-ref"
import { isEditableShortcutTarget } from "./EditorModel"

export const useEditorShortcuts = ({
  onUndo,
  onRedo,
  onPlayPause,
}: {
  onUndo: () => void
  onRedo: () => void
  onPlayPause: () => void
}) => {
  const callbacksRef = useLatestRef({ onUndo, onRedo, onPlayPause })

  useEffect(() => {
    const handleEditorShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.repeat && event.code !== "Space") return
      if (isEditableShortcutTarget(event.target)) return
      // Dialogs own keyboard interaction while the editor is in the background.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return

      const key = event.key.toLowerCase()
      const commandOrControl = event.metaKey || event.ctrlKey
      const isRedoShortcut =
        commandOrControl && event.shiftKey && !event.altKey && key === "z"
      if (isRedoShortcut) {
        event.preventDefault()
        callbacksRef.current.onRedo()
        return
      }

      const isUndoShortcut =
        commandOrControl && !event.shiftKey && !event.altKey && key === "z"
      if (isUndoShortcut) {
        event.preventDefault()
        callbacksRef.current.onUndo()
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.code === "Space") {
        // Preserve native activation and custom controls' Space handling.
        if (
          event.target instanceof Element &&
          !event.target.closest("[data-timeline-playback-surface]") &&
          event.target.closest(
            'button, a[href], summary, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="slider"], [role="menuitem"], [role="option"]'
          )
        )
          return
        event.preventDefault()
        if (!event.repeat) callbacksRef.current.onPlayPause()
      }
    }

    window.addEventListener("keydown", handleEditorShortcut)
    return () => window.removeEventListener("keydown", handleEditorShortcut)
  }, [])
}

/**
 * Stepping matches ShapeShifter: `,` and `.` jump between keyframes (the ‹ ›
 * transport buttons), `<` and `>` (Shift) move one frame. On timeline
 * surfaces, arrows step one frame and Shift+arrows step ten.
 */
export const useTimelineStepShortcuts = ({
  onPreviousKeyframe,
  onNextKeyframe,
  onStepFrames,
}: {
  onPreviousKeyframe: () => void
  onNextKeyframe: () => void
  onStepFrames: (frames: number) => void
}) => {
  const callbacksRef = useLatestRef({
    onPreviousKeyframe,
    onNextKeyframe,
    onStepFrames,
  })

  useEffect(() => {
    const handleStep = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditableShortcutTarget(event.target)) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return
      const callbacks = callbacksRef.current
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (
          !(event.target instanceof Element) ||
          !event.target.closest("[data-timeline-step-surface]")
        )
          return
        // Sliders, tabs, menus, and focused keyframes own their arrow keys.
        if (
          event.target.closest(
            '[role="slider"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="option"]'
          )
        )
          return
        event.preventDefault()
        callbacks.onStepFrames(
          (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 10 : 1)
        )
      } else if (event.key === "<" || event.key === ">") {
        event.preventDefault()
        callbacks.onStepFrames(event.key === "<" ? -1 : 1)
      } else if (event.key === ",") {
        event.preventDefault()
        callbacks.onPreviousKeyframe()
      } else if (event.key === ".") {
        event.preventDefault()
        callbacks.onNextKeyframe()
      }
    }
    window.addEventListener("keydown", handleStep)
    return () => window.removeEventListener("keydown", handleStep)
  }, [])
}
