"use client"

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  clampNumber,
  DEFAULT_GEOMETRY_SETTINGS,
  DEFAULT_LIGHT_SETTINGS,
  DEFAULT_TRANSFORM_SETTINGS,
  EditorSnapshot,
  FillMode,
  GeometrySettings,
  LightSettings,
  LightPosition,
  MAX_UNDO_STEPS,
  MaterialKeyframe,
  MaterialSettings,
  ScalarKeyframe,
  TransformSettings,
  Vector3Keyframe,
} from "./EditorModel"
import {
  createProjectMetadata,
  downloadProjectSnapshot,
  type EditorProjectMetadata,
  listPersistedEditorProjects,
  MAX_PROJECT_FILE_BYTES,
  normalizeProjectName,
  parseImportedEditorDocument,
  readPersistedEditorProject,
  writePersistedEditorDocument,
} from "./EditorDocumentModel"
import {
  applySuccessfulBackup,
  chooseDeletionReplacement,
  createProjectActionError,
  createProjectFromTemplateAction,
  flushAutosaveIfAllowed,
  persistCurrentProjectDeletion,
  persistInactiveProjectDeletion,
  repairPendingProjectDeletion,
  persistProjectActivation,
  readRestoredEditorDocument,
  type ProjectActionError,
  type ProjectActivationKind,
} from "./EditorProjectActivation"
import { MOTION_RECIPES } from "./MotionRecipes"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import type {
  FillGradientType,
  FillKeyframe,
  FillStop,
  ShapeStop,
  TimelineTrack,
} from "./TimelineModel"
import { useEditorHistory } from "./useEditorHistory"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import {
  createStarterEditorSnapshot,
  createImportedEditorSnapshot,
} from "./StarterProjectModel"

interface EditorSnapshotHistoryOptions {
  activeRecipeId: string | null
  setActiveRecipeId: Dispatch<SetStateAction<string | null>>
  shapes: ShapeStop[]
  setShapes: Dispatch<SetStateAction<ShapeStop[]>>
  setSelectedShapeId: Dispatch<SetStateAction<string | null>>
  setOpenShapePicker: Dispatch<SetStateAction<string | null>>
  duration: number
  setDuration: Dispatch<SetStateAction<number>>
  setCurrentTime: Dispatch<SetStateAction<number>>
  materialPreset: MaterialPresetId
  setMaterialPreset: Dispatch<SetStateAction<MaterialPresetId>>
  materialSettings: MaterialSettings
  materialKeyframes: MaterialKeyframe[]
  setMaterialKeyframes: Dispatch<SetStateAction<MaterialKeyframe[]>>
  setMaterialBaseSettings: (settings: MaterialSettings) => void
  extrusionDepth: number
  bevelEnabled: boolean
  bevelThickness: number
  bevelSize: number
  bevelSegments: number
  geometryQuality: number
  qualityKeyframes: ScalarKeyframe[]
  setQualityKeyframes: Dispatch<SetStateAction<ScalarKeyframe[]>>
  layerSpacing: number
  innerElementScale: LightPosition
  setGeometryBaseSettings: Dispatch<SetStateAction<GeometrySettings>>
  innerScaleKeyframes: Vector3Keyframe[]
  setInnerScaleKeyframes: Dispatch<SetStateAction<Vector3Keyframe[]>>
  objectScale: number
  objectScaleAxes: LightPosition
  moveOffset: LightPosition
  setTransformBaseSettings: Dispatch<SetStateAction<TransformSettings>>
  moveKeyframes: Vector3Keyframe[]
  setMoveKeyframes: Dispatch<SetStateAction<Vector3Keyframe[]>>
  enableGradient: boolean
  fillMode: FillMode
  fillColor: string
  fillColorSecondary: string
  fillGradientType: FillGradientType
  fillStops?: FillStop[]
  fillKeyframes: FillKeyframe[]
  restoreFillState: (snapshot: EditorSnapshot) => void
  rotationOffset: LightPosition
  rotationAxisKeyframes: Vector3Keyframe[]
  setRotationAxisKeyframes: Dispatch<SetStateAction<Vector3Keyframe[]>>
  keyLightColor: string
  keyLightIntensity: number
  keyLightPosition: LightPosition
  keyLightSoftness: number
  setLightBaseSettings: Dispatch<SetStateAction<LightSettings>>
  keyLightPositionKeyframes: Vector3Keyframe[]
  setKeyLightPositionKeyframes: Dispatch<SetStateAction<Vector3Keyframe[]>>
  tracks: TimelineTrack[]
  setTracks: Dispatch<SetStateAction<TimelineTrack[]>>
  setIsPlaying: Dispatch<SetStateAction<boolean>>
  isInputDragActive: () => boolean
}

