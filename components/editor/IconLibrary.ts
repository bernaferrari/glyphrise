import type { CSSProperties } from "react"
import { appendGlyphriseSlash, normalizeSvgToIconViewBox } from "../3d/SvgText"
import materialSymbolNames from "./MaterialSymbolNames.generated.json"
import materialSymbolAliases from "./MaterialSymbolAliases.generated.json"
import { validateAndSanitizeSvg } from "./SvgImportModel"

export interface PresetIcon {
  id: string
  name: string
  defaultTint: string
  category?: string
  tags?: string[]
  svgContent: string
}

const materialSymbolCache = new Map<string, PresetIcon>()

export type MaterialSymbolStyle = "outlined" | "rounded" | "sharp"

const materialSymbolFolder: Record<MaterialSymbolStyle, string> = {
  outlined: "materialsymbolsoutlined",
  rounded: "materialsymbolsrounded",
  sharp: "materialsymbolssharp",
}

export const normalizeMaterialSymbolName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

export interface MaterialSymbolFontSettings {
  fill: 0 | 1
  weight: number
  grade: number
  opticalSize: number
}

export type MaterialSymbolPreviewStyle = CSSProperties & {
  "--symbol-variation"?: string
}

export const materialSymbolFontStyle = (
  settings: MaterialSymbolFontSettings
): MaterialSymbolPreviewStyle => ({
  "--symbol-variation": `'FILL' ${settings.fill}, 'wght' ${settings.weight}, 'GRAD' ${settings.grade}, 'opsz' ${settings.opticalSize}`,
})

const titleFromMaterialSymbolName = (name: string) =>
  name
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ")

const materialSymbolUrl = (name: string, style: MaterialSymbolStyle) => {
  const folder = materialSymbolFolder[style]
  return `https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/${name}/${folder}/${name}_24px.svg`
}

const fetchMaterialSymbolSvg = async (
  name: string,
  style: MaterialSymbolStyle
) => {
  const aliases = materialSymbolAliases as Record<string, string[]>
  // Font ligatures can share a glyph, while only its canonical name has an SVG.
  for (const candidate of [name, ...(aliases[name] ?? [])]) {
    const response = await fetch(materialSymbolUrl(candidate, style))
    if (response.ok) return response.text()
    if (response.status !== 404) break
  }
  throw new Error(`Material Symbol "${name}" was not found.`)
}

export async function fetchMaterialSymbolIcon(
  name: string,
  style: MaterialSymbolStyle = "outlined",
  options: { syntheticOffSlash?: boolean; useRealOffPath?: boolean } = {}
): Promise<PresetIcon> {
  const symbolName = normalizeMaterialSymbolName(name)
  if (!symbolName) throw new Error("Enter a Material Symbol name.")

  const syntheticOffSlash = Boolean(
    symbolName.endsWith("_off") &&
    (options.syntheticOffSlash || !options.useRealOffPath)
  )
  const cacheKey = `${style}:${symbolName}:${syntheticOffSlash ? "slash" : "real"}`
  const cached = materialSymbolCache.get(cacheKey)
  if (cached) return cached

  if (syntheticOffSlash) {
    const baseName = symbolName.slice(0, -4)
    const svgContent = validateAndSanitizeSvg(
      appendGlyphriseSlash(
        (await fetchMaterialSymbolSvg(baseName, style)).trim()
      )
    )
    const icon: PresetIcon = {
      id: `material-symbol-${style}-${symbolName}-slash`,
      name: titleFromMaterialSymbolName(symbolName),
      category: "Material Symbols",
      tags: [symbolName, baseName, style, "slash"],
      defaultTint: "#4285F4",
      svgContent,
    }
    materialSymbolCache.set(cacheKey, icon)
    return icon
  }

  const svgContent = validateAndSanitizeSvg(
    normalizeSvgToIconViewBox(
      (await fetchMaterialSymbolSvg(symbolName, style)).trim()
    )
  )
  if (!svgContent.startsWith("<svg") || !svgContent.includes("<path")) {
    throw new Error(
      `Material Symbol "${symbolName}" did not return a usable SVG.`
    )
  }

  const icon: PresetIcon = {
    id: `material-symbol-${style}-${symbolName}`,
    name: titleFromMaterialSymbolName(symbolName),
    category: "Material Symbols",
    tags: [symbolName, style],
    defaultTint: "#4285F4",
    svgContent,
  }
  materialSymbolCache.set(cacheKey, icon)
  return icon
}

export function getMaterialSymbolNames(): string[] {
  return materialSymbolNames
}

export async function fetchMaterialSymbolNames(): Promise<string[]> {
  return getMaterialSymbolNames()
}

