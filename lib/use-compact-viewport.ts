"use client"

import { useEffect, useState } from "react"

/** Phone layout: matches the `max-[720px]` breakpoint used by the editor. */
export const COMPACT_VIEWPORT_QUERY = "(width < 720px)"

/** Tracks a CSS media query; false during server render. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener("change", update)
    return () => list.removeEventListener("change", update)
  }, [query])

  return matches
}

export function useCompactViewport() {
  return useMediaQuery(COMPACT_VIEWPORT_QUERY)
}
