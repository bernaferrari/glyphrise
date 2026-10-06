"use client"

import { ArrowRight, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const step = completed
    ? {
        title: "Your icon is ready.",
        copy: "Find it in your downloads. Keep creating whenever inspiration strikes.",
        action: "Keep editing",
        onClick: onDismiss,
      }
    : hasMotion
      ? hasPreviewed
        ? {
            title: "Ready to share.",
            copy: "Download a video of your motion or an image of this moment.",
            action: "Export your icon",
            onClick: onExport,
          }
        : {
            title: "It already moves.",
            copy: "Give it a play, then make it yours with a finish or a different motion.",
            action: "Play your motion",
            onClick: onPlay,
          }
      : {
          title: hasStyle ? "Now, bring it to life." : "Make it yours.",
          copy: hasStyle
            ? "Add motion, or download your finished look as a still image."
            : "Try a finish, or jump straight into Spin, Tilt, and Pulse.",
          action: "Choose a motion",
          onClick: onAnimate,
        }
  // Move, preview, export: where this icon is on the way to a download.
  const progress = completed ? 3 : hasPreviewed ? 2 : hasMotion ? 1 : 0
  const secondary = [
    !completed && !hasPreviewed && { label: "Style icon", onClick: onStyle },
    hasMotion &&
      !hasPreviewed &&
      !completed && { label: "Change motion", onClick: onAnimate },
    !hasMotion &&
      !completed && { label: "Export a still image", onClick: onExport },
  ].filter((item): item is { label: string; onClick: () => void } =>
    Boolean(item)
  )
  return (
    <aside
      aria-label="Your first icon"
      className="absolute top-4 left-4 z-20 w-(--spacing-creation-guide) rounded-2xl bg-popover/95 p-4 text-popover-foreground shadow-dialog ring-1 ring-border backdrop-blur-md max-[720px]:top-3 max-[720px]:left-3 max-[720px]:p-3.5"
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
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={
                index < progress
                  ? "h-1 w-5 rounded-full bg-primary"
                  : "h-1 w-5 rounded-full bg-muted"
              }
            />
          ))}
        </div>
        <span className="flex items-center gap-1 text-2xs text-muted-foreground">
          {completed && <Check aria-hidden="true" className="size-3" />}
          {completed ? "Done" : `Step ${progress + 1} of 3`}
        </span>
      </div>
      <h2 className="mt-3 text-sm font-semibold">{step.title}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {step.copy}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1">
        <Button
          autoFocus
          size="sm"
          shape="rounded"
          onClick={step.onClick}
          className="h-9"
        >
          {step.action}
          <ArrowRight aria-hidden="true" />
        </Button>
        {secondary.map((item) => (
          <Button
            key={item.label}
            size="sm"
            variant="muted-ghost"
            onClick={item.onClick}
            className="h-9"
          >
            {item.label}
          </Button>
        ))}
      </div>
    </aside>
  )
}
