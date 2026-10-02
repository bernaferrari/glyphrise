"use client"

import { useEffect, useMemo, useState } from "react"
import type { ShapeStop } from "../TimelineModel"
import { cn } from "@/lib/utils"
import type { ShapeOption } from "./TimelineTypes"

export function ShapePresetGrid({
  stop,
  visibleShapeOptions,
  className,
  onShapeIconChange,
  onOpenShapePicker,
}: {
  stop: ShapeStop
  visibleShapeOptions: ShapeOption[]
  className?: string
  onShapeIconChange: (id: string, option: ShapeOption) => void
  onOpenShapePicker: (id: string | null) => void
}) {
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          visibleShapeOptions
            .map((option) => option.category)
            .filter((category): category is string => Boolean(category))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [visibleShapeOptions]
  )
  const [activeCategory, setActiveCategory] = useState<string>("All")
  useEffect(() => {
    if (activeCategory !== "All" && !categories.includes(activeCategory)) {
      setActiveCategory("All")
    }
  }, [activeCategory, categories])
  const filteredOptions =
    activeCategory === "All"
      ? visibleShapeOptions
      : visibleShapeOptions.filter(
          (option) => option.category === activeCategory
        )

  if (visibleShapeOptions.length === 0) return null

  return (
    <div className="min-h-0">
      {categories.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["All", ...categories].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-7 rounded-md border px-2 text-[11px] transition-colors ${
                activeCategory === category
                  ? "border-ring/50 bg-accent text-foreground"
                  : "border-border bg-muted/35 text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          "editor-scrollbar grid max-h-72 grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 overflow-y-auto pr-1",
          className
        )}
      >
        {filteredOptions.map((option) => {
          const active = stop.iconId === option.id
          return (
            <button
              key={`pick-${stop.id}-${option.id}`}
              type="button"
              aria-label={`Choose ${option.name}${active ? ", selected" : ""}`}
              aria-pressed={active}
              title={option.name}
              onClick={() => {
                onShapeIconChange(stop.id, option)
                onOpenShapePicker(null)
              }}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ${
                active
                  ? "bg-accent"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60"
              }`}
              style={active ? { borderColor: option.defaultTint } : undefined}
            >
              <div
                className="size-[18px] [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-current [&_svg]:stroke-current"
                style={{ color: option.defaultTint }}
                dangerouslySetInnerHTML={{ __html: option.svgContent }}
              />
              <span className="text-center text-xs font-medium text-foreground">
                {option.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
