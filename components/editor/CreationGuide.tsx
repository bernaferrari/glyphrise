"use client"

import { useState } from "react"
import { ArrowRight, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type GuideStep = {
  title: string
  copy: string
  action: string
  onAction: () => void
  secondary?: { label: string; onClick: () => void }
}

/**
 * Three steps to a first download: watch it move, make it yours, share it.
 * Each step names one thing to do; styling can be skipped, never a gate.
 */
export function CreationGuide({
  hasStyle,
  hasMotion,
  hasPreviewed,
  completed,
  onStyle,
  onAnimate,
  onPlay,
  onExport,
  onDismiss,
}: {
  hasStyle: boolean
  hasMotion: boolean
  hasPreviewed: boolean
  completed: boolean
  onStyle: () => void
  onAnimate: () => void
  onPlay: () => void
  onExport: () => void
  onDismiss: () => void
}) {
  const [styleSkipped, setStyleSkipped] = useState(false)
  const watched = hasMotion && hasPreviewed
  const styled = hasStyle || styleSkipped
  const index = completed ? 3 : !watched ? 0 : !styled ? 1 : 2

  const steps: GuideStep[] = [
    hasMotion
      ? {
          title: "Watch it move",
          copy: "It loops on its own. Press play to see it.",
          action: "Play",
          onAction: onPlay,
          secondary: { label: "Change motion", onClick: onAnimate },
        }
      : {
          title: "Give it motion",
          copy: "Pick Spin, Tilt or Pulse. You can fine-tune it on the timeline.",
          action: "Choose a motion",
          onAction: onAnimate,
          // A still logo is a fine result too.
          secondary: { label: "Export a still image", onClick: onExport },
        },
    {
      title: "Make it yours",
      copy: "Try another finish, colors or depth. It keeps moving while you edit.",
      action: "Style it",
      onAction: onStyle,
      secondary: { label: "Skip", onClick: () => setStyleSkipped(true) },
    },
    {
      title: "Share it",
      copy: "Download a video, a still image or a 3D model.",
      action: "Export",
      onAction: onExport,
    },
  ]
  const step: GuideStep =
    index === 3
      ? {
          title: "Downloaded",
          copy: "Find it in your downloads. This file keeps saving as you edit.",
          action: "Done",
          onAction: onDismiss,
        }
      : steps[index]

  return (
    <aside
      aria-label="Your first icon"
      className="absolute top-4 left-4 z-20 w-72 rounded-2xl bg-popover/95 p-4 text-popover-foreground shadow-lg ring-1 ring-border backdrop-blur-md max-[720px]:top-16 max-[720px]:right-3 max-[720px]:left-3 max-[720px]:w-auto max-[720px]:p-3.5"
    >
      <button
        type="button"
        aria-label="Dismiss creation guide"
        onClick={onDismiss}
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <div className="flex items-center gap-2 pr-8">
        <div aria-hidden="true" className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={
                dot < index
                  ? "h-1 w-5 rounded-full bg-primary"
                  : dot === index
                    ? "h-1 w-5 rounded-full bg-primary/45"
                    : "h-1 w-5 rounded-full bg-muted"
              }
            />
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {completed && <Check aria-hidden="true" className="size-3" />}
          {completed ? "All done" : `${index + 1} of 3`}
        </span>
      </div>
      <h2 className="mt-2.5 text-sm font-semibold">{step.title}</h2>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
        {step.copy}
      </p>
      <div className="mt-3 flex items-center gap-1">
        <Button
          autoFocus
          size="sm"
          shape="rounded"
          onClick={step.onAction}
          className="h-9"
        >
          {step.action}
          <ArrowRight aria-hidden="true" />
        </Button>
        {step.secondary && (
          <Button
            size="sm"
            variant="muted-ghost"
            onClick={step.secondary.onClick}
            className="h-9"
          >
            {step.secondary.label}
          </Button>
        )}
      </div>
    </aside>
  )
}
