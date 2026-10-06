"use client"

import type { ShapeStop } from "../TimelineModel"
import { cn } from "@/lib/utils"
import { PICKER_GRID_CLASS, PickerTile } from "./PickerTile"
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
  if (visibleShapeOptions.length === 0) return null

  return (
    <div
      className={cn(
        PICKER_GRID_CLASS,
        "editor-scrollbar max-h-80 overflow-y-auto pr-1",
        className
      )}
    >
      {visibleShapeOptions.map((option) => {
        const active = stop.iconId === option.id
        return (
          <PickerTile
            key={`pick-${stop.id}-${option.id}`}
            label={option.name}
            ariaLabel={`Choose ${option.name}${active ? ", selected" : ""}`}
            selected={active}
            onClick={() => {
              onShapeIconChange(stop.id, option)
              onOpenShapePicker(null)
            }}
          >
            <span
              aria-hidden="true"
              className="size-5.5 [&_svg]:size-full [&_svg]:fill-current"
              dangerouslySetInnerHTML={{ __html: option.svgContent }}
            />
          </PickerTile>
        )
      })}
    </div>
  )
}
