import { describe, expect, it } from "vitest"
import {
  applySuccessfulBackup,
  createProjectActionError,
  persistStatusAfterSuccessfulBackup,
  projectsDialogErrorText,
} from "./EditorProjectActivation"

describe("project save and action status", () => {
  it("does not report local persist as saved after a successful download", () => {
    const afterError = applySuccessfulBackup({
      persistStatus: "error",
      persistMessage: "Autosave failed: quota exceeded",
    })
    expect(afterError.persistStatus).toBe("error")
    expect(afterError.persistMessage).toBe("Autosave failed: quota exceeded")
    expect(persistStatusAfterSuccessfulBackup("error")).toBe("error")

    const afterSaved = applySuccessfulBackup({
      persistStatus: "saved",
      persistMessage: "All changes saved locally.",
    })
    expect(afterSaved.persistStatus).toBe("saved")
    expect(afterSaved.persistMessage).toBe("Copy downloaded.")
  })

  it("associates create, duplicate, and delete failures with the Projects dialog", () => {
    const createError = createProjectActionError(
      "create",
      "Could not create the project: storage write 2 failed"
    )
    const duplicateError = createProjectActionError(
      "duplicate",
      "Could not duplicate the project."
    )
    const deleteError = createProjectActionError(
      "delete",
      "Could not delete the project."
    )

    expect(createError.surface).toBe("projects-dialog")
    expect(duplicateError.surface).toBe("projects-dialog")
    expect(deleteError.surface).toBe("projects-dialog")
    expect(projectsDialogErrorText(createError)).toBe(createError.message)
    expect(projectsDialogErrorText(duplicateError)).toBe(duplicateError.message)
    expect(projectsDialogErrorText(deleteError)).toBe(deleteError.message)
    expect(projectsDialogErrorText(null)).toBeNull()
  })
})
