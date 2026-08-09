"use client"

import { useEffect, useState } from "react"
import { Download, FilePlus2, FolderClock, Sparkles } from "lucide-react"
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
  onDownloadCurrent: () => void
}

export function NewProjectDialog({
  open,
  currentProjectName,
  recentProjects,
  templates,
  onOpenChange,
  onCreate,
  onCreateFromTemplate,
  onOpenRecent,
  onDownloadCurrent,
}: NewProjectDialogProps) {
  const [name, setName] = useState("Untitled project")

  useEffect(() => {
    if (open) setName("Untitled project")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(720px,calc(100dvh-32px))] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a new project</DialogTitle>
          <DialogDescription>
            Your current project remains in Recent projects. Download a portable
            copy first if you want an additional backup.
          </DialogDescription>
        </DialogHeader>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Project name
          </span>
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreate("blank", name)
            }}
            className="h-10 rounded-lg border border-input bg-background px-3 text-base text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            aria-label="New project name"
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onCreate("blank", name)}
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
          <div className="grid grid-cols-3 gap-1.5">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                title={template.description}
                onClick={() => onCreateFromTemplate(template.id, name)}
                className="flex min-h-12 min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/25 px-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-ring/40 hover:bg-muted/55 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.99]"
              >
                <span aria-hidden="true">{template.emoji}</span>
                <span className="truncate text-xs font-medium text-foreground">
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </section>

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
                Recent projects
              </h3>
            </div>
            <div className="grid gap-1 rounded-xl border border-border bg-muted/20 p-1">
              {recentProjects.slice(0, 5).map((recent) => (
                <button
                  key={recent.id}
                  type="button"
                  onClick={() => onOpenRecent(recent.id)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {recent.name}
                  </span>
                  <time
                    dateTime={recent.updatedAt}
                    className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  >
                    {new Date(recent.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </button>
              ))}
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
  )
}