const CORE_ICONS: PresetIcon[] = [
  {
    id: "heart",
    name: "Heart",
    defaultTint: "#ff5b9a",
    category: "Social",
    tags: ["love", "like", "favorite"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  },
  {
    id: "star",
    name: "Star",
    defaultTint: "#ffcc4d",
    category: "Status",
    tags: ["favorite", "rating", "featured"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
  },
  {
    id: "bell",
    name: "Bell",
    defaultTint: "#f1ad36",
    category: "Alerts",
    tags: ["notification", "alarm", "ring"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`,
  },
  {
    id: "cloud",
    name: "Cloud",
    defaultTint: "#bcd1ff",
    category: "Objects",
    tags: ["weather", "storage", "sync"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>`,
  },
  {
    id: "gift",
    name: "Gift",
    defaultTint: "#a48bff",
    category: "Objects",
    tags: ["present", "reward", "box"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.62 0-2.95 1.29-2.99 2.91L12 5l-.01-.09C11.95 3.29 10.62 2 9 2c-1.66 0-3 1.34-3 3 0 .35.07.69.18 1H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 14H4v-2h16v2zm0-5H4V8h16v5z"/></svg>`,
  },
  {
    id: "sparkle",
    name: "Sparkle",
    defaultTint: "#ff8fc5",
    category: "Effects",
    tags: ["magic", "shine", "highlight"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>`,
  },
  {
    id: "trophy",
    name: "Trophy",
    defaultTint: "#ffd700",
    category: "Status",
    tags: ["award", "winner", "achievement"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.42 1.72 4.44 4 4.9V17c0 1.1.9 2 2 2h1v3h6v-3h1c1.1 0 2-.9 2-2v-4.1c2.28-.46 4-2.48 4-4.9V7c0-1.1-.9-2-2-2zM5 10V7h2v3H5zm14 0h-2V7h2v3z"/></svg>`,
  },
  {
    id: "shield",
    name: "Shield",
    defaultTint: "#4ee2a3",
    category: "Security",
    tags: ["safe", "protect", "verified"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`,
  },
  {
    id: "bolt",
    name: "Lightning Bolt",
    defaultTint: "#ffd23f",
    category: "Effects",
    tags: ["energy", "power", "fast"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M11 21h-1l1-7H7.5c-.5 0-.8-.3-.9-.5-.1-.2-.1-.6.1-.8L13 3h1l-1 7h3.5c.4 0 .7.2.9.5.1.2.1.6-.1.8L11 21z"/></svg>`,
  },
  {
    id: "smile",
    name: "Smile",
    defaultTint: "#5bc0be",
    category: "Social",
    tags: ["face", "happy", "mood"],
    svgContent: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/></svg>`,
  },
  {
    id: "crown",
    name: "Crown",
    defaultTint: "#ffc94d",
    category: "Status",
    tags: ["king", "premium", "vip"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M3 18h18v2H3zM3 7l4.5 4L12 4l4.5 7L21 7l-2 9H5z"/></svg>`,
  },
  {
    id: "gem",
    name: "Gem",
    defaultTint: "#5ad8ff",
    category: "Status",
    tags: ["diamond", "jewel", "premium"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z"/></svg>`,
  },
  {
    id: "rocket",
    name: "Rocket",
    defaultTint: "#ff6b6b",
    category: "Effects",
    tags: ["launch", "startup", "fast"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 2c3 2 5 5.5 5 9.5V16l2 3h-4l-1 2h-4l-1-2H5l2-3v-4.5C7 7.5 9 4 12 2zm0 6.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5z"/></svg>`,
  },
  {
    id: "flame",
    name: "Flame",
    defaultTint: "#ff7a2f",
    category: "Effects",
    tags: ["fire", "hot", "trending"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>`,
  },
  {
    id: "moon",
    name: "Moon",
    defaultTint: "#9db4ff",
    category: "Nature",
    tags: ["night", "dark", "sleep"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`,
  },
  {
    id: "sun",
    name: "Sun",
    defaultTint: "#ffb703",
    category: "Nature",
    tags: ["day", "light", "weather"],
    svgContent: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3zM4.22 5.64l1.42-1.42 2.12 2.12-1.42 1.42zM16.24 17.66l1.42-1.42 2.12 2.12-1.42 1.42zM4.22 18.36l2.12-2.12 1.42 1.42-2.12 2.12zM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12z"/></svg>`,
  },
  {
    id: "music",
    name: "Music Note",
    defaultTint: "#c77dff",
    category: "Media",
    tags: ["song", "audio", "sound"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
  },
  {
    id: "camera",
    name: "Camera",
    defaultTint: "#7aa2ff",
    category: "Media",
    tags: ["photo", "picture", "capture"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`,
  },
  {
    id: "play",
    name: "Play",
    defaultTint: "#ff4d6d",
    category: "Media",
    tags: ["video", "start", "media"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`,
  },
  {
    id: "lock",
    name: "Lock",
    defaultTint: "#8f9bff",
    category: "Security",
    tags: ["secure", "private", "password"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`,
  },
  {
    id: "pin",
    name: "Location Pin",
    defaultTint: "#ff5a5f",
    category: "Objects",
    tags: ["map", "place", "location"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  },
  {
    id: "chat",
    name: "Chat",
    defaultTint: "#4cc9f0",
    category: "Social",
    tags: ["message", "comment", "talk"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`,
  },
  {
    id: "thumbs-up",
    name: "Thumbs Up",
    defaultTint: "#3fd47a",
    category: "Social",
    tags: ["like", "approve", "good"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`,
  },
  {
    id: "check",
    name: "Check",
    defaultTint: "#34d399",
    category: "Status",
    tags: ["done", "success", "complete"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  },
  {
    id: "leaf",
    name: "Leaf",
    defaultTint: "#6bd968",
    category: "Nature",
    tags: ["eco", "plant", "green"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M20 3c-9 0-15 4-15 11 0 1.6.4 3 1.1 4.2L4 20.3l1.4 1.4 2.1-2.1C8.8 20.5 10.3 21 12 21c6.5 0 9-6 8-18z"/></svg>`,
  },
  {
    id: "coffee",
    name: "Coffee",
    defaultTint: "#c08552",
    category: "Objects",
    tags: ["cup", "break", "drink"],
    svgContent: `<svg viewBox="0 0 24 24"><path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8zM4 19h16v2H4z"/></svg>`,
  },
]

export const PRESET_ICONS: PresetIcon[] = CORE_ICONS
