"use client"

import React from "react"
import { ChevronDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { applyEasing, EasingType } from "../TimelineModel"
import type { TimelineMenuItem } from "./TimelineMenuModel"

export const EASING_OPTIONS: Array<{ value: EasingType; label: string }> = [
  { value: "linear", label: "Linear" },
  { value: "ease-in-out", label: "Smooth" },
  { value: "spring", label: "Spring" },
  { value: "bounce", label: "Bounce" },
]

export const getEasingLabel = (easing: EasingType) =>
  EASING_OPTIONS.find((option) => option.value === easing)?.label ?? easing

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
        aria-label={`${scopeLabel ?? "Easing"}: ${getEasingLabel(value)}`}
        title={`${scopeLabel ?? "Easing"}: ${getEasingLabel(value)}`}
        className={
          field
            ? "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md bg-muted/60 px-2 text-xs text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-muted"
            : `${showLabel ? "" : "timeline-easing"} flex shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none ${showLabel ? "min-h-11 w-full gap-2 px-3" : "size-5"}`
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
        align="end"
        side="top"
        sideOffset={6}
        className="w-40 p-1 text-foreground"
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
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
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

/** Inline easing choices with curve previews — no nested popover. */
export function EasingChoices({
  value,
  label,
  compact = false,
  onChange,
}: {
  value: EasingType
  label: string
  /** One tight row: curve and name side by side. */
  compact?: boolean
  onChange: (easing: EasingType) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-4 gap-0.5 rounded-lg bg-muted p-0.5"
    >
      {EASING_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          title={option.label}
          onClick={() => onChange(option.value)}
          className={`flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm ${compact ? "h-7 gap-1 text-[11px]" : "min-h-11 flex-col gap-0.5 text-[10px]"}`}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
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
      ))}
    </div>
  )
}
