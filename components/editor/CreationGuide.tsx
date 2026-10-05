"use client"

import { ArrowRight, Check, X } from "lucide-react"

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
            title: "Give it a play.",
            copy: "See your motion in the preview before you download it.",
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
  return (
    <aside
      aria-label="Your first icon"
      className="absolute top-4 left-4 z-20 w-[min(300px,calc(100%-32px))] rounded-2xl border border-white/15 bg-black/75 p-4 text-white shadow-lg backdrop-blur-md max-[720px]:top-3 max-[720px]:left-3 max-[720px]:p-3"
    >
      <button
        type="button"
        aria-label="Dismiss creation guide"
        onClick={onDismiss}
        className="absolute top-1 right-1 grid size-11 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <span className="flex items-center gap-1.5 pr-6 text-[11px] text-white/60">
        {completed && <Check aria-hidden="true" className="size-3" />}Your first
        icon ·{" "}
        {completed
          ? "Done"
          : hasMotion
            ? hasPreviewed
              ? "3 of 3"
              : "2 of 3"
            : "1 of 3"}
      </span>
      <h2 className="mt-2 text-sm font-semibold max-[720px]:mt-1">
        {step.title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-white/70 max-[720px]:leading-4">
        {step.copy}
      </p>
      <div className="mt-2 flex items-center gap-2 max-[720px]:mt-1">
        <button
          type="button"
          autoFocus
          onClick={step.onClick}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium text-black hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {step.action}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </button>
        {!hasMotion && !completed && (
          <button
            type="button"
            onClick={onStyle}
            className="min-h-11 rounded-lg px-2 text-xs text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            Style icon
          </button>
        )}
      </div>
      {!hasMotion && !completed && (
        <button
          type="button"
          onClick={onExport}
          className="mt-1 min-h-11 rounded-lg px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          Export a still image
        </button>
      )}
    </aside>
  )
}
