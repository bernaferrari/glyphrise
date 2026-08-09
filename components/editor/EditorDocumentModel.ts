import type { EditorSnapshot } from "./EditorModel"
import { shapeTransitionType } from "./TimelineModel"
import { validateAndSanitizeSvg } from "./SvgImportModel"

export const EDITOR_AUTOSAVE_KEY = "vectorforge.editor.autosave.v1"
export const MAX_PROJECT_FILE_BYTES = 5_000_000

export type EditorDocumentFile = {
  version: 1
  savedAt: string
  snapshot: EditorSnapshot
}

export const isObjectRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const MAX_COLLECTION_SIZE = 2_000
const MAX_SHAPE_COUNT = 100
const MAX_STRING_LENGTH = 256
const EASING_TYPES = new Set(["linear", "ease-in-out", "spring", "bounce"])
const TRANSITION_TYPES = new Set(["cut", "fade", "wipe", "none"])
const GRADIENT_TYPES = new Set(["linear", "radial", "conic", "mesh"])
const MATERIAL_PRESETS = new Set([
  "frost",
  "satin",
  "glass",
  "aura",
  "chrome",
  "pearl",
  "lacquer",
  "neon",
  "holo",
  "ink",
  "prismChrome",
  "gelGlass",
  "cutInk",
  "cutInner",
  "cutOuter",
  "softCut",
  "custom",
])

const isFiniteEditorNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e6

const isShortString = (value: unknown): value is string =>
  typeof value === "string" && value.length <= MAX_STRING_LENGTH

const isBoundedArray = (
  value: unknown,
  limit = MAX_COLLECTION_SIZE
): value is unknown[] => Array.isArray(value) && value.length <= limit

const isVec3 = (value: unknown) =>
  isObjectRecord(value) &&
  isFiniteEditorNumber(value.x) &&
  isFiniteEditorNumber(value.y) &&
  isFiniteEditorNumber(value.z)

const isVec2 = (value: unknown) =>
  isObjectRecord(value) &&
  isFiniteEditorNumber(value.x) &&
  isFiniteEditorNumber(value.y)

const isEasing = (value: unknown) =>
  typeof value === "string" && EASING_TYPES.has(value)

const isGradientType = (value: unknown) =>
  typeof value === "string" && GRADIENT_TYPES.has(value)

const isFillStop = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isShortString(value.color) &&
  isFiniteEditorNumber(value.position)

const isFillKeyframe = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isFiniteEditorNumber(value.time) &&
  isEasing(value.easing) &&
  (value.gradientType === undefined || isGradientType(value.gradientType)) &&
  isBoundedArray(value.stops, 32) &&
  value.stops.every(isFillStop)

const isScalarKeyframe = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isFiniteEditorNumber(value.time) &&
  isFiniteEditorNumber(value.value) &&
  isEasing(value.easing)

const isVectorKeyframe = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isFiniteEditorNumber(value.time) &&
  isVec3(value.value) &&
  isEasing(value.easing)

const isMaterialSettings = (value: unknown) =>
  isObjectRecord(value) &&
  [
    value.roughness,
    value.metalness,
    value.reflectance,
    value.clearcoat,
    value.clearcoatRoughness,
    value.transmission,
    value.thickness,
    value.emissiveIntensity,
  ].every(isFiniteEditorNumber)

const isMaterialKeyframe = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isFiniteEditorNumber(value.time) &&
  isMaterialSettings(value.value) &&
  isEasing(value.easing)

const isPathOverride = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  typeof value.visible === "boolean" &&
  isShortString(value.color) &&
  isFiniteEditorNumber(value.depthMultiplier) &&
  (value.scale === undefined || isVec3(value.scale))

const isShapeStop = (value: unknown) => {
  if (
    !isObjectRecord(value) ||
    !isShortString(value.id) ||
    !isFiniteEditorNumber(value.time) ||
    !isShortString(value.iconId) ||
    !(value.iconName === undefined || isShortString(value.iconName)) ||
    typeof value.svgContent !== "string" ||
    !isShortString(value.color) ||
    !isShortString(value.colorSecondary) ||
    !isEasing(value.easing) ||
    !(
      value.transitionType === undefined ||
      (typeof value.transitionType === "string" &&
        TRANSITION_TYPES.has(value.transitionType))
    ) ||
    !isVec2(value.wipeDirection) ||
    !(
      value.transitionStart === undefined ||
      isFiniteEditorNumber(value.transitionStart)
    ) ||
    !(
      value.transitionEnd === undefined ||
      isFiniteEditorNumber(value.transitionEnd)
    )
  ) {
    return false
  }

  try {
    validateAndSanitizeSvg(value.svgContent)
  } catch {
    return false
  }

  return (
    (value.fillGradientType === undefined ||
      isGradientType(value.fillGradientType)) &&
    (value.fillStops === undefined ||
      (isBoundedArray(value.fillStops, 32) &&
        value.fillStops.every(isFillStop))) &&
    (value.fillKeyframes === undefined ||
      (isBoundedArray(value.fillKeyframes, 500) &&
        value.fillKeyframes.every(isFillKeyframe))) &&
    (value.pathOverrides === undefined ||
      (isBoundedArray(value.pathOverrides, MAX_COLLECTION_SIZE) &&
        value.pathOverrides.every(isPathOverride)))
  )
}

