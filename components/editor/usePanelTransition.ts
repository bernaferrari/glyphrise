"use client"

import { useEffect, useRef } from "react"
import { flushSync } from "react-dom"

// Capture the WebGL viewport and panels once, then let the browser animate the
// snapshots. The scene resizes once instead of rebuilding on every frame.
export function useLayoutTransition(prepareSnapshot?: () => void) {
  const active = useRef<ViewTransition | null>(null)

  useEffect(
    () => () => {
      active.current?.skipTransition()
      delete document.documentElement.dataset.panelTransition
    },
    []
  )

  return (update: () => void, direction: "hide" | "show" | "compact") => {
    active.current?.skipTransition()
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      update()
      return
    }
    prepareSnapshot?.()
    document.documentElement.dataset.panelTransition = direction
    const transition = document.startViewTransition(() => {
      flushSync(update)
      // View transitions suspend animation frames during capture. Draw the
      // resized WebGL buffer now so the new snapshot contains the artwork.
      prepareSnapshot?.()
    })
    active.current = transition
    // Rapid toggles can skip snapshot capture; the final state still applies.
    void transition.ready.catch(() => {})
    const cleanup = () => {
      if (active.current !== transition) return
      active.current = null
      delete document.documentElement.dataset.panelTransition
    }
    void transition.finished.then(cleanup, cleanup)
  }
}

export function usePanelTransition(
  onChange: (hidden: boolean) => void,
  prepareSnapshot?: () => void
) {
  const transition = useLayoutTransition(prepareSnapshot)
  return (hidden: boolean) =>
    transition(() => onChange(hidden), hidden ? "hide" : "show")
}
