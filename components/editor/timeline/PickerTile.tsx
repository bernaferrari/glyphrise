"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** One grid for every picker tab, so symbols, wipe pairs and presets line up. */
export const PICKER_GRID_CLASS = "grid grid-cols-picker content-start gap-1"

/** "calendar_month" → "Calendar Month", matching preset and wipe pair names. */
export const symbolLabel = (name: string) =>
  name
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")

/** The shared picker tile: the icon on a soft square, up to two lines of name underneath. */
export function PickerTile({
  label,
  ariaLabel,
  title,
  selected = false,
  className,
  onClick,
  children,
}: {
  label: string
  ariaLabel?: string
  title?: string
  selected?: boolean
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={ariaLabel ?? label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group/tile flex w-full min-w-0 flex-col items-center gap-1.5 rounded-xl p-1.5 pb-2 text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        className
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-muted/60 ring-1 ring-transparent transition-[background-color,box-shadow,color] group-hover/tile:bg-muted group-aria-pressed/tile:bg-primary/15 group-aria-pressed/tile:text-primary group-aria-pressed/tile:ring-primary/60">
        {children}
      </span>
      <span className="line-clamp-2 h-7 w-full text-center text-2xs leading-tight text-balance text-muted-foreground transition-colors group-hover/tile:text-foreground group-aria-pressed/tile:font-medium group-aria-pressed/tile:text-foreground">
        {label}
      </span>
    </button>
  )
}
