import type { CSSProperties } from "react"
import { appendGlyphriseSlash, normalizeSvgToIconViewBox } from "../3d/SvgText"
import materialSymbolNames from "./MaterialSymbolNames.generated.json"
import materialSymbolAliases from "./MaterialSymbolAliases.generated.json"
import presetIcons from "./PresetIcons.generated.json"
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

/** Off partners keep the catalog identity and the same base geometry. */
export const appendMaterialSymbolSlash = (base: PresetIcon): PresetIcon => ({
  ...base,
  id: `${base.id}_off-slash`,
  name: `${base.name} Off`,
  tags: [...(base.tags ?? []), "slash"],
  svgContent: validateAndSanitizeSvg(appendGlyphriseSlash(base.svgContent)),
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
    const icon = appendMaterialSymbolSlash(
      await fetchMaterialSymbolIcon(baseName, style, { useRealOffPath: true })
    )
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

/** Generated from Google's Material Symbols using the same normalization as imports. */
export const PRESET_ICONS: PresetIcon[] = presetIcons

for (const icon of PRESET_ICONS) {
  const symbol = icon.id.replace("material-symbol-outlined-", "")
  materialSymbolCache.set(`outlined:${symbol}:real`, icon)
}
