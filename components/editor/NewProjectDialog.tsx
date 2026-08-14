"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  Download,
  FilePlus2,
  FolderClock,
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

export type NewProjectDialogProps = {
  open: boolean
  currentProjectName: string
  currentProjectId: string
  recentProjects: EditorProjectMetadata[]
  templates: Array<{
    id: string
    name: string
    description: string
    emoji: string
  }>
  onOpenChange: (open: boolean) => void
  onCreate: (kind: "blank" | "example", name: string) => void
  onCreateFromTemplate: (templateId: string, name: string) => void
  onOpenRecent: (projectId: string) => void
  onDuplicateRecent: (projectId: string) => void
  onDeleteRecent: (projectId: string) => void
  onDownloadCurrent: () => void
}

export function NewProjectDialog({
  open,
  currentProjectName,
  currentProjectId,
  recentProjects,
  templates,
  onOpenChange,
  onCreate,
  onCreateFromTemplate,
  onOpenRecent,
  onDuplicateRecent,
  onDeleteRecent,
  onDownloadCurrent,
}: NewProjectDialogProps) {
  const [name, setName] = useState("Untitled project")
  const [projectToDelete, setProjectToDelete] =
    useState<EditorProjectMetadata | null>(null)

  useEffect(() => {
    if (open) setName("Untitled project")
    else setProjectToDelete(null)
  }, [open])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(760px,calc(100dvh-32px))] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
            <DialogDescription>
              Start fresh or reopen work saved on this device. Download a
              portable copy when you need an external backup.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onCreate("blank", name)
            }}
          >
            <div className="grid gap-1.5">
              <label
                htmlFor="new-project-name"
                className="text-xs font-medium text-foreground"
              >
                New project name
              </label>
              <input
                id="new-project-name"
                value={name}
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                onChange={(event) => setName(event.currentTarget.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-base text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                className="group min-h-28 rounded-xl border border-primary/30 bg-primary/8 p-3 text-left transition-[background-color,border-color,transform] duration-150 hover:border-primary/55 hover:bg-primary/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99]"
              >
                <FilePlus2 className="size-5 text-primary" />
                <span className="mt-3 block text-sm font-semibold text-foreground">
                  Start blank
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  One icon at 0s, with no keyframes or transition.
                </span>
              </button>
              <button
                type="button"
                onClick={() => onCreate("example", name)}
                className="group min-h-28 rounded-xl border border-border bg-muted/30 p-3 text-left transition-[background-color,border-color,transform] duration-150 hover:border-ring/45 hover:bg-muted/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99]"
              >
                <Sparkles className="size-5 text-muted-foreground" />
                <span className="mt-3 block text-sm font-semibold text-foreground">
                  Use example
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Begin with the two-icon wipe demo and explore from there.
                </span>
              </button>
            </div>

            <section
              className="grid gap-2"
              aria-labelledby="project-templates-title"
            >
              <h3
                id="project-templates-title"
                className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
              >
                Start with a style
              </h3>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onCreateFromTemplate(template.id, name)}
                    className="flex min-h-14 min-w-0 items-start gap-2 rounded-lg border border-border bg-muted/25 px-2.5 py-2 text-left transition-[background-color,border-color,transform] duration-150 hover:border-ring/40 hover:bg-muted/55 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.99]"
                  >
                    <span aria-hidden="true" className="mt-0.5 shrink-0">
                      {template.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs leading-4 font-medium text-balance text-foreground">
                        {template.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground sm:line-clamp-2">
                        {template.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </form>

          {recentProjects.length > 0 ? (
            <section
              className="grid gap-2"
              aria-labelledby="recent-projects-title"
            >
              <div className="flex items-center gap-2">
                <FolderClock className="size-4 text-muted-foreground" />
                <h3
                  id="recent-projects-title"
                  className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
                >
                  Saved on this device
                </h3>
              </div>
              <div className="grid gap-1 rounded-xl border border-border bg-muted/20 p-1">
                {recentProjects.slice(0, 8).map((recent) => {
                  const current = recent.id === currentProjectId
                  return (
                    <div
                      key={recent.id}
                      className="flex min-h-12 items-center rounded-lg transition-colors duration-150 focus-within:bg-muted hover:bg-muted"
                    >
                      <button
                        type="button"
                        aria-current={current ? "true" : undefined}
                        aria-label={`Open ${recent.name}${current ? ", current project" : ""}`}
                        onClick={() => onOpenRecent(recent.id)}
                        className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {recent.name}
                        </span>
                        {current ? (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Current
                          </span>
                        ) : null}
                        <time
                          dateTime={recent.updatedAt}
                          className="shrink-0 text-xs text-muted-foreground tabular-nums"
                        >
                          {new Date(recent.updatedAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" }
                          )}
                        </time>
                      </button>
                      <Button
                        type="button"
                        size="icon-lg"
                        variant="ghost"
                        aria-label={`Duplicate ${recent.name}`}
                        title="Duplicate and open"
                        onClick={() => onDuplicateRecent(recent.id)}
                        className="size-11 text-muted-foreground"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-lg"
                        variant="ghost"
                        aria-label={`Delete ${recent.name}`}
                        title="Delete from this device"
                        onClick={() => setProjectToDelete(recent)}
                        className="size-11 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          <DialogFooter className="items-center sm:justify-between">
            <span className="hidden min-w-0 truncate text-xs text-muted-foreground sm:block">
              Current: {currentProjectName}
            </span>
            <Button variant="outline" onClick={onDownloadCurrent}>
              <Download className="size-4" />
              Download current
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={projectToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setProjectToDelete(null)
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{projectToDelete?.name}”?</DialogTitle>
            <DialogDescription>
              This removes the locally saved project from this device. Any
              downloaded project file remains available.
              {projectToDelete?.id === currentProjectId
                ? " Another recent project will open, or a new blank project will be created."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              autoFocus
              onClick={() => setProjectToDelete(null)}
            >
              Keep project
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
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
