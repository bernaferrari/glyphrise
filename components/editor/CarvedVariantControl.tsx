"use client"

import { cn } from "@/lib/utils"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import { CARVED_VARIANTS } from "./FinishRegistry"

/** Carved finishes share one look; the variant picks the bevel profile. */
export function CarvedVariantControl({
  value,
  onChange,
  className,
}: {
  value: MaterialPresetId
  onChange: (preset: MaterialPresetId) => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Carved bevel"
      className={cn(
        "grid grid-cols-4 gap-0.5 rounded-lg bg-muted/70 p-0.5",
        className
      )}
    >
      {CARVED_VARIANTS.map((variant) => (
        <button
          key={variant.id}
          type="button"
          role="radio"
          aria-checked={value === variant.id}
          onClick={() => onChange(variant.id)}
          className="h-6 rounded-md text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm"
        >
          {variant.label}
        </button>
      ))}
    </div>
  )
}
