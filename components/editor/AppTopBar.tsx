"use client"

import {
  AlertTriangle,
  CircleDot,
  CircleHelp,
  Download,
  FileDown,
  FilePlus2,
  FolderOpen,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Sun,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onGuideOpen: () => void
  onExportOpen: () => void
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onGuideOpen,
  onExportOpen,
}: AppTopBarProps) {
  return (
    <div className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur-xl">
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
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                VectorForge
              </span>
              <span className="hidden text-[11px] tracking-[0.18em] text-muted-foreground uppercase sm:inline">
                3D Motion Studio
              </span>
            </div>
          </div>
        </div>
      </div>

      <div />

      <div className="flex items-center gap-1.5">
        <span
          aria-live="polite"
          title={projectStatusMessage}
          className={`hidden max-w-44 truncate px-2 text-xs xl:inline ${
            projectStatus === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {projectStatus === "restoring"
            ? "Restoring…"
            : projectStatus === "saving"
              ? "Saving locally…"
              : projectStatus === "error"
                ? "Autosave needs attention"
                : "Saved locally"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Start a new project"
          title="Start a new project"
          onClick={onProjectNew}
          className="h-9 min-w-9 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium"
        >
          <FilePlus2 className="size-3.5" />
          <span className="hidden lg:inline">New</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Open project"
          title="Open project"
          onClick={onProjectOpen}
          className="h-8 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium"
        >
          <FolderOpen className="size-3.5" />
          <span className="hidden lg:inline">Open</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Download project file"
          title="Download project file"
          onClick={onProjectSave}
          className="h-8 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium"
        >
          <FileDown className="size-3.5" />
          <span className="hidden lg:inline">Download</span>
        </Button>
        <div className="flex items-center rounded-lg border border-border bg-muted/35 p-0.5">
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
          className="h-8 gap-1.5 rounded-lg border border-border bg-muted/50 px-2 text-xs font-medium"
        >
          <CircleDot className="size-3.5" />
          Auto-key
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Open quick start"
          title="Quick start"
          onClick={onGuideOpen}
          className="size-8 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
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
          className="size-8 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isLightTheme ? (
            <Moon className="size-3.5" />
          ) : (
            <Sun className="size-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-lg bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onExportOpen}
        >
          <Download className="size-3.5" />
          Export
        </Button>
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
