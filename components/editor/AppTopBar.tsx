"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
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
      label: "Files",
      Icon: FolderClock,
      onClick: action(onProjectNew),
      disabled: false,
    },
    {
      label: "Open from computer",
      Icon: FolderOpen,
      onClick: action(onProjectOpen),
      disabled: false,
    },
    {
      label: "Download a copy",
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
  const statusText =
    projectStatus === "restoring"
      ? "Restoring…"
      : projectStatus === "saving"
        ? "Saving…"
        : projectStatus === "error"
          ? "Autosave needs attention"
          : "Saved"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Open file menu"
            title="Files"
            className="hidden size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-muted data-[popup-open]:text-foreground md:grid"
          />
        }
      >
        <ChevronDown className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 p-1">
        {/* What a project is, in one breath, with the save state inline. */}
        <div className="px-2.5 pt-2 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            {projectStatus === "error" ? (
              <AlertTriangle className="size-3.5 text-destructive" />
            ) : projectStatus === "saved" ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
            )}
            {statusText}
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            {projectStatus === "error"
              ? projectStatusMessage
              : "Files save automatically in this browser. Download a copy to back one up or move it to another device."}
          </p>
        </div>
        <div className="-mx-1 border-t border-border" />
        <div className="grid gap-0.5 pt-1">
          <MenuRow
            label="All files…"
            accessibleLabel="All files"
            Icon={FolderClock}
            onClick={action(onProjectNew)}
          />
          <MenuRow
            label="Download a copy"
            accessibleLabel="Download a copy"
            Icon={FileDown}
            onClick={action(onProjectSave)}
          />
          <MenuRow
            label="Open from computer…"
            accessibleLabel="Open from computer"
            Icon={FolderOpen}
            onClick={action(onProjectOpen)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MenuRow({
  label,
  accessibleLabel,
  hint,
  Icon,
  onClick,
}: {
  label: string
  accessibleLabel: string
  hint?: string
  Icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={accessibleLabel}
      onClick={onClick}
      className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
    >
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="font-mono text-[10px] text-muted-foreground">
          {hint}
        </span>
      )}
    </button>
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
      ? "Restoring file"
      : projectStatus === "saving"
        ? "Saving locally…"
        : projectStatus === "error"
          ? "Autosave needs attention"
          : "Saved locally"

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))] backdrop-blur-xl max-[720px]:h-14 sm:pr-[max(0.75rem,env(safe-area-inset-right))] sm:pl-[max(0.75rem,env(safe-area-inset-left))]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          aria-label={zenMode ? "Show panels" : "Hide panels"}
          onClick={() => onZenModeChange(!zenMode)}
          className="hidden size-9 rounded-lg border border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[720px]:block"
        >
          {zenMode ? (
            <PanelLeftOpen className="mx-auto size-4.5" />
          ) : (
            <PanelLeftClose className="mx-auto size-4.5" />
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
          <div className="flex min-w-0 items-center">
            <ProjectNameField
              value={projectName}
              onCommit={onProjectNameChange}
            />
            <ProjectMenu
              onProjectNew={onProjectNew}
              onProjectOpen={onProjectOpen}
              onProjectSave={onProjectSave}
              projectStatus={projectStatus}
              projectStatusMessage={projectStatusMessage}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Announce successful saves without adding top-bar clutter. Keep
            saving progress and failures visible. Details live in ProjectMenu. */}
        <span
          aria-live="polite"
          title={projectStatusMessage}
          className={
            projectStatus === "saved"
              ? "sr-only"
              : `flex items-center gap-1.5 px-1.5 text-xs whitespace-nowrap ${
                  projectStatus === "error"
                    ? "text-destructive"
                    : "text-muted-foreground/80"
                }`
          }
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
          {projectStatus !== "saved" && (
            <span aria-hidden="true" className="hidden sm:inline">
              {projectStatusLabel}
            </span>
          )}
        </span>
        {/* Phones: undo/redo stay one tap away on every workspace view. */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            aria-label="Undo edit"
            onClick={onUndo}
            disabled={!canUndo}
            className="grid size-11 place-items-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/35"
          >
            <Undo2 aria-hidden="true" className="size-4.5" />
          </button>
          <button
            type="button"
            aria-label="Redo edit"
            onClick={onRedo}
            disabled={!canRedo}
            className="grid size-11 place-items-center rounded-lg text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/35"
          >
            <Redo2 aria-hidden="true" className="size-4.5" />
          </button>
        </div>
        <div className="hidden items-center gap-0.5 md:flex">
          <Button
            size="icon-touch"
            variant="muted-ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="size-4.5" />
          </Button>
          <Button
            size="icon-touch"
            variant="muted-ghost"
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 className="size-4.5" />
          </Button>
        </div>
        <Button
          size="icon-touch"
          variant="muted-ghost"
          aria-label="Getting started"
          title="Getting started"
          onClick={onGettingStarted}
          className="hidden min-[720px]:inline-flex"
        >
          <CircleHelp aria-hidden="true" className="size-4.5" />
        </Button>
        <Button
          size="icon-touch"
          variant="muted-ghost"
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          onClick={() => {
            if (!themeMounted) return
            onThemeChange(isLightTheme ? "dark" : "light")
          }}
          className="hidden min-[480px]:inline-flex"
        >
          {isLightTheme ? (
            <Moon className="size-4.5" />
          ) : (
            <Sun className="size-4.5" />
          )}
        </Button>
        <Button
          size="toolbar"
          aria-label="Export"
          className="hover:bg-primary/90"
          onClick={onExportOpen}
        >
          <Download className="size-4.5" />
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
