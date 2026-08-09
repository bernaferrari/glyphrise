"use client"

import {
  Download,
  Play,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type QuickStartGuideProps = {
  open: boolean
  onChooseIcon: () => void
  onPlayExample: () => void
  templates: Array<{
    id: string
    name: string
    description: string
    emoji: string
  }>
  onTemplateChoose: (id: string) => void
  onDismiss: () => void
}

const GUIDE_STEPS = [
  {
    icon: Shapes,
    title: "Choose an icon",
    description: "Pick a symbol, wipe pair, preset, or upload an SVG.",
  },
  {
    icon: SlidersHorizontal,
    title: "Style it",
    description: "Tune the fill, finish, depth, transform, and light.",
  },
  {
    icon: Waypoints,
    title: "Add motion",
    description: "Use timeline diamonds to keyframe a property.",
  },
  {
    icon: Download,
    title: "Export",
    description: "Hand off a GLB, WebM, React, or Android result.",
  },
] as const

export function QuickStartGuide({
  open,
  onChooseIcon,
  onPlayExample,
  templates,
  onTemplateChoose,
  onDismiss,
}: QuickStartGuideProps) {
  if (!open) return null

  return (
    <aside
      aria-label="Quick start"
      className="absolute top-3 left-3 z-20 w-[min(356px,calc(100%-24px))] rounded-2xl border border-white/12 bg-black/82 p-3.5 text-white shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">
            Make your first motion
          </h2>
          <p className="mt-0.5 text-[12px] leading-5 text-white/62">
            Start with the example or make it yours in four small steps.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss quick start"
          title="Dismiss quick start"
          onClick={onDismiss}
          className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>

      <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {GUIDE_STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li
              key={step.title}
              className="flex min-w-0 gap-2.5 rounded-xl bg-white/[0.055] p-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/8 text-white/70">
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white/92">
                  {index + 1}. {step.title}
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-white/50">
                  {step.description}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-semibold tracking-[0.1em] text-white/65 uppercase">
          Or start with a style
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              title={template.description}
              onClick={() => onTemplateChoose(template.id)}
              className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/6 px-2 text-left text-[11px] font-medium text-white/80 transition-colors duration-150 hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60 active:scale-[0.98]"
            >
              <span aria-hidden="true">{template.emoji}</span>
              <span className="truncate">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onChooseIcon}
          className="h-9 flex-1 rounded-lg bg-white text-[12px] text-black hover:bg-white/90"
        >
          <Shapes className="size-3.5" />
          Choose icon
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onPlayExample}
          className="h-9 rounded-lg border border-white/12 bg-white/6 px-3 text-[12px] text-white hover:bg-white/12 hover:text-white"
        >
          <Play className="size-3.5 fill-current" />
          Play example
        </Button>
      </div>
    </aside>
  )
}
