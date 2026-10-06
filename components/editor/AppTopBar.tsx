"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  Box,
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
            title="Glyphrise · Files"
            className="flex h-8 shrink-0 items-center gap-1 rounded-md pr-1.5 pl-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
          />
        }
      >
        <span
          aria-hidden="true"
          className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground"
        >
          <Box className="size-3.5" />
        </span>
        <ChevronDown aria-hidden="true" className="size-3" />
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
              <LoaderCircle className="size-3.5 animate-spin" />
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
        <div className="min-[720px]:hidden">
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
    <header
      aria-label="Editor toolbar"
      className="relative z-30 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 pr-safe-2 pl-safe-2 backdrop-blur-xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
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
        <div className="min-w-0 flex-1 min-[720px]:flex-none">
          <ProjectNameField
            value={projectName}
            onCommit={onProjectNameChange}
          />
        </div>
        <span
          aria-live="polite"
          title={projectStatusMessage}
          className={
            projectStatus === "saved"
              ? "sr-only"
              : `flex shrink-0 items-center gap-1.5 px-1 text-xs whitespace-nowrap ${projectStatus === "error" ? "text-destructive" : "text-muted-foreground/80"}`
          }
        >
          <span className="sr-only">{projectStatusLabel}</span>
          {projectStatus === "restoring" || projectStatus === "saving" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin"
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
        <span
          aria-hidden="true"
          className="mx-1 hidden h-4 w-px bg-border min-[720px]:block"
        />
        <Button
          size="icon-sm"
          variant="muted-ghost"
          aria-label={zenMode ? "Show panels" : "Hide panels"}
          title={zenMode ? "Show panels" : "Hide panels"}
          onClick={() => onZenModeChange(!zenMode)}
          className="hidden min-[720px]:inline-flex"
        >
          {zenMode ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
        <div className="flex shrink-0 items-center md:hidden">
          <Button
            size="icon-sm"
            variant="muted-ghost"
            aria-label="Undo edit"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 aria-hidden="true" className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="muted-ghost"
            aria-label="Redo edit"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="hidden shrink-0 items-center md:flex">
          <Button
            size="icon-sm"
            variant="muted-ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 aria-hidden="true" className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="muted-ghost"
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <Button
          size="icon-sm"
          variant="muted-ghost"
          aria-label="Getting started"
          title="Getting started"
          onClick={onGettingStarted}
          className="hidden min-[720px]:inline-flex"
        >
          <CircleHelp aria-hidden="true" className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="muted-ghost"
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          onClick={() => {
            if (themeMounted) onThemeChange(isLightTheme ? "dark" : "light")
          }}
          className="hidden min-[720px]:inline-flex"
        >
          {isLightTheme ? (
            <Moon aria-hidden="true" className="size-4" />
          ) : (
            <Sun aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
      <Button size="sm" aria-label="Export" onClick={onExportOpen}>
        Export
      </Button>
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
