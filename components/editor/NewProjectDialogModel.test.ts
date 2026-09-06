import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { createProjectMetadata } from "./EditorDocumentModel"
import {
  filterSavedProjects,
  getVisibleSavedProjectRows,
  SAVED_PROJECT_ROW_ACTIONS,
} from "./NewProjectDialogModel"

const twelveProjects = () => [
  createProjectMetadata("Oldest saved project"),
  ...Array.from({ length: 11 }, (_, index) =>
    createProjectMetadata(`Project ${index + 2}`)
  ),
]

describe("saved project list", () => {
  it("renders every saved project, including those beyond the first eight", () => {
    const projects = twelveProjects()
    const rows = getVisibleSavedProjectRows(projects, "")

    expect(rows).toHaveLength(12)
    expect(filterSavedProjects(projects, "")).toHaveLength(12)
    expect(rows.map((row) => row.project.name)).toEqual(
      projects.map((project) => project.name)
    )
  })

  it("finds the oldest project and exposes reopen, duplicate, and delete", () => {
    const projects = twelveProjects()
    const oldest = projects[0]
    const rows = getVisibleSavedProjectRows(projects, oldest.name)

    expect(rows).toHaveLength(1)
    expect(rows[0].project.id).toBe(oldest.id)
    expect(rows[0].project.name).toBe("Oldest saved project")
    expect(rows[0].actions).toEqual(SAVED_PROJECT_ROW_ACTIONS)
    expect(rows[0].actions).toContain("open")
    expect(rows[0].actions).toContain("duplicate")
    expect(rows[0].actions).toContain("delete")
  })

  it("is the list the Projects dialog actually maps, without an eight-item slice", () => {
    const source = readFileSync(
      new URL("./NewProjectDialog.tsx", import.meta.url),
      "utf8"
    )

    expect(source).toContain("getVisibleSavedProjectRows")
    expect(source).toContain("filterSavedProjects")
    expect(source).not.toMatch(/slice\(\s*0\s*,\s*8\s*\)/)
    expect(source).toContain("aria-label={`Open ${recent.name}")
    expect(source).toContain("aria-label={`Duplicate ${recent.name}`}")
    expect(source).toContain("aria-label={`Delete ${recent.name}`}")
  })
})
