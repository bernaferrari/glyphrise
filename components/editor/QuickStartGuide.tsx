"use client"

import { X } from "lucide-react"

export type QuickStartGuideProps = {
  open: boolean
  onChooseIcon: () => void
  onStyle: () => void
  onMotion: () => void
  onPlayExample: () => void
  onExport: () => void
  completedStepIds: string[]
  hasPreviewed?: boolean
  templates: Array<{
    id: string
    name: string
    description: string
    emoji: string
  }>
  onTemplateChoose: (id: string) => void
  onDismiss: () => void
}

export function QuickStartGuide({
  open,
  completedStepIds,
  hasPreviewed,
  onChooseIcon,
  onStyle,
  onMotion,
  onPlayExample,
  onExport,
  onDismiss,
}: QuickStartGuideProps) {
  if (!open) return null
  const done = new Set(completedStepIds)
  const step = done.has("motion")
    ? hasPreviewed
      ? {
          text: "Ready to share? Export a still image or the full motion.",
          action: "Export motion",
          onClick: onExport,
        }
      : {
          text: "Your motion is applied. Press Play to see it in the preview.",
          action: "Play preview",
          onClick: onPlayExample,
        }
    : done.has("style")
      ? {
          text: "Choose Spin, Tilt, or Pulse. No keyframes needed to get started.",
          action: "Choose a motion",
          onClick: onMotion,
        }
      : done.has("icon")
        ? {
            text: "Try a finish or adjust the depth in Style.",
            action: "Open style",
            onClick: onStyle,
          }
        : {
            text: "Start with an icon you want to animate.",
            action: "Choose icon",
            onClick: onChooseIcon,
          }
  return (
    <aside
      aria-label="Quick start"
      className="flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs"
    >
      <p className="min-w-0 flex-1 text-muted-foreground">
        {done.has("export")
          ? "Your first export is ready. Keep refining, or start another icon."
          : step.text}
      </p>
      {!done.has("export") && (
        <button
          type="button"
          onClick={step.onClick}
          className="min-h-9 shrink-0 rounded-lg bg-foreground px-3 font-medium text-background pointer-coarse:min-h-11"
        >
          {step.action}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss quick start"
        title="Dismiss quick start"
        onClick={onDismiss}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted pointer-coarse:size-11"
      >
        <X className="size-4" />
      </button>
    </aside>
  )
}
