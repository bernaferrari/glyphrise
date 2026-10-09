"use client"

import React from "react"
import { ChevronDown, FlipHorizontal2, Spline } from "lucide-react"
import { beginDocumentEdit, endDocumentEdit } from "@/lib/editor-transactions"
import { EasingCurve } from "./EasingCurve"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  applyEasing,
  cubicBezierEasing,
  easingPoints,
  type BezierPoints,
  type EasingType,
} from "../TimelineModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

export const EASING_OPTIONS: Array<{ value: EasingType; label: string }> = [
  { value: "linear", label: "Linear" },
  { value: "ease-in-out", label: "Smooth" },
  { value: "flow", label: "Flow" },
  { value: "spring", label: "Spring" },
  { value: "bounce", label: "Bounce" },
  { value: "hold", label: "Hold" },
]

export const getEasingLabel = (easing: EasingType) =>
  EASING_OPTIONS.find((option) => option.value === easing)?.label ?? "Custom"

export const easingCurvePath = (easing: EasingType): string => {
  const points: string[] = []
  for (let index = 0; index <= 14; index++) {
    const t = index / 14
    const value = applyEasing(easing, t)
    points.push(`${(t * 14 + 1).toFixed(1)},${(15 - value * 13).toFixed(1)}`)
  }
  return `M ${points.join(" L ")}`
}

export const easingMenuItems = (
  current: EasingType,
  onSelect: (easing: EasingType) => void
): TimelineMenuItem[] => [
  { type: "separator" },
  {
    type: "submenu",
    label: "Ease",
    shortcut: getEasingLabel(current),
    items: EASING_OPTIONS.map((option) => ({
      label: option.label,
      active: option.value === current,
      easing: option.value,
      onSelect: () => onSelect(option.value),
    })),
  },
]

export const EasingPicker: React.FC<{
  value: EasingType
  onChange: (easing: EasingType) => void
  color?: string
  showLabel?: boolean
  scopeLabel?: string
  /** "field": a labelled dropdown that sits in a form row. */
  variant?: "compact" | "field"
}> = ({
  value,
  onChange,
  color = "currentColor",
  scopeLabel,
  showLabel = false,
  variant = "compact",
}) => {
  const field = variant === "field"
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-timeline-easing={!field && !showLabel ? true : undefined}
        aria-label={`${scopeLabel ?? "Easing"}: ${getEasingLabel(value)}`}
        title={`${scopeLabel ?? "Easing"}: ${getEasingLabel(value)}`}
        className={
          field
            ? "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md bg-muted/60 px-2 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-muted"
            : `flex shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none ${showLabel ? "min-h-11 w-full gap-2 px-3" : "size-5 max-md:w-auto"}`
        }
        onClick={(event) => event.stopPropagation()}
      >
        <svg
          aria-hidden="true"
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d={easingCurvePath(value)}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={
            field
              ? "flex-1 truncate text-left"
              : showLabel
                ? "flex-1 text-left text-sm"
                : "hidden text-xs"
          }
        >
          {getEasingLabel(value)}
        </span>
        {(showLabel || field) && (
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground"
          />
        )}
      </PopoverTrigger>
      <PopoverContent
        tone="foreground"
        density="compact"
        align="end"
        side="top"
        sideOffset={6}
        className="w-40"
      >
        {EASING_OPTIONS.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0"
              >
                <path
                  d={easingCurvePath(option.value)}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {option.label}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

const CUSTOM = "custom"

const selectValue = (easing: EasingType) =>
  EASING_OPTIONS.some((option) => option.value === easing) ? easing : CUSTOM

const formatCurve = (points: BezierPoints) =>
  points.map((value) => Number(value.toFixed(3))).join(", ")

function EasingIcon({ easing }: { easing: EasingType }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
    >
      <path
        d={easingCurvePath(easing)}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The named easings as a native select with the current curve beside it. */
export function EasingSelect({
  value,
  label,
  onChange,
}: {
  value: EasingType
  label: string
  onChange: (easing: EasingType) => void
}) {
  const current = selectValue(value)
  return (
    <div className="relative">
      <EasingIcon easing={value} />
      <select
        value={current}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.value
          if (next === CUSTOM)
            onChange(
              cubicBezierEasing(easingPoints(value) ?? [0.45, 0, 0.55, 1])
            )
          else onChange(next as EasingType)
        }}
        className="h-8 w-full appearance-none rounded-md border border-transparent bg-secondary pr-7 pl-8 text-xs text-foreground outline-none hover:border-border focus:border-primary pointer-coarse:h-9"
      >
        {EASING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        <option value={CUSTOM}>Custom bézier</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/**
 * The easing of one motion segment, like Figma's easing panel: a preset
 * select, a curve whose handles can be dragged, and the bézier numbers.
 */
export function EasingEditor({
  value,
  label,
  onChange,
}: {
  value: EasingType
  label: string
  onChange: (easing: EasingType) => void
}) {
  const points = easingPoints(value)
  const updateCurve = (next: BezierPoints) => {
    const easing = cubicBezierEasing(next)
    if (easing !== value) onChange(easing)
  }
  return (
    <div className="grid gap-2">
      <EasingSelect value={value} label={label} onChange={onChange} />
      <div className="grid place-items-center rounded-lg bg-secondary/60 py-3 text-foreground">
        <EasingCurve
          easing={value}
          onChange={updateCurve}
          onEditStart={beginDocumentEdit}
          onEditEnd={() => endDocumentEdit()}
          onEditCancel={() => endDocumentEdit(true)}
        />
      </div>
      {points ? (
        <div className="flex items-start gap-1">
          <CurveInput
            ariaLabel={`${label} curve`}
            points={points}
            onCommit={updateCurve}
          />
          <button
            type="button"
            onClick={() =>
              updateCurve([
                1 - points[2],
                1 - points[3],
                1 - points[0],
                1 - points[1],
              ])
            }
            aria-label="Flip curve"
            title="Flip curve"
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FlipHorizontal2 className="size-4" />
          </button>
        </div>
      ) : (
        <p className="px-1 text-xs text-muted-foreground">
          Choose Custom bézier to shape this curve by hand.
        </p>
      )}
    </div>
  )
}

/** The bézier numbers as one field, validated on Enter or when leaving it. */
function CurveInput({
  ariaLabel,
  points,
  onCommit,
}: {
  ariaLabel: string
  points: BezierPoints
  onCommit: (points: BezierPoints) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const commit = () => {
    if (draft == null) return
    const numbers = draft
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    if (numbers.length !== 4 || !numbers.every(Number.isFinite))
      return setError("Use four numbers, like 0.4, 0, 0.2, 1.")
    if (numbers[0] < 0 || numbers[0] > 1 || numbers[2] < 0 || numbers[2] > 1)
      return setError("The 1st and 3rd numbers must be between 0 and 1.")
    setError(null)
    setDraft(null)
    onCommit(numbers as BezierPoints)
  }
  return (
    <div className="min-w-0 flex-1">
      <div className="relative">
        <Spline className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          value={draft ?? formatCurve(points)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit()
            if (event.key === "Escape") {
              setDraft(null)
              setError(null)
            }
          }}
          className="h-8 w-full rounded-md border border-transparent bg-secondary pr-2 pl-7 text-xs text-foreground tabular-nums outline-none hover:border-border focus:border-primary aria-invalid:border-destructive"
        />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-2xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
