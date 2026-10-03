import type { EditorSnapshot } from "./EditorModel"
import {
  createProjectMetadata,
  editorProjectStorageKey,
  EDITOR_RECENT_PROJECTS_KEY,
  listPersistedEditorProjects,
  normalizeProjectName,
  readCurrentEditorProjectId,
  readPersistedEditorDocument,
  readPersistedEditorProject,
  type EditorProjectMetadata,
  type EditorProjectStore,
  writeCurrentEditorProjectId,
  writeEditorProjectDocument,
  writeEditorProjectIndex,
  writePersistedEditorDocument,
} from "./EditorDocumentModel"
import { createBlankEditorSnapshot } from "./EditorProjectModel"
import type { MotionRecipe } from "./MotionRecipes"
import { createEditorSnapshotFromRecipe } from "./RecipeModel"

export type ProjectActivationKind = "create" | "switch" | "duplicate" | "import"

export type ProjectActivationRequest = {
  kind: ProjectActivationKind
  incomingSnapshot: EditorSnapshot
  incomingProject: EditorProjectMetadata
  outgoing: {
    snapshot: EditorSnapshot
    project: EditorProjectMetadata
  }
  preserveOutgoing?: boolean
  store?: EditorProjectStore
}

export type ProjectActivationResult = {
  kind: ProjectActivationKind
  snapshot: EditorSnapshot
  project: EditorProjectMetadata
}

export type ProjectPersistStatus = "restoring" | "saving" | "saved" | "error"

export type ProjectActionKind = "create" | "duplicate" | "delete"

export type ProjectActionError = {
  surface: "projects-dialog"
  action: ProjectActionKind
  message: string
}

const defaultStore = (): EditorProjectStore => window.localStorage

const persistOutgoingDocument = (
  outgoing: ProjectActivationRequest["outgoing"],
  incomingProjectId: string,
  store: EditorProjectStore
) => {
  if (outgoing.project.id === incomingProjectId) return
  writeEditorProjectDocument(outgoing.snapshot, outgoing.project, store)
}

const isProjectListed = (projectId: string, store: EditorProjectStore) =>
  listPersistedEditorProjects(store).some((project) => project.id === projectId)

const discardUnlistedProject = (
  projectId: string,
  store: EditorProjectStore
) => {
  if (isProjectListed(projectId, store)) return
  store.removeItem(editorProjectStorageKey(projectId))
}

/**
 * Persist the incoming project and switch the stored current identity to it.
 * Writes happen in this order:
 * 1. outgoing document (identity unchanged)
 * 2. incoming document (identity unchanged)
 * 3. recent-project index (identity unchanged)
 * 4. current-project id last
 *
 * The caller must apply the returned snapshot/identity only after this
 * function returns. A thrown write leaves the previous identity in place.
 * An incoming document written before a failed index update is removed so
 * it does not remain as a silent orphan.
 */
export const persistProjectActivation = (
  request: ProjectActivationRequest
): ProjectActivationResult => {
  const store = request.store ?? defaultStore()
  const preserveOutgoing = request.preserveOutgoing !== false
  const incomingId = request.incomingProject.id

  if (preserveOutgoing) {
    persistOutgoingDocument(request.outgoing, incomingId, store)
  }

  let incomingWritten = false
  try {
    const incomingDocument = writeEditorProjectDocument(
      request.incomingSnapshot,
      request.incomingProject,
      store
    )
    incomingWritten = true
    writeEditorProjectIndex(incomingDocument.project, store)
    writeCurrentEditorProjectId(incomingDocument.project.id, store)

    return {
      kind: request.kind,
      snapshot: incomingDocument.snapshot,
      project: incomingDocument.project,
    }
  } catch (error) {
    if (incomingWritten && incomingId !== request.outgoing.project.id) {
      discardUnlistedProject(incomingId, store)
    }
    throw error
  }
}

export const persistProjectFromTemplate = ({
  baseSnapshot,
  recipe,
  name,
  outgoing,
  store,
}: {
  baseSnapshot: EditorSnapshot
  recipe: MotionRecipe
  name: string
  outgoing: ProjectActivationRequest["outgoing"]
  store?: EditorProjectStore
}): ProjectActivationResult => {
  const blank = createBlankEditorSnapshot(baseSnapshot)
  return persistProjectActivation({
    kind: "create",
    incomingSnapshot: createEditorSnapshotFromRecipe(blank, recipe),
    incomingProject: createProjectMetadata(
      normalizeProjectName(name || recipe.name)
    ),
    outgoing,
    store,
  })
}

