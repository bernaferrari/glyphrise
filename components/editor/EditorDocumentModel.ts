import {
  MAX_TIMELINE_DURATION,
  MIN_TIMELINE_DURATION,
  createEditorId,
  type EditorSnapshot,
} from "./EditorModel"
import { validateAndSanitizeSvg } from "./SvgImportModel"
import { isMaterialPresetId } from "../3d/MaterialPresets"

export const EDITOR_CURRENT_PROJECT_KEY = "glyphrise.editor.current-project.v2"
export const EDITOR_RECENT_PROJECTS_KEY = "glyphrise.editor.recent-projects.v2"
export const EDITOR_PROJECT_KEY_PREFIX = "glyphrise.editor.project.v2."
export const MAX_PROJECT_FILE_BYTES = 5_000_000

export type EditorProjectMetadata = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type EditorDocumentFile = {
  version: 2
  savedAt: string
  project: EditorProjectMetadata
  snapshot: EditorSnapshot
}

export type ParsedEditorDocument = {
  project: EditorProjectMetadata
  snapshot: EditorSnapshot
}

export const isObjectRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const MAX_COLLECTION_SIZE = 2_000
const MAX_SHAPE_COUNT = 100
const MAX_STRING_LENGTH = 256
const EASING_TYPES = new Set([
  "linear",
  "ease-in-out",
  "flow",
  "spring",
  "bounce",
])
const TRANSITION_TYPES = new Set(["cut", "fade", "wipe"])
const GRADIENT_TYPES = new Set(["linear", "radial", "conic", "mesh"])

const isFiniteEditorNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e6

const isShortString = (value: unknown): value is string =>
  typeof value === "string" && value.length <= MAX_STRING_LENGTH

const isProjectMetadata = (value: unknown): value is EditorProjectMetadata =>
  isObjectRecord(value) &&
  isShortString(value.id) &&
  value.id.length > 0 &&
  isShortString(value.name) &&
  value.name.trim().length > 0 &&
  isShortString(value.createdAt) &&
  isShortString(value.updatedAt)

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
  isFiniteEditorNumber(value.position) &&
  (value.x === undefined || isFiniteEditorNumber(value.x)) &&
  (value.y === undefined || isFiniteEditorNumber(value.y))

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
      typeof value.transitionType === "string" &&
      TRANSITION_TYPES.has(value.transitionType)
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
    value.duration >= MIN_TIMELINE_DURATION &&
    value.duration <= MAX_TIMELINE_DURATION &&
    isBoundedArray(value.shapes, MAX_SHAPE_COUNT) &&
    value.shapes.length > 0 &&
    value.shapes.every(isShapeStop) &&
    typeof value.materialPreset === "string" &&
    isMaterialPresetId(value.materialPreset) &&
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
    isVec3(value.objectScaleAxes) &&
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
  shapes: snapshot.shapes.map((shape) => ({
    ...shape,
    svgContent: validateAndSanitizeSvg(shape.svgContent),
  })),
})

export const normalizeProjectName = (value: string) =>
  value.replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled"

const IMPORTED_PROJECT_NAME_SUFFIX = " (imported copy)"

const importedProjectCopyName = (value: string) => {
  const normalizedName = normalizeProjectName(value)
  const availableBaseLength = 80 - IMPORTED_PROJECT_NAME_SUFFIX.length
  const baseName = normalizedName.slice(0, availableBaseLength).trimEnd()
  return `${baseName}${IMPORTED_PROJECT_NAME_SUFFIX}`
}

export const createProjectMetadata = (
  name = "Untitled",
  now = new Date().toISOString()
): EditorProjectMetadata => ({
  id: createEditorId("project"),
  name: normalizeProjectName(name),
  createdAt: now,
  updatedAt: now,
})

export const parseEditorDocument = (
  value: unknown
): ParsedEditorDocument | null => {
  if (!isObjectRecord(value) || value.version !== 2) return null
  if (!isProjectMetadata(value.project)) return null
  return isPersistedEditorSnapshot(value.snapshot)
    ? {
        project: {
          ...value.project,
          name: normalizeProjectName(value.project.name),
        },
        snapshot: normalizeEditorSnapshot(value.snapshot),
      }
    : null
}

// External files become a new local project; stored documents still retain
// their original identity through parseEditorDocument.
export const parseImportedEditorDocument = (
  value: unknown
): ParsedEditorDocument | null => {
  const document = parseEditorDocument(value)
  if (!document) return null

  return {
    project: createProjectMetadata(
      importedProjectCopyName(document.project.name)
    ),
    snapshot: document.snapshot,
  }
}

export const parseEditorDocumentSnapshot = (value: unknown) =>
  parseEditorDocument(value)?.snapshot ?? null

const parseStoredDocument = (raw: string | null) => {
  if (!raw) return null
  if (new TextEncoder().encode(raw).length > MAX_PROJECT_FILE_BYTES) return null
  return parseEditorDocument(JSON.parse(raw))
}

export type EditorProjectStore = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>

