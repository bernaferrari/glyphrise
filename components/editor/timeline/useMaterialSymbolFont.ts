import { useEffect } from "react"
import type { MaterialSymbolStyle } from "../IconLibrary"

const FAMILY: Record<MaterialSymbolStyle, string> = {
  outlined: "Outlined",
  rounded: "Rounded",
  sharp: "Sharp",
}

/** Load only the symbol family being browsed, never during editor startup. */
export function useMaterialSymbolFont(
  enabled: boolean,
  style: MaterialSymbolStyle
) {
  useEffect(() => {
    if (!enabled) return
    const id = `glyphrise-symbol-font-${style}`
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+${FAMILY[style]}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block`
    document.head.append(link)
    // Retain loaded families across picker openings and style changes.
  }, [enabled, style])
}
