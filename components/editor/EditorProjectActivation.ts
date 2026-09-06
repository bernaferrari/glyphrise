import type { EditorSnapshot } from "./EditorModel"
import {
  type EditorProjectMetadata,
  type EditorProjectStore,
  writeCurrentEditorProjectId,
  writeEditorProjectDocument,
  writeEditorProjectIndex,
} from "./EditorDocumentModel"

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

const defaultStore = (): EditorProjectStore => window.localStorage

const persistOutgoingDocument = (
  outgoing: ProjectActivationRequest["outgoing"],
  incomingProjectId: string,
  store: EditorProjectStore
) => {
  if (outgoing.project.id === incomingProjectId) return
  writeEditorProjectDocument(outgoing.snapshot, outgoing.project, store)
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
 */
export const persistProjectActivation = (
  request: ProjectActivationRequest
): ProjectActivationResult => {
  const store = request.store ?? defaultStore()
  const preserveOutgoing = request.preserveOutgoing !== false

  if (preserveOutgoing) {
    persistOutgoingDocument(request.outgoing, request.incomingProject.id, store)
  }

  const incomingDocument = writeEditorProjectDocument(
    request.incomingSnapshot,
    request.incomingProject,
    store
  )
  writeEditorProjectIndex(incomingDocument.project, store)
  writeCurrentEditorProjectId(incomingDocument.project.id, store)

  return {
    kind: request.kind,
    snapshot: incomingDocument.snapshot,
    project: incomingDocument.project,
  }
}
