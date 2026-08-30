"use client"

import { useEffect, useRef } from "react"
import {
  Check,
  Download,
  Play,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type QuickStartGuideProps = {
  open: boolean
  onChooseIcon: () => void
  onStyle: () => void
  onMotion: () => void
  onPlayExample: () => void
  onExport: () => void
  completedStepIds: string[]
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
    id: "icon",
    icon: Shapes,
    label: "Icon",
    title: "Choose your icon",
    description: "Pick a Material Symbol, preset, wipe pair, or your own SVG.",
    actionLabel: "Choose icon",
  },
  {
    id: "style",
    icon: SlidersHorizontal,
    label: "Style",
    title: "Give it a finish",
    description: "Start with a look, then tune its fill, depth, and light.",
    actionLabel: "Open style controls",
  },
  {
    id: "motion",
    icon: Waypoints,
    label: "Motion",
    title: "Add an animated property",
    description: "Choose a property, add keyframes, then preview the result.",
    actionLabel: "Open timeline",
  },
  {
    id: "export",
    icon: Download,
    label: "Export",
    title: "Hand off your motion",
    description:
      "Download the icon as GLB, render motion as WebM, or copy starter code.",
    actionLabel: "Open export",
  },
] as const

export function QuickStartGuide({
  open,
  onChooseIcon,
  onStyle,
  onMotion,
  onPlayExample,
  onExport,
  completedStepIds,
  templates,
  onTemplateChoose,
  onDismiss,
}: QuickStartGuideProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (open) titleRef.current?.focus()
  }, [open])

  if (!open) return null
  const completed = new Set(completedStepIds)
  const completedCount = GUIDE_STEPS.filter((step) =>
    completed.has(step.id)
  ).length
  const currentStep =
    GUIDE_STEPS.find((step) => !completed.has(step.id)) ?? null
  const hasMotion = completed.has("motion")
  const actions = {
    icon: onChooseIcon,
    style: onStyle,
    motion: onMotion,
    export: onExport,
  }

  return (
    <aside
      aria-labelledby="quick-start-title"
      className="quick-start-guide absolute top-3 left-3 z-30 flex max-h-[calc(100%-24px)] w-[min(336px,calc(100%-24px))] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-2xl border border-white/12 bg-black/84 p-3.5 text-white shadow-xl backdrop-blur-xl sm:max-w-[336px]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            ref={titleRef}
            id="quick-start-title"
            tabIndex={-1}
            className="text-sm font-semibold tracking-tight text-balance outline-none"
          >
            Build your first 3D motion
          </h2>
          <p className="mt-0.5 text-[12px] leading-5 text-white/65">
            {completedCount === 0
              ? "4 steps to your first 3D motion"
              : `${completedCount}/4 project ingredients ready`}
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss quick start"
          title="Dismiss quick start"
          onClick={onDismiss}
          className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-lg text-white/70 transition-[background-color,color,transform] duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-[0.96]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="Quick-start progress"
        aria-valuemin={0}
        aria-valuemax={GUIDE_STEPS.length}
        aria-valuenow={completedCount}
        className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full w-full origin-left rounded-full bg-white transition-transform duration-200 ease-out"
          style={{
            transform: `scaleX(${completedCount / GUIDE_STEPS.length})`,
          }}
        />
      </div>

      <ol className="mt-3 grid grid-cols-4 gap-1.5">
        {GUIDE_STEPS.map((step, index) => {
          const Icon = step.icon
          const isComplete = completed.has(step.id)
          const isCurrent = step.id === currentStep?.id
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-label={`${index + 1}. ${step.title}${isComplete ? ", ready" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
                title={step.title}
                onClick={actions[step.id]}
                className={cn(
                  "flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-medium transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-[0.96]",
                  isCurrent
                    ? "border-white/25 bg-white/14 text-white"
                    : "border-white/8 bg-white/[0.045] text-white/58 hover:bg-white/10 hover:text-white",
                  isComplete && "text-emerald-200"
                )}
              >
                {isComplete ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span>{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="editor-scrollbar mt-3 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.055] p-3">
        {currentStep ? (
          <>
            <div className="text-[11px] font-semibold tracking-[0.12em] text-white/65 uppercase">
              Next step
            </div>
            <h3 className="mt-1 text-[13px] font-semibold text-white">
              {currentStep.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-white/65">
              {currentStep.description}
            </p>

            {currentStep.id === "style" ? (
              <div className="mt-2 grid gap-1.5">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateChoose(template.id)}
                    className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-white/20 hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70 active:scale-[0.99]"
                  >
                    <span aria-hidden="true" className="w-4 text-center">
                      {template.emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-white/90">
                        {template.name}
                      </span>
                      <span className="block truncate text-[11px] text-white/60">
                        {template.description}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onStyle}
                  className="min-h-10 rounded-lg text-xs font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70"
                >
                  Open style controls instead
                </button>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={actions[currentStep.id]}
                className="mt-3 h-10 w-full rounded-lg bg-white text-xs font-semibold text-black hover:bg-white/90"
              >
                <currentStep.icon className="size-3.5" />
                {currentStep.actionLabel}
              </Button>
            )}
          </>
        ) : (
          <div className="py-1 text-center">
            <Check className="mx-auto size-5 text-emerald-300" />
            <h3 className="mt-2 text-[13px] font-semibold">
              Your first motion is ready
            </h3>
            <p className="mt-1 text-xs leading-5 text-white/65">
              Keep refining it, or dismiss this guide and use the full studio.
            </p>
          </div>
        )}
      </div>

      {hasMotion ? (
        <button
          type="button"
          onClick={onPlayExample}
          className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-lg text-xs font-medium text-white/75 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/70"
        >
          <Play className="size-3.5 fill-current" />
          Preview current motion
        </button>
      ) : null}
    </aside>
  )
}
