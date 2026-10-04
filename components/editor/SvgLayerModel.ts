import { parseSvgShapes } from "../3d/SvgParsing"
import { createSvgLayerPreviews, type SvgLayerPreview } from "./SvgLayerPreview"

export {
  ALL_LAYERS_ID,
  completePathOverride,
  getLayerSelectionOverride,
  getLayerSelectionTargets,
  getPathOverride,
  sortPathOverrides,
  updatePathOverridesForLayers,
} from "./SvgLayerOverrideModel"

export type SvgLayer = {
  id: string
  name: string
  color: string
  preview?: SvgLayerPreview
}

const DEFAULT_LAYER_COLOR = "#ffffff"
const SVG_LAYER_CACHE_LIMIT = 80
const svgLayerCache = new Map<string, SvgLayer[]>()

export const svgLayerId = (pathIndex: number, shapeIndex: number) =>
  `${pathIndex}:${shapeIndex}`

const normalizeColor = (value: string | undefined) => {
  if (!value || value === "none" || value.startsWith("url(")) {
    return DEFAULT_LAYER_COLOR
  }
  return value.startsWith("#") ? value : DEFAULT_LAYER_COLOR
}

export const extractSvgLayers = (svgContent: string): SvgLayer[] => {
  const cacheKey = svgContent.trim()
  if (!cacheKey) return []

  const cached = svgLayerCache.get(cacheKey)
  if (cached) return cached

  const layers: SvgLayer[] = []
  let parsed: ReturnType<typeof parseSvgShapes>
  try {
    parsed = parseSvgShapes(svgContent)
  } catch {
    // The preview reports invalid geometry; keep the inspector usable.
    return []
  }

  const previews = createSvgLayerPreviews(parsed.shapesByPath)
  parsed.paths.forEach((path, pathIndex) => {
    const node = path.userData?.node as Element | undefined
    const shapeCount = parsed.shapesByPath[pathIndex].length
    const explicitName = (
      node?.getAttribute("data-name") ||
      node?.getAttribute("aria-label") ||
      node?.getAttribute("id")
    )?.trim()
    const style = path.userData?.style as { fill?: string } | undefined
    const color = normalizeColor(style?.fill)

    for (let shapeIndex = 0; shapeIndex < shapeCount; shapeIndex += 1) {
      const hasSiblingShapes = shapeCount > 1
      const name = explicitName
        ? hasSiblingShapes
          ? `${explicitName} ${shapeIndex + 1}`
          : explicitName
        : `Layer ${layers.length + 1}`

      layers.push({
        id: svgLayerId(pathIndex, shapeIndex),
        name,
        color,
        preview: previews[pathIndex][shapeIndex],
      })
    }
  })

  if (svgLayerCache.size >= SVG_LAYER_CACHE_LIMIT) {
    const oldestKey = svgLayerCache.keys().next().value
    if (oldestKey !== undefined) svgLayerCache.delete(oldestKey)
  }
  svgLayerCache.set(cacheKey, layers)
  return layers
}
