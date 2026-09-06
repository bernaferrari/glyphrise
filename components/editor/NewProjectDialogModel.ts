import type { EditorProjectMetadata } from "./EditorDocumentModel"

export const SAVED_PROJECT_ROW_ACTIONS = [
  "open",
  "duplicate",
  "delete",
] as const

export type SavedProjectRowAction = (typeof SAVED_PROJECT_ROW_ACTIONS)[number]

export const filterSavedProjects = (
  projects: EditorProjectMetadata[],
  query: string
): EditorProjectMetadata[] => {
  const needle = query.trim().toLowerCase()
  if (!needle) return projects
  return projects.filter((project) =>
    project.name.toLowerCase().includes(needle)
  )
}

export const getVisibleSavedProjectRows = (
  projects: EditorProjectMetadata[],
  query: string
) =>
  filterSavedProjects(projects, query).map((project) => ({
    project,
    actions: SAVED_PROJECT_ROW_ACTIONS,
  }))