const geometrySettingsFromSnapshot = (
  snapshot: EditorSnapshot
): GeometrySettings => ({
  ...DEFAULT_GEOMETRY_SETTINGS,
  extrusionDepth: snapshot.extrusionDepth,
  bevelEnabled: snapshot.bevelEnabled,
  bevelThickness: snapshot.bevelThickness,
  bevelSize: snapshot.bevelSize,
  bevelSegments: snapshot.bevelSegments,
  geometryQuality: snapshot.geometryQuality,
  layerSpacing: snapshot.layerSpacing,
  innerElementScale: snapshot.innerElementScale,
})

const transformSettingsFromSnapshot = (
  snapshot: EditorSnapshot
): TransformSettings => ({
  ...DEFAULT_TRANSFORM_SETTINGS,
  objectScale: snapshot.objectScale,
  objectScaleAxes:
    snapshot.objectScaleAxes ?? DEFAULT_TRANSFORM_SETTINGS.objectScaleAxes,
  moveOffset: snapshot.moveOffset,
  rotationOffset: snapshot.rotationOffset,
  previewRotationOffset: null,
})

const lightSettingsFromSnapshot = (
  snapshot: EditorSnapshot
): LightSettings => ({
  ...DEFAULT_LIGHT_SETTINGS,
  keyLightColor: snapshot.keyLightColor,
  keyLightIntensity: snapshot.keyLightIntensity,
  keyLightPosition: snapshot.keyLightPosition,
  keyLightSoftness: snapshot.keyLightSoftness,
})

