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
  MoreHorizontal,
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
 * File actions and save details live beside the name. Workspace actions stay
 * together on the right on every screen size.
 */
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
      </PopoverContent>
    </Popover>
  )
}

const MENU_ROW_CLASS =
  "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"

function WorkspaceMenu({
  zenMode,
  onZenModeChange,
  onGettingStarted,
  themeMounted,
  isLightTheme,
  themeToggleLabel,
  onThemeChange,
}: Pick<
  AppTopBarProps,
  | "zenMode"
  | "onZenModeChange"
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
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="More options"
        title="More options"
        render={<Button size="icon" variant="muted-ghost" />}
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent density="compact" align="end" className="w-52">
        <MenuRow
          label={themeToggleLabel}
          accessibleLabel={themeToggleLabel}
          Icon={isLightTheme ? Moon : Sun}
          onClick={action(() => {
            if (themeMounted) onThemeChange(isLightTheme ? "dark" : "light")
          })}
        />
        <MenuRow
          label="Getting started"
          accessibleLabel="Getting started"
          Icon={CircleHelp}
          onClick={action(onGettingStarted)}
        />
        <a
          aria-label="GitHub repository"
          title="GitHub"
          href="https://github.com/bernaferrari/glyphrise"
          target="_blank"
          rel="noopener noreferrer"
          className={MENU_ROW_CLASS}
          onClick={() => setOpen(false)}
        >
          {/* GitHub mark from Primer Octicons (MIT). */}
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 fill-current"
          >
            <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
          </svg>
          <span>GitHub</span>
        </a>
        <div className="hidden min-[720px]:block">
          <div className="-mx-1 my-1 border-t border-border" />
          <MenuRow
            label={zenMode ? "Show panels" : "Hide panels"}
            accessibleLabel={zenMode ? "Show panels" : "Hide panels"}
            Icon={zenMode ? PanelLeftOpen : PanelLeftClose}
            onClick={action(() => onZenModeChange(!zenMode))}
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
      className={MENU_ROW_CLASS}
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
      className="relative z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 pr-safe-2 pl-safe-2 backdrop-blur-xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <ProjectMenu
          onProjectNew={onProjectNew}
          onProjectOpen={onProjectOpen}
          onProjectSave={onProjectSave}
          projectStatus={projectStatus}
          projectStatusMessage={projectStatusMessage}
        />
        <div className="min-w-0 flex-1 min-[720px]:flex-none">
          <ProjectNameField
            value={projectName}
            onCommit={onProjectNameChange}
          />
        </div>
        <span aria-live="polite" className="sr-only">
          {projectStatusLabel}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex shrink-0 items-center md:hidden">
          <Button
            size="icon"
            variant="muted-ghost"
            aria-label="Undo edit"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 aria-hidden="true" className="size-4" />
          </Button>
          <Button
            size="icon"
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
            size="icon"
            variant="muted-ghost"
            aria-label="Undo"
            title="Undo (Ctrl/⌘ Z)"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo2 aria-hidden="true" className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="muted-ghost"
            aria-label="Redo"
            title="Redo (Ctrl/⌘ Shift Z)"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <WorkspaceMenu
          zenMode={zenMode}
          onZenModeChange={onZenModeChange}
          onGettingStarted={onGettingStarted}
          themeMounted={themeMounted}
          isLightTheme={isLightTheme}
          themeToggleLabel={themeToggleLabel}
          onThemeChange={onThemeChange}
        />
        <Button
          size="default"
          aria-label="Export"
          onClick={onExportOpen}
          className="ml-1"
        >
          Export
        </Button>
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
