"use client"

import { useEffect, useRef } from "react"
import { flushSync } from "react-dom"

// Capture the WebGL viewport and panels once, then let the browser animate the
// snapshots. The scene resizes once instead of rebuilding on every frame.
export function usePanelTransition(onChange: (hidden: boolean) => void) {
  const active = useRef<ViewTransition | null>(null)

  useEffect(
    () => () => {
      active.current?.skipTransition()
      delete document.documentElement.dataset.panelTransition
    },
    []
  )

  return (hidden: boolean) => {
    active.current?.skipTransition()
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onChange(hidden)
      return
    }
    document.documentElement.dataset.panelTransition = hidden ? "hide" : "show"
    const transition = document.startViewTransition(() => {
      flushSync(() => onChange(hidden))
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
