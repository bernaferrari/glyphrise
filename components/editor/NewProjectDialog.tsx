"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  Download,
  FilePlus2,
  FolderOpen,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { EditorProjectMetadata } from "./EditorDocumentModel"
import {
  projectsDialogErrorText,
  type ProjectActionError,
} from "./EditorProjectActivation"
import {
  filterSavedProjects,
  getVisibleSavedProjectRows,
} from "./NewProjectDialogModel"

export type NewProjectDialogProps = {
  open: boolean
  currentProjectId: string
  recentProjects: EditorProjectMetadata[]
  templates: Array<{
    id: string
    name: string
    description: string
    preview: string
  }>
  onOpenChange: (open: boolean) => void
  onCreate: (kind: "blank" | "example", name: string) => void
  onCreateFromTemplate: (templateId: string, name: string) => void
  onOpenRecent: (projectId: string) => void
  onDuplicateRecent: (projectId: string) => void
  onDeleteRecent: (projectId: string) => void
  onDownloadCurrent: () => void
  onImportFile: () => void
  actionError?: ProjectActionError | null
}

export function NewProjectDialog(props: NewProjectDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        variant="flush"
        className="flex max-h-(--spacing-files-dialog) flex-col overflow-hidden sm:max-w-xl"
      >
        <NewProjectDialogContent {...props} />
      </DialogContent>
    </Dialog>
  )
}