const defaultProjectStore = (): EditorProjectStore => window.localStorage

export const editorProjectStorageKey = (projectId: string) =>
  `${EDITOR_PROJECT_KEY_PREFIX}${projectId}`

const projectStorageKey = editorProjectStorageKey

export const readCurrentEditorProjectId = (
  store: EditorProjectStore = defaultProjectStore()
) => store.getItem(EDITOR_CURRENT_PROJECT_KEY)

export const listPersistedEditorProjects = (
  store: EditorProjectStore = defaultProjectStore()
): EditorProjectMetadata[] => {
  try {
    const raw = store.getItem(EDITOR_RECENT_PROJECTS_KEY)
    if (!raw) return []
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value)) return []
    return value
      .filter(isProjectMetadata)
      .filter((project) => store.getItem(projectStorageKey(project.id)))
  } catch {
    return []
  }
}

export const writeEditorProjectDocument = (
  snapshot: EditorSnapshot,
  project: EditorProjectMetadata,
  store: EditorProjectStore = defaultProjectStore()
) => {
  const documentFile = createEditorDocumentFile(snapshot, project)
  store.setItem(projectStorageKey(project.id), JSON.stringify(documentFile))
  return documentFile
}

export const writeEditorProjectIndex = (
  project: EditorProjectMetadata,
  store: EditorProjectStore = defaultProjectStore()
) => {
  const next = [
    project,
    ...listPersistedEditorProjects(store).filter(
      (item) => item.id !== project.id
    ),
  ]
  store.setItem(EDITOR_RECENT_PROJECTS_KEY, JSON.stringify(next))
  return next
}

export const writeCurrentEditorProjectId = (
  projectId: string,
  store: EditorProjectStore = defaultProjectStore()
) => {
  store.setItem(EDITOR_CURRENT_PROJECT_KEY, projectId)
}

export const readPersistedEditorProject = (
  projectId: string,
  store: EditorProjectStore = defaultProjectStore()
) => {
  try {
    return parseStoredDocument(store.getItem(projectStorageKey(projectId)))
  } catch {
    return null
  }
}

export const deletePersistedEditorProject = (
  projectId: string,
  store: EditorProjectStore = defaultProjectStore()
) => {
  store.removeItem(projectStorageKey(projectId))
  const nextRecent = listPersistedEditorProjects(store).filter(
    (project) => project.id !== projectId
  )
  if (nextRecent.length > 0) {
    store.setItem(EDITOR_RECENT_PROJECTS_KEY, JSON.stringify(nextRecent))
  } else {
    store.removeItem(EDITOR_RECENT_PROJECTS_KEY)
  }
  if (store.getItem(EDITOR_CURRENT_PROJECT_KEY) === projectId) {
    store.removeItem(EDITOR_CURRENT_PROJECT_KEY)
  }
  return nextRecent
}

export const readPersistedEditorDocument = (
  store: EditorProjectStore = defaultProjectStore()
): ParsedEditorDocument | null => {
  try {
    const projectId = store.getItem(EDITOR_CURRENT_PROJECT_KEY)
    if (projectId) {
      const current = readPersistedEditorProject(projectId, store)
      if (current) return current
    }
  } catch {
    return null
  }
  return null
}

export const readPersistedEditorSnapshot = (
  store: EditorProjectStore = defaultProjectStore()
) => readPersistedEditorDocument(store)?.snapshot ?? null

export const createEditorDocumentFile = (
  snapshot: EditorSnapshot,
  project: EditorProjectMetadata
): EditorDocumentFile => {
  const savedAt = new Date().toISOString()
  return {
    version: 2,
    savedAt,
    project: {
      ...project,
      name: normalizeProjectName(project.name),
      updatedAt: savedAt,
    },
    snapshot: normalizeEditorSnapshot(snapshot),
  }
}

export const writePersistedEditorDocument = (
  snapshot: EditorSnapshot,
  project: EditorProjectMetadata,
  store: EditorProjectStore = defaultProjectStore()
) => {
  const documentFile = writeEditorProjectDocument(snapshot, project, store)
  writeEditorProjectIndex(documentFile.project, store)
  writeCurrentEditorProjectId(project.id, store)
  return documentFile.project
}

export const writePersistedEditorSnapshot = (
  snapshot: EditorSnapshot,
  store: EditorProjectStore = defaultProjectStore()
) => {
  const current = readPersistedEditorDocument(store)
  return writePersistedEditorDocument(
    snapshot,
    current?.project ?? createProjectMetadata(),
    store
  )
}

const projectFilename = (project: EditorProjectMetadata, savedAt: string) => {
  const slug = normalizeProjectName(project.name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
  return `${slug || "glyphrise-project"}-${savedAt.slice(0, 10)}.json`
}

export const downloadProjectSnapshot = (
  snapshot: EditorSnapshot,
  project: EditorProjectMetadata
) => {
  const documentFile = createEditorDocumentFile(snapshot, project)
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(documentFile, null, 2)], {
      type: "application/json",
    })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = projectFilename(documentFile.project, documentFile.savedAt)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
