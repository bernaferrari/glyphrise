"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Check,
  CircleDot,
  CircleHelp,
  Download,
  FileDown,
  FolderClock,
  FolderOpen,
  Moon,
  LoaderCircle,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Sun,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectNameField } from "./ProjectNameField"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AppTopBarProps {
  zenMode: boolean
  themeMounted: boolean
  isLightTheme: boolean
  themeToggleLabel: string
  autoKeyEnabled: boolean
  onZenModeChange: (enabled: boolean) => void
  onThemeChange: (theme: "dark" | "light") => void
  onAutoKeyChange: (enabled: boolean) => void
  onProjectNew: () => void
  onProjectOpen: () => void
  onProjectSave: () => void
  projectStatus: "restoring" | "saving" | "saved" | "error"
  projectStatusMessage: string
  projectName: string
  onProjectNameChange: (name: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onGuideOpen: () => void
  onExportOpen: () => void
}

function CompactWorkspaceMenu({
  onProjectNew,
  onProjectOpen,
  onProjectSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onGuideOpen,
}: Pick<
  AppTopBarProps,
  | "onProjectNew"
  | "onProjectOpen"
  | "onProjectSave"
  | "onUndo"
  | "onRedo"
  | "canUndo"
  | "canRedo"
  | "onGuideOpen"
>) {
  const [open, setOpen] = useState(false)
  const action = (callback: () => void) => () => {
    setOpen(false)
    callback()
  }
  const items: Array<{
    label: string
    Icon: LucideIcon
    onClick: () => void
    disabled: boolean
  }> = [
    {
      label: "Projects",
      Icon: FolderClock,
      onClick: action(onProjectNew),
      disabled: false,
    },
    {
      label: "Import project file",
      Icon: FolderOpen,
      onClick: action(onProjectOpen),
      disabled: false,
    },
    {
      label: "Download project backup",
      Icon: FileDown,
      onClick: action(onProjectSave),
      disabled: false,
    },
    { label: "Undo", Icon: Undo2, onClick: action(onUndo), disabled: !canUndo },
    { label: "Redo", Icon: Redo2, onClick: action(onRedo), disabled: !canRedo },
    {
      label: "Quick start",
      Icon: CircleHelp,
      onClick: action(onGuideOpen),
      disabled: false,
    },
  ]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Workspace actions"
        title="Workspace actions"
        className="grid size-9 place-items-center rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
      >
        <MoreHorizontal className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5 md:hidden">
        {items.map(({ label, Icon, onClick, disabled }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:text-muted-foreground disabled:opacity-50"
          >
            <Icon className="size-4 text-muted-foreground" />
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ProjectMenu({
  onProjectNew,
  onProjectOpen,
  onProjectSave,
  projectStatus,
  projectStatusMessage,
}: Pick<
  AppTopBarProps,
  | "onProjectNew"
  | "onProjectOpen"
  | "onProjectSave"
  | "projectStatus"
  | "projectStatusMessage"
>) {
  const [open, setOpen] = useState(false)
  const action = (callback: () => void) => () => {
    setOpen(false)
    callback()
  }
  const items = [
    {
      label: "Projects on this device",
      accessibleLabel: "Open projects",
      description: "Create, switch, duplicate, or delete",
      Icon: FolderClock,
      onClick: action(onProjectNew),
    },
    {
      label: "Import project file",
      accessibleLabel: "Import project file",
      description: "Open a downloaded VectorForge backup",
      Icon: FolderOpen,
      onClick: action(onProjectOpen),
    },
    {
      label: "Download backup",
      accessibleLabel: "Download project backup",
      description: "Save a portable copy of this project",
      Icon: FileDown,
      onClick: action(onProjectSave),
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            aria-label="Open project menu"
            title="Project"
            className="hidden h-9 min-w-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium md:inline-flex"
          />
        }
      >
        <FolderClock className="size-3.5" />
        <span className="hidden xl:inline">Project</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1.5">
        <div className="mb-1 flex items-start gap-2 rounded-lg bg-muted/45 px-2.5 py-2">
          {projectStatus === "error" ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          ) : projectStatus === "restoring" || projectStatus === "saving" ? (
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">
              {projectStatus === "restoring"
                ? "Restoring project"
                : projectStatus === "saving"
                  ? "Saving locally"
                  : projectStatus === "error"
                    ? "Autosave needs attention"
                    : "Saved locally"}
            </div>
            <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              {projectStatusMessage}
            </div>
          </div>
        </div>
        {items.map(({ label, accessibleLabel, description, Icon, onClick }) => (
          <button
            key={label}
            type="button"
            aria-label={accessibleLabel}
            onClick={onClick}
            className="flex min-h-14 w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                {description}
              </span>
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export function AppTopBar({
  zenMode,
  themeMounted,
  isLightTheme,
  themeToggleLabel,
  autoKeyEnabled,
  onZenModeChange,
  onThemeChange,
  onAutoKeyChange,
  onProjectNew,
  onProjectOpen,
  onProjectSave,
  projectStatus,
  projectStatusMessage,
  projectName,
  onProjectNameChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onGuideOpen,
  onExportOpen,
}: AppTopBarProps) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-2 backdrop-blur-xl sm:px-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={zenMode ? "Show panels" : "Hide panels"}
          onClick={() => onZenModeChange(!zenMode)}
          className="size-9 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {zenMode ? (
            <PanelLeftOpen className="mx-auto size-4" />
          ) : (
            <PanelLeftClose className="mx-auto size-4" />
          )}
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden min-w-0 lg:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                VectorForge
              </span>
              <span className="hidden text-[11px] tracking-[0.18em] text-muted-foreground uppercase sm:inline">
                3D Motion Studio
              </span>
            </div>
          </div>
          <span className="hidden h-5 w-px bg-border md:block" />
          <ProjectNameField
            value={projectName}
            onCommit={onProjectNameChange}
          />
        </div>
      </div>

      <div />

      <div className="flex items-center gap-1.5">
        <span
          aria-live="polite"
          title={projectStatusMessage}
          className={`flex min-w-7 items-center justify-center gap-1.5 rounded-md px-1.5 text-xs ${
            projectStatus === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {projectStatus === "restoring" || projectStatus === "saving" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin motion-reduce:animate-none"
            />
          ) : projectStatus === "error" ? (
            <AlertTriangle aria-hidden="true" className="size-3.5" />
          ) : (
            <Check aria-hidden="true" className="size-3.5" />
          )}
          <span className="hidden max-w-28 truncate lg:inline">
            {projectStatus === "restoring"
              ? "Restoring…"
              : projectStatus === "saving"
                ? "Saving locally…"
                : projectStatus === "error"
                  ? "Autosave needs attention"
                  : "Saved locally"}
          </span>
        </span>
        <ProjectMenu
          onProjectNew={onProjectNew}
          onProjectOpen={onProjectOpen}
          onProjectSave={onProjectSave}
          projectStatus={projectStatus}
          projectStatusMessage={projectStatusMessage}
        />
        <div className="hidden items-center rounded-lg border border-border bg-muted/35 p-0.5 sm:flex">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
            className="size-7 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            onClick={onRedo}
            disabled={!canRedo}
            className="size-7 rounded-md text-muted-foreground hover:text-foreground"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={autoKeyEnabled}
          aria-label={autoKeyEnabled ? "Disable auto-key" : "Enable auto-key"}
          title={
            autoKeyEnabled
              ? "Auto-key is on: edits create keyframes at the playhead"
              : "Auto-key is off: edits stay static unless a keyframe is selected"
          }
          onClick={() => onAutoKeyChange(!autoKeyEnabled)}
          className={`h-9 gap-1.5 rounded-lg border px-2 text-xs font-medium ${
            autoKeyEnabled
              ? "border-destructive/35 bg-destructive/12 text-destructive hover:bg-destructive/18 hover:text-destructive"
              : "border-border bg-muted/50"
          }`}
        >
          <CircleDot className="size-3.5" />
          <span className="hidden lg:inline">Auto-key</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Open quick start"
          title="Quick start"
          onClick={onGuideOpen}
          className="hidden size-9 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
        >
          <CircleHelp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          onClick={() => {
            if (!themeMounted) return
            onThemeChange(isLightTheme ? "dark" : "light")
          }}
          className="size-9 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isLightTheme ? (
            <Moon className="size-3.5" />
          ) : (
            <Sun className="size-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          aria-label="Export"
          className="h-9 gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onExportOpen}
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <CompactWorkspaceMenu
          onProjectNew={onProjectNew}
          onProjectOpen={onProjectOpen}
          onProjectSave={onProjectSave}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onGuideOpen={onGuideOpen}
        />
      </div>
      {projectStatus === "error" ? (
        <div
          role="alert"
          className="absolute top-[calc(100%+8px)] right-3 flex max-w-[min(30rem,calc(100vw-1.5rem))] items-start gap-2 rounded-lg border border-destructive/35 bg-background/95 px-3 py-2 text-xs leading-5 text-foreground shadow-xl backdrop-blur-md"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <span>{projectStatusMessage}</span>
        </div>
      ) : null}
    </header>
  )
}