export const createProjectFromTemplateAction = ({
  baseSnapshot,
  recipe,
  name,
  outgoing,
  undoStack,
  store,
}: {
  baseSnapshot: EditorSnapshot
  recipe: MotionRecipe
  name: string
  outgoing: ProjectActivationRequest["outgoing"]
  undoStack: EditorSnapshot[]
  store?: EditorProjectStore
}): {
  ok: boolean
  undoStack: EditorSnapshot[]
  snapshot: EditorSnapshot
  project: EditorProjectMetadata
  actionError: ProjectActionError | null
  persisted?: ProjectActivationResult
} => {
  try {
    const persisted = persistProjectFromTemplate({
      baseSnapshot,
      recipe,
      name,
      outgoing,
      store,
    })
    return {
      ok: true,
      undoStack: [persisted.snapshot],
      snapshot: persisted.snapshot,
      project: persisted.project,
      actionError: null,
      persisted,
    }
  } catch (error) {
    return {
      ok: false,
      undoStack,
      snapshot: outgoing.snapshot,
      project: outgoing.project,
      actionError: {
        surface: "projects-dialog",
        action: "create",
        message:
          error instanceof Error
            ? `Could not create the project: ${error.message}`
            : "Could not create the project.",
      },
    }
  }
}

export const canAutosaveProjectIdentity = (
  projectId: string,
  blockedIds: readonly string[]
) => !blockedIds.includes(projectId)

export const flushAutosaveIfAllowed = (
  snapshot: EditorSnapshot,
  project: EditorProjectMetadata,
  blockedIds: readonly string[],
  store: EditorProjectStore = defaultStore()
) => {
  if (!canAutosaveProjectIdentity(project.id, blockedIds)) {
    return { wrote: false, project }
  }
  return {
    wrote: true,
    project: writePersistedEditorDocument(snapshot, project, store),
  }
}

export const persistCurrentProjectDeletion = ({
  deleting,
  replacement,
  store: requestedStore,
}: {
  deleting: EditorProjectMetadata
  replacement: {
    snapshot: EditorSnapshot
    project: EditorProjectMetadata
  }
  store?: EditorProjectStore
}): {
  snapshot: EditorSnapshot
  project: EditorProjectMetadata
  blockedAutosaveIds: string[]
} => {
  const store = requestedStore ?? defaultStore()
  const replacementListed = isProjectListed(replacement.project.id, store)
  let replacementWritten = false

  try {
    const replacementDocument = writeEditorProjectDocument(
      replacement.snapshot,
      replacement.project,
      store
    )
    replacementWritten = true
    writeCurrentEditorProjectId(replacementDocument.project.id, store)
    const blockedAutosaveIds = [deleting.id]
    try {
      const remaining = listPersistedEditorProjects(store).filter(
        (project) =>
          project.id !== deleting.id &&
          project.id !== replacementDocument.project.id
      )
      store.setItem(
        EDITOR_RECENT_PROJECTS_KEY,
        JSON.stringify([replacementDocument.project, ...remaining])
      )
    } catch {
      // Identity already switched; leftover index repair is best-effort.
    }
    try {
      store.removeItem(editorProjectStorageKey(deleting.id))
    } catch {
      // Identity already switched; do not resurrect the deleted project.
    }
    return {
      snapshot: replacementDocument.snapshot,
      project: replacementDocument.project,
      blockedAutosaveIds,
    }
  } catch (error) {
    if (
      replacementWritten &&
      !replacementListed &&
      replacement.project.id !== deleting.id
    ) {
      discardUnlistedProject(replacement.project.id, store)
    }
    throw error
  }
}

export const createProjectActionError = (
  action: ProjectActionKind,
  message: string
): ProjectActionError => ({
  surface: "projects-dialog",
  action,
  message,
})

export const projectsDialogErrorText = (
  error: ProjectActionError | null | undefined
) => (error?.surface === "projects-dialog" ? error.message : null)

export const persistStatusAfterSuccessfulBackup = (
  persistStatus: ProjectPersistStatus
): ProjectPersistStatus => persistStatus

export const applySuccessfulBackup = ({
  persistStatus,
  persistMessage,
}: {
  persistStatus: ProjectPersistStatus
  persistMessage: string
}) => ({
  persistStatus: persistStatusAfterSuccessfulBackup(persistStatus),
  persistMessage:
    persistStatus === "error" ? persistMessage : "Copy downloaded.",
})

export const chooseDeletionReplacement = ({
  deletingId,
  store: requestedStore,
  createBlank,
}: {
  deletingId: string
  store?: EditorProjectStore
  createBlank: () => {
    snapshot: EditorSnapshot
    project: EditorProjectMetadata
  }
}) => {
  const store = requestedStore ?? defaultStore()
  const fallback = listPersistedEditorProjects(store)
    .filter((project) => project.id !== deletingId)
    .map((project) => readPersistedEditorProject(project.id, store))
    .find((document) => document !== null)
  return fallback ?? createBlank()
}

export const readRestoredEditorDocument = (
  store: EditorProjectStore = defaultStore()
) => {
  const document = readPersistedEditorDocument(store)
  return {
    projectId: document?.project.id ?? readCurrentEditorProjectId(store),
    document,
  }
}
