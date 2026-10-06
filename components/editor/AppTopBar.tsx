"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleHelp,
  FileDown,
  FolderClock,
  FolderOpen,
  Moon,
  LoaderCircle,
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
  onExportOpen: () => void
}

/**
 * The one app menu, anchored to the file name like ShapeShifter's. Phones also
 * get the workspace actions that desktop keeps in the top bar; nothing here
 * repeats a button that is already on screen.
 */
function ProjectMenu({
  onProjectNew,
  onProjectOpen,
  onProjectSave,
  projectStatus,
  projectStatusMessage,
  onGettingStarted,
  themeMounted,
  isLightTheme,
  themeToggleLabel,
  onThemeChange,
}: Pick<
  AppTopBarProps,
  | "onProjectNew"
  | "onProjectOpen"
  | "onProjectSave"
  | "projectStatus"
  | "projectStatusMessage"
  | "onGettingStarted"
  | "themeMounted"
  | "isLightTheme"
  | "themeToggleLabel"
  | "onThemeChange"
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
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
          />
        }
      >
        <ChevronDown className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent density="compact" align="start" className="w-64">
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
          <p className="mt-1 text-2xs leading-4 text-muted-foreground">
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
        <div className="md:hidden">
          <div className="-mx-1 my-1 border-t border-border" />
          <div className="grid gap-0.5">
            <MenuRow
              label="Getting started"
              accessibleLabel="Getting started"
              Icon={CircleHelp}
              onClick={action(onGettingStarted)}
            />
            <MenuRow
              label={themeToggleLabel}
              accessibleLabel={themeToggleLabel}
              Icon={isLightTheme ? Moon : Sun}
              onClick={action(() => {
                if (themeMounted) onThemeChange(isLightTheme ? "dark" : "light")
              })}
            />
          </div>
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
        <span className="font-mono text-3xs text-muted-foreground">{hint}</span>
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
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 pr-safe-2 pl-safe-2 backdrop-blur-xl max-[720px]:h-14 sm:pr-safe-3 sm:pl-safe-3">
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
              onGettingStarted={onGettingStarted}
              themeMounted={themeMounted}
              isLightTheme={isLightTheme}
              themeToggleLabel={themeToggleLabel}
              onThemeChange={onThemeChange}
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
          <Button
            size="icon-lg"
            variant="muted-ghost"
            aria-label="Undo edit"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 aria-hidden="true" className="size-4.5" />
          </Button>
          <Button
            size="icon-lg"
            variant="muted-ghost"
            aria-label="Redo edit"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 aria-hidden="true" className="size-4.5" />
          </Button>
        </div>
        <div className="hidden items-center md:flex">
          <Button
            size="icon-lg"
            variant="muted-ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 className="size-4.5" />
          </Button>
          <Button
            size="icon-lg"
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
          size="icon-lg"
          variant="muted-ghost"
          aria-label="Getting started"
          title="Getting started"
          onClick={onGettingStarted}
          className="hidden min-[720px]:inline-flex"
        >
          <CircleHelp aria-hidden="true" className="size-4.5" />
        </Button>
        <Button
          size="icon-lg"
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
        {/* Same compact Export as ShapeShifter, inside a full-height tap area. */}
        <button
          type="button"
          aria-label="Export"
          onClick={onExportOpen}
          className="group grid h-11 shrink-0 place-items-center rounded-lg px-0.5 outline-none"
        >
          <span className="flex h-8 items-center rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground transition-[background-color,transform] group-hover:bg-primary/90 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background group-active:translate-y-px">
            Export
          </span>
        </button>
      </div>
      {projectStatus === "error" ? (
        <div
          role="alert"
          className="absolute top-popover-arrow right-3 flex max-w-(--spacing-timeline-popover) items-start gap-2 rounded-lg border border-destructive/35 bg-background/95 px-3 py-2 text-xs leading-5 text-foreground shadow-xl backdrop-blur-md"
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
