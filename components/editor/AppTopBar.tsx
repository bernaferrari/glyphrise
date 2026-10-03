"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Sparkles,
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
  onZenModeChange: (enabled: boolean) => void
  onThemeChange: (theme: "dark" | "light") => void
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
  onGettingStarted: () => void
  onAnimateOpen: () => void
  onExportOpen: () => void
}

function CompactWorkspaceMenu({
  zenMode,
  onZenModeChange,
  themeMounted,
  isLightTheme,
  themeToggleLabel,
  onProjectNew,
  onProjectOpen,
  onProjectSave,
  onGettingStarted,
  onAnimateOpen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onThemeChange,
}: Pick<
  AppTopBarProps,
  | "onAnimateOpen"
  | "themeMounted"
  | "isLightTheme"
  | "themeToggleLabel"
  | "onProjectNew"
  | "onProjectOpen"
  | "onProjectSave"
  | "onGettingStarted"
  | "onUndo"
  | "onRedo"
  | "canUndo"
  | "canRedo"
  | "onZenModeChange"
  | "zenMode"
  | "onThemeChange"
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
    pressed?: boolean
  }> = [
    {
      label: "Animate",
      Icon: Sparkles,
      onClick: action(onAnimateOpen),
      disabled: false,
    },
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
    {
      label: zenMode ? "Show panels" : "Focus canvas",
      Icon: PanelLeftClose,
      onClick: action(() => onZenModeChange(!zenMode)),
      disabled: false,
    },
    { label: "Undo", Icon: Undo2, onClick: action(onUndo), disabled: !canUndo },
    { label: "Redo", Icon: Redo2, onClick: action(onRedo), disabled: !canRedo },
    {
      label: "Getting started",
      Icon: CircleHelp,
      onClick: action(onGettingStarted),
      disabled: false,
    },
    {
      label: themeToggleLabel,
      Icon: isLightTheme ? Moon : Sun,
      onClick: action(() => onThemeChange(isLightTheme ? "dark" : "light")),
      disabled: !themeMounted,
    },
  ]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Workspace actions"
        title="Workspace actions"
        className="grid size-11 place-items-center rounded-lg border border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
      >
        <MoreHorizontal className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5 md:hidden">
        {items.map(({ label, Icon, onClick, disabled, pressed }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            aria-pressed={pressed}
            onClick={onClick}
            className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:text-muted-foreground disabled:opacity-50 ${
              pressed ? "bg-destructive/10 text-destructive" : "text-foreground"
            }`}
          >
            <Icon
              aria-hidden="true"
              className={`size-4 ${pressed ? "text-destructive" : "text-muted-foreground"}`}
            />
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
      description: "Open a downloaded Glyphrise backup",
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
  onZenModeChange,
  onThemeChange,
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
  onGettingStarted,
  onAnimateOpen,
  onExportOpen,
}: AppTopBarProps) {
  const projectStatusLabel =
    projectStatus === "restoring"
      ? "Restoring project"
      : projectStatus === "saving"
        ? "Saving locally…"
        : projectStatus === "error"
          ? "Autosave needs attention"
          : "Saved locally"

  return (
    <header className="app-topbar relative z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur-xl max-[720px]:h-14 sm:pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(0.75rem,env(safe-area-inset-left))]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          aria-label={zenMode ? "Show panels" : "Hide panels"}
          onClick={() => onZenModeChange(!zenMode)}
          className="hidden size-9 rounded-lg border border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[720px]:block"
        >
          {zenMode ? (
            <PanelLeftOpen className="mx-auto size-4" />
          ) : (
            <PanelLeftClose className="mx-auto size-4" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="hidden min-w-0 lg:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Glyphrise
              </span>
              <span className="hidden text-xs tracking-normal text-muted-foreground sm:inline">
                Motion studio
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

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Status is text, not an icon that reads as a button. Quiet when
            saved; visible while saving or when something needs attention. */}
        <span
          aria-live="polite"
          title={projectStatusMessage}
          className={`flex items-center gap-1.5 px-1.5 text-xs whitespace-nowrap ${
            projectStatus === "error"
              ? "text-destructive"
              : "text-muted-foreground/80"
          }`}
        >
          <span className="sr-only">{projectStatusLabel}</span>
          {projectStatus === "restoring" || projectStatus === "saving" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin motion-reduce:animate-none"
            />
          ) : projectStatus === "error" ? (
            <AlertTriangle aria-hidden="true" className="size-3.5" />
          ) : null}
          <span
            aria-hidden="true"
            className={
              projectStatus === "saved"
                ? "hidden lg:inline"
                : "hidden sm:inline"
            }
          >
            {projectStatus === "saved" ? "Saved" : projectStatusLabel}
          </span>
        </span>
        <ProjectMenu
          onProjectNew={onProjectNew}
          onProjectOpen={onProjectOpen}
          onProjectSave={onProjectSave}
          projectStatus={projectStatus}
          projectStatusMessage={projectStatusMessage}
        />
        {/* Phones: undo/redo stay one tap away on every workspace view. */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            aria-label="Undo edit"
            onClick={onUndo}
            disabled={!canUndo}
            className="grid size-11 place-items-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/35"
          >
            <Undo2 aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Redo edit"
            onClick={onRedo}
            disabled={!canRedo}
            className="grid size-11 place-items-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/35"
          >
            <Redo2 aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="hidden items-center gap-0.5 md:flex">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
            className="size-10 rounded-lg text-muted-foreground hover:text-foreground"
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
            className="size-10 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Animate"
          title="Animate"
          onClick={onAnimateOpen}
          className="hidden h-9 w-auto gap-1.5 rounded-lg border border-transparent bg-transparent px-3 text-xs text-foreground hover:bg-muted min-[720px]:inline-flex"
        >
          <Sparkles className="size-3.5" />
          <span className="hidden min-[480px]:inline">Animate</span>
        </Button>
        <button
          type="button"
          aria-label="Getting started"
          title="Getting started"
          onClick={onGettingStarted}
          className="hidden size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring min-[720px]:grid"
        >
          <CircleHelp aria-hidden="true" className="size-4" />
        </button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          onClick={() => {
            if (!themeMounted) return
            onThemeChange(isLightTheme ? "dark" : "light")
          }}
          className="hidden size-9 rounded-lg border border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground min-[480px]:inline-flex"
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
          className="h-11 gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onExportOpen}
        >
          <Download className="size-3.5" />
          <span className="">Export</span>
        </Button>
        <CompactWorkspaceMenu
          zenMode={zenMode}
          onZenModeChange={onZenModeChange}
          themeMounted={themeMounted}
          isLightTheme={isLightTheme}
          themeToggleLabel={themeToggleLabel}
          onProjectNew={onProjectNew}
          onProjectOpen={onProjectOpen}
          onProjectSave={onProjectSave}
          onGettingStarted={onGettingStarted}
          onAnimateOpen={onAnimateOpen}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onThemeChange={onThemeChange}
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
