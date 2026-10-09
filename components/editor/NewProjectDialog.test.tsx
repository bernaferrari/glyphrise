// @vitest-environment happy-dom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect, it, vi } from "vitest"
import {
  NewProjectDialog,
  type NewProjectDialogProps,
} from "./NewProjectDialog"
import * as model from "./NewProjectDialogModel"

it("does not build saved-file rows while the Files dialog is closed", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  const rows = vi.spyOn(model, "getVisibleSavedProjectRows")
  const container = document.createElement("div")
  document.body.append(container)
  const root = createRoot(container)
  const props: NewProjectDialogProps = {
    open: false,
    currentProjectId: "",
    recentProjects: [],
    onOpenChange: vi.fn(),
    onCreate: vi.fn(),
    onOpenRecent: vi.fn(),
    onDuplicateRecent: vi.fn(),
    onDeleteRecent: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onImportFile: vi.fn(),
  }
  try {
    act(() => root.render(<NewProjectDialog {...props} />))
    expect(rows).not.toHaveBeenCalled()
    act(() => root.render(<NewProjectDialog {...props} open />))
    expect(rows).toHaveBeenCalled()
    expect(document.body.textContent).toContain("Files")
  } finally {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  }
})