// The popup mounts this content only while visible (including its exit
// animation), so playback does not rebuild a closed file browser's rows.
function NewProjectDialogContent({
  open,
  currentProjectId,
  recentProjects,
  templates,
  onCreate,
  onCreateFromTemplate,
  onOpenRecent,
  onDuplicateRecent,
  onDeleteRecent,
  onDownloadCurrent,
  onImportFile,
  actionError = null,
}: NewProjectDialogProps) {
  const [name, setName] = useState("Untitled")
  const [projectQuery, setProjectQuery] = useState("")
  const [projectToDelete, setProjectToDelete] =
    useState<EditorProjectMetadata | null>(null)
  const visibleProjects = filterSavedProjects(recentProjects, projectQuery)
  const visibleProjectRows = getVisibleSavedProjectRows(
    recentProjects,
    projectQuery
  )

  useEffect(() => {
    if (open) {
      setName("Untitled")
      setProjectQuery("")
    } else setProjectToDelete(null)
  }, [open])

  const showSearch = recentProjects.length > 5

  return (
    <>
      <DialogHeader variant="files" className="shrink-0">
        <DialogTitle variant="section">Files</DialogTitle>
        <DialogDescription variant="detail">
          Each file is one animation. Files save automatically in this browser.
          Download a copy to back one up or move it to another device.
        </DialogDescription>
      </DialogHeader>

      <div className="editor-scrollbar grid min-h-0 flex-1 gap-6 overflow-y-auto px-6 pt-2 pb-6">
        {projectsDialogErrorText(actionError) ? (
          <p
            role="alert"
            data-project-action={actionError?.action}
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {projectsDialogErrorText(actionError)}
          </p>
        ) : null}

        {recentProjects.length > 0 ? (
          <section
            className="grid gap-2"
            aria-labelledby="recent-projects-title"
          >
            <div className="flex items-center gap-2">
              <h3
                id="recent-projects-title"
                className="text-xs font-medium text-muted-foreground"
              >
                On this device
              </h3>
              <span className="text-2xs text-muted-foreground/70 tabular-nums">
                {visibleProjects.length === recentProjects.length
                  ? recentProjects.length
                  : `${visibleProjects.length} of ${recentProjects.length}`}
              </span>
              {showSearch && (
                <div className="relative ml-auto w-48">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="saved-project-search"
                    type="search"
                    value={projectQuery}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Search"
                    aria-label="Search files"
                    onChange={(event) =>
                      setProjectQuery(event.currentTarget.value)
                    }
                    className="h-8 w-full rounded-md bg-muted/60 pr-2.5 pl-8 text-xs text-foreground outline-none placeholder:text-muted-foreground hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring/35"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-0.5">
              {visibleProjects.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No files match “{projectQuery.trim()}”.
                </p>
              ) : null}
              {visibleProjectRows.map(({ project: recent }) => {
                const current = recent.id === currentProjectId
                return (
                  <div
                    key={recent.id}
                    className="group/project flex items-center rounded-lg transition-colors duration-150 focus-within:bg-muted/60 hover:bg-muted/60"
                  >
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      aria-label={`Open ${recent.name}${current ? ", open now" : ""}`}
                      onClick={() => onOpenRecent(recent.id)}
                      className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {recent.name}
                          </span>
                          {current ? (
                            <span className="shrink-0 rounded-full bg-primary/12 px-1.5 py-px text-3xs font-medium text-primary">
                              Open now
                            </span>
                          ) : null}
                        </span>
                        <time
                          dateTime={recent.updatedAt}
                          className="block text-2xs text-muted-foreground tabular-nums"
                        >
                          Edited{" "}
                          {new Date(recent.updatedAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                        </time>
                      </span>
                    </button>
                    <div className="flex items-center pr-1 opacity-0 transition-opacity group-focus-within/project:opacity-100 group-hover/project:opacity-100 pointer-coarse:opacity-100">
                      <Button
                        type="button"
                        size="icon"
                        variant="muted-ghost"
                        aria-label={`Duplicate ${recent.name}`}
                        title="Duplicate and open"
                        onClick={() => onDuplicateRecent(recent.id)}
                        className=""
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="muted-destructive"
                        aria-label={`Delete ${recent.name}`}
                        title="Delete from this device"
                        onClick={() => setProjectToDelete(recent)}
                        className=""
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}
        {recentProjects.length > 0 ? (
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              <FilePlus2 className="size-4" />
              Create a new file
            </summary>
            <div className="pt-3">
              <NewProjectForm
                name={name}
                setName={setName}
                templates={templates}
                onCreate={onCreate}
                onCreateFromTemplate={onCreateFromTemplate}
              />
            </div>
          </details>
        ) : (
          <NewProjectForm
            name={name}
            setName={setName}
            templates={templates}
            onCreate={onCreate}
            onCreateFromTemplate={onCreateFromTemplate}
          />
        )}
      </div>

      <DialogFooter
        variant="files"
        className="m-0 shrink-0 flex-row items-center justify-between sm:justify-between"
      >
        <Button variant="ghost" size="sm" onClick={onImportFile}>
          <FolderOpen className="size-3.5" />
          Open from computer…
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadCurrent}>
          <Download className="size-3.5" />
          Download a copy
        </Button>
      </DialogFooter>

      <Dialog
        open={projectToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setProjectToDelete(null)
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader variant="files">
            <DialogTitle variant="section">
              Delete “{projectToDelete?.name}”?
            </DialogTitle>
            <DialogDescription variant="detail">
              This removes the file from this browser. Any copy you downloaded
              stays where you saved it.
              {projectToDelete?.id === currentProjectId
                ? " Another recent file will open, or a new blank one will be created."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter variant="files">
            <Button
              type="button"
              variant="outline"
              autoFocus
              onClick={() => setProjectToDelete(null)}
            >
              Keep file
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!projectToDelete) return
                onDeleteRecent(projectToDelete.id)
                setProjectToDelete(null)
              }}
            >
              <Trash2 className="size-4" />
              Delete file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NewProjectForm({
  name,
  setName,
  templates,
  onCreate,
  onCreateFromTemplate,
}: Pick<
  NewProjectDialogProps,
  "templates" | "onCreate" | "onCreateFromTemplate"
> & {
  name: string
  setName: (name: string) => void
}) {
  return (
    <form
      className="grid gap-3"
      aria-labelledby="new-project-title"
      onSubmit={(event) => {
        event.preventDefault()
        onCreate("blank", name)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id="new-project-title"
          className="text-xs font-medium text-muted-foreground"
        >
          New file
        </h3>
        <label className="flex min-w-0 items-center gap-2 text-2xs text-muted-foreground">
          <span className="sr-only">New file name</span>
          <input
            id="new-project-name"
            aria-label="New file name"
            value={name}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            onChange={(event) => setName(event.currentTarget.value)}
            className="h-8 w-48 min-w-0 rounded-md bg-muted/60 px-2.5 text-xs text-foreground transition-[background-color,box-shadow] outline-none placeholder:text-muted-foreground hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring/35"
          />
        </label>
      </div>
      <div className="grid grid-cols-presets gap-2">
        <StartTile
          type="submit"
          label="Start blank"
          hint="Empty canvas"
          preview={
            <span className="grid size-full place-items-center rounded-lg border border-dashed border-foreground/20 text-muted-foreground">
              <FilePlus2 className="size-5" />
            </span>
          }
        />
        <StartTile
          label="Use example"
          hint="Animated pair"
          onClick={() => onCreate("example", name)}
          preview={
            <span className="grid size-full place-items-center rounded-lg bg-muted text-muted-foreground">
              <Sparkles className="size-5" />
            </span>
          }
        />
        {templates.map((template) => (
          <StartTile
            key={template.id}
            label={template.name}
            hint={template.description}
            onClick={() => onCreateFromTemplate(template.id, name)}
            preview={
              <span className="grid size-full place-items-center rounded-lg bg-muted/60">
                <span
                  className="size-9 rounded-full shadow-finish-swatch bg-preview"
                  style={
                    {
                      "--preview-background": template.preview,
                    } as React.CSSProperties
                  }
                />
              </span>
            }
          />
        ))}
      </div>
    </form>
  )
}

function StartTile({
  label,
  hint,
  preview,
  type = "button",
  onClick,
}: {
  label: string
  hint: string
  preview: React.ReactNode
  type?: "button" | "submit"
  onClick?: () => void
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={hint}
      className="group flex min-w-0 flex-col gap-2 rounded-xl p-1.5 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
    >
      <span className="block aspect-preview w-full">{preview}</span>
      <span className="line-clamp-2 min-h-8 px-0.5 text-xs leading-4 font-medium text-foreground">
        {label}
      </span>
    </button>
  )
}