export function useEditorSnapshotHistory({
  activeRecipeId,
  setActiveRecipeId,
  shapes,
  setShapes,
  setSelectedShapeId,
  setOpenShapePicker,
  duration,
  setDuration,
  setCurrentTime,
  materialPreset,
  setMaterialPreset,
  materialSettings,
  materialKeyframes,
  setMaterialKeyframes,
  setMaterialBaseSettings,
  extrusionDepth,
  bevelEnabled,
  bevelThickness,
  bevelSize,
  bevelSegments,
  geometryQuality,
  qualityKeyframes,
  setQualityKeyframes,
  layerSpacing,
  innerElementScale,
  setGeometryBaseSettings,
  innerScaleKeyframes,
  setInnerScaleKeyframes,
  objectScale,
  objectScaleAxes,
  moveOffset,
  setTransformBaseSettings,
  moveKeyframes,
  setMoveKeyframes,
  enableGradient,
  fillMode,
  fillColor,
  fillColorSecondary,
  fillGradientType,
  fillStops,
  fillKeyframes,
  restoreFillState,
  rotationOffset,
  rotationAxisKeyframes,
  setRotationAxisKeyframes,
  keyLightColor,
  keyLightIntensity,
  keyLightPosition,
  keyLightSoftness,
  setLightBaseSettings,
  keyLightPositionKeyframes,
  setKeyLightPositionKeyframes,
  tracks,
  setTracks,
  setIsPlaying,
  isInputDragActive,
}: EditorSnapshotHistoryOptions) {
  const [projectStatus, setProjectStatus] = useState<
    "restoring" | "saving" | "saved" | "error"
  >("restoring")
  const [projectStatusMessage, setProjectStatusMessage] = useState(
    "Restoring your last local edit…"
  )
  const [project, setProject] = useState<EditorProjectMetadata>(() =>
    createProjectMetadata("Example project")
  )
  const [recentProjects, setRecentProjects] = useState<EditorProjectMetadata[]>(
    []
  )
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false)
  const [projectActionError, setProjectActionError] =
    useState<ProjectActionError | null>(null)
  const projectRef = useRef(project)
  projectRef.current = project
  const blockedAutosaveIdsRef = useRef<string[]>([])
  const snapshot = useMemo<EditorSnapshot>(
    () => ({
      activeRecipeId,
      shapes,
      duration,
      materialPreset,
      materialSettings,
      materialKeyframes,
      extrusionDepth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      geometryQuality,
      qualityKeyframes,
      layerSpacing,
      innerElementScale,
      innerScaleKeyframes,
      objectScale,
      objectScaleAxes,
      moveOffset,
      moveKeyframes,
      enableGradient,
      fillMode,
      fillColor,
      fillColorSecondary,
      fillGradientType,
      fillStops,
      fillKeyframes,
      rotationOffset,
      rotationAxisKeyframes,
      keyLightColor,
      keyLightIntensity,
      keyLightPosition,
      keyLightSoftness,
      keyLightPositionKeyframes,
      tracks,
    }),
    [
      activeRecipeId,
      shapes,
      duration,
      materialPreset,
      materialSettings,
      materialKeyframes,
      extrusionDepth,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      geometryQuality,
      qualityKeyframes,
      layerSpacing,
      innerElementScale,
      innerScaleKeyframes,
      objectScale,
      objectScaleAxes,
      moveOffset,
      moveKeyframes,
      enableGradient,
      fillMode,
      fillColor,
      fillColorSecondary,
      fillGradientType,
      fillStops,
      fillKeyframes,
      rotationOffset,
      rotationAxisKeyframes,
      keyLightColor,
      keyLightIntensity,
      keyLightPosition,
      keyLightSoftness,
      keyLightPositionKeyframes,
      tracks,
    ]
  )
  const initialSnapshotRef = useRef(snapshot)
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot
  const persistenceReadyRef = useRef(false)
  const skipNextPersistRef = useRef(false)
  const autosaveTimeoutRef = useRef<number | null>(null)
  const autosavePendingRef = useRef(false)

  const clearAutosaveTimeout = useCallback(() => {
    if (autosaveTimeoutRef.current === null) return
    window.clearTimeout(autosaveTimeoutRef.current)
    autosaveTimeoutRef.current = null
  }, [])

  const markSnapshotPersisted = useCallback(
    (
      persistedSnapshot: EditorSnapshot,
      persistedProject: EditorProjectMetadata
    ) => {
      clearAutosaveTimeout()
      autosavePendingRef.current = false
      snapshotRef.current = persistedSnapshot
      projectRef.current = persistedProject
    },
    [clearAutosaveTimeout]
  )

  const flushPendingAutosave = useCallback(
    (force = false) => {
      if (
        (!force && !autosavePendingRef.current) ||
        !persistenceReadyRef.current ||
        typeof window === "undefined"
      ) {
        return
      }

      clearAutosaveTimeout()
      try {
        const latestSnapshot = snapshotRef.current
        const flushed = flushAutosaveIfAllowed(
          latestSnapshot,
          projectRef.current,
          blockedAutosaveIdsRef.current
        )
        if (!flushed.wrote) return
        const persistedProject = flushed.project
        markSnapshotPersisted(latestSnapshot, persistedProject)
        setProject(persistedProject)
        setRecentProjects(listPersistedEditorProjects())
        setProjectStatus("saved")
        setProjectStatusMessage("All changes saved locally.")
      } catch (error) {
        setProjectStatus("error")
        setProjectStatusMessage(
          error instanceof Error
            ? `Autosave failed: ${error.message}`
            : "Autosave failed. Download a copy to keep a backup."
        )
      }
    },
    [clearAutosaveTimeout, markSnapshotPersisted]
  )

  const restoreSnapshot = (nextSnapshot: EditorSnapshot) => {
    setActiveRecipeId(nextSnapshot.activeRecipeId)
    setShapes(nextSnapshot.shapes)
    setSelectedShapeId((currentId) =>
      currentId && nextSnapshot.shapes.some((shape) => shape.id === currentId)
        ? currentId
        : (nextSnapshot.shapes[0]?.id ?? null)
    )
    setOpenShapePicker(null)
    setDuration(nextSnapshot.duration)
    setCurrentTime((time) => clampNumber(time, 0, nextSnapshot.duration))
    setMaterialPreset(nextSnapshot.materialPreset)
    setMaterialBaseSettings(nextSnapshot.materialSettings)
    setMaterialKeyframes(nextSnapshot.materialKeyframes)
    setGeometryBaseSettings(geometrySettingsFromSnapshot(nextSnapshot))
    setQualityKeyframes(nextSnapshot.qualityKeyframes)
    setInnerScaleKeyframes(nextSnapshot.innerScaleKeyframes)
    setTransformBaseSettings(transformSettingsFromSnapshot(nextSnapshot))
    setMoveKeyframes(nextSnapshot.moveKeyframes)
    restoreFillState(nextSnapshot)
    setRotationAxisKeyframes(nextSnapshot.rotationAxisKeyframes)
    setLightBaseSettings(lightSettingsFromSnapshot(nextSnapshot))
    setKeyLightPositionKeyframes(nextSnapshot.keyLightPositionKeyframes)
    setTracks(nextSnapshot.tracks)
    setIsPlaying(false)
  }

  const history = useEditorHistory({
    snapshot,
    canRecord: shapes.length > 0,
    maxSize: MAX_UNDO_STEPS,
    isInputDragActive,
    onRestore: restoreSnapshot,
  })

  const persistCurrentProjectNow = () => {
    const latestSnapshot = snapshotRef.current
    const persistedProject = writePersistedEditorDocument(
      latestSnapshot,
      projectRef.current
    )
    markSnapshotPersisted(latestSnapshot, persistedProject)
    setProject(persistedProject)
    setRecentProjects(listPersistedEditorProjects())
    return persistedProject
  }

  const openProjects = () => {
    const repaired = repairPendingProjectDeletion()
    if (repaired) setProjectActionError(null)
    try {
      persistCurrentProjectNow()
      setProjectStatus("saved")
      setProjectStatusMessage("All changes saved locally.")
    } catch (error) {
      setProjectStatus("error")
      setProjectStatusMessage(
        error instanceof Error
          ? `Autosave failed: ${error.message}`
          : "Autosave failed. Download a copy of this file as a backup."
      )
    }
    if (!repaired)
      setProjectActionError(
        createProjectActionError(
          "delete",
          "Deletion cleanup is still incomplete. Your open project is safe; reopen Files to retry."
        )
      )
    setRecentProjects(listPersistedEditorProjects())
    setNewProjectDialogOpen(true)
  }

  const activateProject = (
    kind: ProjectActivationKind,
    nextSnapshot: EditorSnapshot,
    nextProject: EditorProjectMetadata,
    statusMessage: string,
    preserveOutgoing = true
  ) => {
    const persisted = persistProjectActivation({
      kind,
      incomingSnapshot: nextSnapshot,
      incomingProject: nextProject,
      outgoing: {
        snapshot: snapshotRef.current,
        project: projectRef.current,
      },
      preserveOutgoing,
    })
    restoreSnapshot(persisted.snapshot)
    history.resetHistory(persisted.snapshot, true)
    markSnapshotPersisted(persisted.snapshot, persisted.project)
    setProject(persisted.project)
    setRecentProjects(listPersistedEditorProjects())
    setProjectStatus("saved")
    setProjectStatusMessage(statusMessage)
  }

  const saveProjectFile = () => {
    if (typeof window === "undefined") return
    try {
      downloadProjectSnapshot(snapshot, project)
      const next = applySuccessfulBackup({
        persistStatus: projectStatus,
        persistMessage: projectStatusMessage,
      })
      setProjectStatus(next.persistStatus)
      setProjectStatusMessage(next.persistMessage)
    } catch (error) {
      if (projectStatus === "error") return
      setProjectStatusMessage(
        error instanceof Error
          ? `Download failed: ${error.message}`
          : "Download failed. Try again."
      )
    }
  }

  const createNewProject = (
    kind: "blank" | "example",
    requestedName: string,
    starterId?: string,
    svgContent?: string
  ) => {
    const baseSnapshot = initialSnapshotRef.current
    const nextProject = createProjectMetadata(
      normalizeProjectName(
        requestedName || (kind === "example" ? "Example" : "Untitled")
      )
    )
    try {
      const nextSnapshot: EditorSnapshot = svgContent
        ? createImportedEditorSnapshot(baseSnapshot, svgContent)
        : starterId
          ? createStarterEditorSnapshot(baseSnapshot, starterId)
          : kind === "example"
            ? baseSnapshot
            : createBlankEditorSnapshot(baseSnapshot)
      activateProject(
        "create",
        nextSnapshot,
        nextProject,
        `${nextProject.name} created and saved locally.`
      )
      setProjectActionError(null)
      setNewProjectDialogOpen(false)
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? `Could not create the project: ${error.message}`
          : "Could not create the project."
      setProjectActionError(createProjectActionError("create", message))
      return false
    }
  }

  const createProjectFromTemplate = (templateId: string, name: string) => {
    const recipe = MOTION_RECIPES.find(
      (candidate) => candidate.id === templateId
    )
    if (!recipe) {
      setProjectActionError(
        createProjectActionError(
          "create",
          "That style template is unavailable."
        )
      )
      return false
    }
    const result = createProjectFromTemplateAction({
      baseSnapshot: initialSnapshotRef.current,
      recipe,
      name,
      outgoing: {
        snapshot: snapshotRef.current,
        project: projectRef.current,
      },
      undoStack: [snapshotRef.current],
    })
    if (!result.ok || !result.persisted) {
      setProjectActionError(result.actionError)
      return false
    }
    restoreSnapshot(result.persisted.snapshot)
    history.resetHistory(result.persisted.snapshot, true)
    markSnapshotPersisted(result.persisted.snapshot, result.persisted.project)
    setProject(result.persisted.project)
    setRecentProjects(listPersistedEditorProjects())
    setProjectStatus("saved")
    setProjectStatusMessage(
      `${result.persisted.project.name} created and saved locally.`
    )
    setProjectActionError(null)
    setNewProjectDialogOpen(false)
    return true
  }

  const renameProject = (name: string) => {
    const normalizedName = normalizeProjectName(name)
    if (normalizedName === project.name) return
    try {
      const nextProject = writePersistedEditorDocument(snapshot, {
        ...project,
        name: normalizedName,
      })
      markSnapshotPersisted(snapshot, nextProject)
      setProject(nextProject)
      setRecentProjects(listPersistedEditorProjects())
      setProjectStatus("saved")
      setProjectStatusMessage(`Renamed to ${normalizedName}.`)
    } catch (error) {
      setProjectStatus("error")
      setProjectStatusMessage(
        error instanceof Error ? error.message : "Could not rename the project."
      )
    }
  }

  const openRecentProject = (projectId: string) => {
    if (projectId === project.id) {
      setNewProjectDialogOpen(false)
      setProjectStatusMessage(`${project.name} is already open.`)
      return
    }
    const documentFile = readPersistedEditorProject(projectId)
    if (!documentFile) {
      setProjectStatus("error")
      setProjectStatusMessage(
        "That file is no longer available in this browser."
      )
      setRecentProjects(listPersistedEditorProjects())
      return
    }
    try {
      activateProject(
        "switch",
        documentFile.snapshot,
        documentFile.project,
        `${documentFile.project.name} opened.`
      )
      setNewProjectDialogOpen(false)
    } catch (error) {
      setProjectStatus("error")
      setProjectStatusMessage(
        error instanceof Error
          ? `Could not open the project: ${error.message}`
          : "Could not open the project."
      )
    }
  }

  const duplicateRecentProject = (projectId: string) => {
    const documentFile =
      projectId === project.id
        ? { project, snapshot }
        : readPersistedEditorProject(projectId)
    if (!documentFile) {
      setProjectStatus("error")
      setProjectStatusMessage("That file is no longer available to duplicate.")
      setRecentProjects(listPersistedEditorProjects())
      return
    }
    const duplicatedProject = createProjectMetadata(
      `${documentFile.project.name} copy`
    )
    try {
      activateProject(
        "duplicate",
        documentFile.snapshot,
        duplicatedProject,
        `${duplicatedProject.name} created and opened.`
      )
      setProjectActionError(null)
      setNewProjectDialogOpen(false)
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? `Could not duplicate the project: ${error.message}`
          : "Could not duplicate the project."
      setProjectActionError(createProjectActionError("duplicate", message))
      return false
    }
  }

  const deleteRecentProject = (projectId: string) => {
    const deleting = recentProjects.find(
      (candidate) => candidate.id === projectId
    )
    if (!deleting) return false

    try {
      const deletingCurrentProject = project.id === projectId
      if (!deletingCurrentProject) {
        const deletion = persistInactiveProjectDeletion(projectId)
        setRecentProjects(deletion.projects)
        if (!deletion.cleanupComplete) {
          const message =
            "Your open file is safe. Deletion cleanup is incomplete; reopen Files or reload to retry."
          setProjectStatusMessage(message)
          setProjectActionError(createProjectActionError("delete", message))
          return false
        }
        setProjectStatus("saved")
        setProjectStatusMessage(`${deleting.name} deleted from this device.`)
        setProjectActionError(null)
        return true
      }

      const replacement = chooseDeletionReplacement({
        deletingId: projectId,
        createBlank: () => ({
          snapshot: createBlankEditorSnapshot(initialSnapshotRef.current),
          project: createProjectMetadata(),
        }),
      })
      const openedExisting = recentProjects.some(
        (candidate) => candidate.id === replacement.project.id
      )
      const deleted = persistCurrentProjectDeletion({
        deleting,
        replacement,
      })
      blockedAutosaveIdsRef.current = [
        ...blockedAutosaveIdsRef.current,
        ...deleted.blockedAutosaveIds,
      ]
      restoreSnapshot(deleted.snapshot)
      history.resetHistory(deleted.snapshot, true)
      markSnapshotPersisted(deleted.snapshot, deleted.project)
      setProject(deleted.project)
      setRecentProjects(listPersistedEditorProjects())
      const cleanupMessage = `${deleted.project.name} opened safely. Deletion cleanup is incomplete; reopen Files or reload to retry.`
      setProjectStatus("saved")
      setProjectStatusMessage(
        !deleted.cleanupComplete
          ? cleanupMessage
          : openedExisting
            ? `${deleting.name} deleted. ${deleted.project.name} opened.`
            : `${deleting.name} deleted. A new blank project is ready.`
      )
      setProjectActionError(
        deleted.cleanupComplete
          ? null
          : createProjectActionError("delete", cleanupMessage)
      )
      return deleted.cleanupComplete
    } catch (error) {
      const message =
        error instanceof Error
          ? `Could not delete the project: ${error.message}`
          : "Could not delete the project."
      setProjectActionError(createProjectActionError("delete", message))
      return false
    }
  }

  const openProjectFile = () => {
    if (typeof window === "undefined") return

    try {
      persistCurrentProjectNow()
    } catch (error) {
      setProjectStatus("error")
      setProjectStatusMessage(
        error instanceof Error
          ? `Could not secure the current project: ${error.message}`
          : "Could not secure the current project. Download it before opening another file."
      )
      return
    }

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json,.json"
    input.className = "hidden"
    input.onchange = () => {
      const file = input.files?.[0]
      input.remove()
      if (!file) return
      if (file.size > MAX_PROJECT_FILE_BYTES) {
        setProjectStatus("error")
        setProjectStatusMessage("That file is larger than the 5 MB limit.")
        return
      }

      void file
        .text()
        .then((text) => {
          const nextDocument = parseImportedEditorDocument(JSON.parse(text))
          if (!nextDocument) {
            throw new Error("Invalid Glyphrise project file.")
          }
          activateProject(
            "import",
            nextDocument.snapshot,
            nextDocument.project,
            `${nextDocument.project.name} imported and saved locally.`
          )
        })
        .catch((error) => {
          console.error("Could not open project file:", error)
          setProjectStatus("error")
          setProjectStatusMessage(
            error instanceof Error ? error.message : "Could not open that file."
          )
        })
    }
    document.body.appendChild(input)
    input.click()
  }

  const finalizeProjectBaseline = () => {
    window.requestAnimationFrame(() => {
      const finalSnapshot = snapshotRef.current
      history.resetHistory(finalSnapshot)
      const persistedProject = writePersistedEditorDocument(
        finalSnapshot,
        projectRef.current
      )
      markSnapshotPersisted(finalSnapshot, persistedProject)
      setProject(persistedProject)
      setRecentProjects(listPersistedEditorProjects())
    })
  }

  const canRecord = shapes.length > 0

  useEffect(() => {
    if (typeof window === "undefined") return
    const restored = readRestoredEditorDocument()
    const persistedDocument = restored.document
    if (!restored.cleanupComplete)
      setProjectActionError(
        createProjectActionError(
          "delete",
          "Your file was restored safely. Deletion cleanup is incomplete; reopen Files to retry."
        )
      )
    if (persistedDocument) {
      skipNextPersistRef.current = true
      restoreSnapshot(persistedDocument.snapshot)
      history.resetHistory(persistedDocument.snapshot, true)
      snapshotRef.current = persistedDocument.snapshot
      projectRef.current = persistedDocument.project
      setProject(persistedDocument.project)
    }
    setRecentProjects(listPersistedEditorProjects())
    persistenceReadyRef.current = true
    setProjectStatus("saved")
    setProjectStatusMessage(
      persistedDocument
        ? "Last local edit restored."
        : "Changes autosave locally on this device."
    )
    // Restore should run once during editor boot. State setters are stable here,
    // and repeated restores would overwrite the user's current document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handlePageHide = () => flushPendingAutosave(true)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushPendingAutosave(true)
    }

    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [flushPendingAutosave])

  useEffect(() => {
    if (typeof window === "undefined" || !persistenceReadyRef.current) {
      return
    }

    if (!canRecord) {
      clearAutosaveTimeout()
      autosavePendingRef.current = false
      return
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    setProjectStatus("saving")
    setProjectStatusMessage("Saving changes locally…")
    autosavePendingRef.current = true
    clearAutosaveTimeout()
    autosaveTimeoutRef.current = window.setTimeout(() => {
      autosaveTimeoutRef.current = null
      flushPendingAutosave()
    }, 350)

    return clearAutosaveTimeout
  }, [canRecord, clearAutosaveTimeout, flushPendingAutosave, snapshot])

  return {
    ...history,
    snapshot,
    newProject: openProjects,
    createNewProject,
    createProjectFromTemplate,
    finalizeProjectBaseline,
    newProjectDialogOpen,
    setNewProjectDialogOpen,
    projectActionError,
    openRecentProject,
    duplicateRecentProject,
    deleteRecentProject,
    recentProjects,
    openProjectFile,
    saveProjectFile,
    project,
    renameProject,
    projectStatus,
    projectStatusMessage,
  }
}
