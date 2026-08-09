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
  FilePlus2,
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
      label: "New project",
      Icon: FilePlus2,
      onClick: action(onProjectNew),
      disabled: false,
    },
    {
      label: "Open project file",
      Icon: FolderOpen,
      onClick: action(onProjectOpen),
      disabled: false,
    },
    {
      label: "Download project",
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
    <div className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-2 backdrop-blur-xl sm:px-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={zenMode ? "Show panels" : "Hide panels"}
          onClick={() => onZenModeChange(!zenMode)}
          className="size-9 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
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
          <span className="hidden max-w-36 truncate 2xl:inline">
            {projectStatus === "restoring"
              ? "Restoring…"
              : projectStatus === "saving"
                ? "Saving locally…"
                : projectStatus === "error"
                  ? "Autosave needs attention"
                  : "Saved locally"}
          </span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Start a new project"
          title="Start a new project"
          onClick={onProjectNew}
          className="hidden h-9 min-w-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium md:inline-flex"
        >
          <FilePlus2 className="size-3.5" />
          <span className="hidden xl:inline">New</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Open project"
          title="Open project"
          onClick={onProjectOpen}
          className="hidden h-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium md:inline-flex"
        >
          <FolderOpen className="size-3.5" />
          <span className="hidden xl:inline">Open</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Download project file"
          title="Download project file"
          onClick={onProjectSave}
          className="hidden h-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium md:inline-flex"
        >
          <FileDown className="size-3.5" />
          <span className="hidden xl:inline">Download</span>
        </Button>
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
          variant={autoKeyEnabled ? "destructive" : "ghost"}
          aria-pressed={autoKeyEnabled}
          aria-label={autoKeyEnabled ? "Disable auto-key" : "Enable auto-key"}
          title={
            autoKeyEnabled
              ? "Auto-key is on: edits create keyframes at the playhead"
              : "Auto-key is off: edits stay static unless a keyframe is selected"
          }
          onClick={() => onAutoKeyChange(!autoKeyEnabled)}
          className="h-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium"
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
    </div>
  )
}