const isTimelineTrack = (value: unknown) =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  isShortString(value.name) &&
  isShortString(value.color) &&
  isFiniteEditorNumber(value.min) &&
  isFiniteEditorNumber(value.max) &&
  isFiniteEditorNumber(value.defaultValue) &&
  isBoundedArray(value.keyframes, 500) &&
  value.keyframes.every(isScalarKeyframe)

export const isPersistedEditorSnapshot = (
  value: unknown
): value is EditorSnapshot => {
  if (!isObjectRecord(value)) return false
  return (
    (value.activeRecipeId === null || isShortString(value.activeRecipeId)) &&
    isFiniteEditorNumber(value.duration) &&
    value.duration > 0 &&
    value.duration <= 3_600 &&
    isBoundedArray(value.shapes, MAX_SHAPE_COUNT) &&
    value.shapes.length > 0 &&
    value.shapes.every(isShapeStop) &&
    typeof value.materialPreset === "string" &&
    MATERIAL_PRESETS.has(value.materialPreset) &&
    isMaterialSettings(value.materialSettings) &&
    isBoundedArray(value.materialKeyframes, 500) &&
    value.materialKeyframes.every(isMaterialKeyframe) &&
    isFiniteEditorNumber(value.extrusionDepth) &&
    typeof value.bevelEnabled === "boolean" &&
    isFiniteEditorNumber(value.bevelThickness) &&
    isFiniteEditorNumber(value.bevelSize) &&
    isFiniteEditorNumber(value.bevelSegments) &&
    isFiniteEditorNumber(value.geometryQuality) &&
    isBoundedArray(value.qualityKeyframes, 500) &&
    value.qualityKeyframes.every(isScalarKeyframe) &&
    isFiniteEditorNumber(value.layerSpacing) &&
    isVec3(value.innerElementScale) &&
    isBoundedArray(value.innerScaleKeyframes, 500) &&
    value.innerScaleKeyframes.every(isVectorKeyframe) &&
    isFiniteEditorNumber(value.objectScale) &&
    (value.objectScaleAxes === undefined || isVec3(value.objectScaleAxes)) &&
    isVec3(value.moveOffset) &&
    isBoundedArray(value.moveKeyframes, 500) &&
    value.moveKeyframes.every(isVectorKeyframe) &&
    typeof value.enableGradient === "boolean" &&
    (value.fillMode === "solid" || value.fillMode === "gradient") &&
    isShortString(value.fillColor) &&
    isShortString(value.fillColorSecondary) &&
    isGradientType(value.fillGradientType) &&
    (value.fillStops === undefined ||
      (isBoundedArray(value.fillStops, 32) &&
        value.fillStops.every(isFillStop))) &&
    isBoundedArray(value.fillKeyframes, 500) &&
    value.fillKeyframes.every(isFillKeyframe) &&
    isVec3(value.rotationOffset) &&
    isBoundedArray(value.rotationAxisKeyframes, 500) &&
    value.rotationAxisKeyframes.every(isVectorKeyframe) &&
    isShortString(value.keyLightColor) &&
    isFiniteEditorNumber(value.keyLightIntensity) &&
    isVec3(value.keyLightPosition) &&
    isFiniteEditorNumber(value.keyLightSoftness) &&
    isBoundedArray(value.keyLightPositionKeyframes, 500) &&
    value.keyLightPositionKeyframes.every(isVectorKeyframe) &&
    isBoundedArray(value.tracks, 32) &&
    value.tracks.every(isTimelineTrack)
  )
}

export const normalizeEditorSnapshot = (
  snapshot: EditorSnapshot
): EditorSnapshot => ({
  ...snapshot,
  objectScaleAxes: snapshot.objectScaleAxes ?? { x: 1, y: 1, z: 1 },
  shapes: snapshot.shapes.map((shape) => ({
    ...shape,
    svgContent: validateAndSanitizeSvg(shape.svgContent),
    transitionType: shapeTransitionType(shape),
  })),
})

export const parseEditorDocumentSnapshot = (value: unknown) => {
  if (isObjectRecord(value) && "version" in value && value.version !== 1) {
    return null
  }
  const snapshot =
    isObjectRecord(value) && "snapshot" in value ? value.snapshot : value
  return isPersistedEditorSnapshot(snapshot)
    ? normalizeEditorSnapshot(snapshot)
    : null
}

export const readPersistedEditorSnapshot = () => {
  try {
    const raw = window.localStorage.getItem(EDITOR_AUTOSAVE_KEY)
    if (!raw) return null
    if (new TextEncoder().encode(raw).length > MAX_PROJECT_FILE_BYTES)
      return null
    return parseEditorDocumentSnapshot(JSON.parse(raw))
  } catch {
    return null
  }
}

export const writePersistedEditorSnapshot = (snapshot: EditorSnapshot) => {
  window.localStorage.setItem(
    EDITOR_AUTOSAVE_KEY,
    JSON.stringify(createEditorDocumentFile(snapshot))
  )
}

export const createEditorDocumentFile = (
  snapshot: EditorSnapshot
): EditorDocumentFile => ({
  version: 1,
  savedAt: new Date().toISOString(),
  snapshot: normalizeEditorSnapshot(snapshot),
})

export const downloadProjectSnapshot = (snapshot: EditorSnapshot) => {
  const documentFile = createEditorDocumentFile(snapshot)
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(documentFile, null, 2)], {
      type: "application/json",
    })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = `vectorforge-project-${documentFile.savedAt.slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
