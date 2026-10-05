"use client"

import { useEffect, useState } from "react"

/** Phone layout: matches the `max-[720px]` breakpoint used by the editor. */
export const COMPACT_VIEWPORT_QUERY = "(width < 720px)"

export function useCompactViewport() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(COMPACT_VIEWPORT_QUERY)
    const update = () => setIsCompact(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return isCompact
}
