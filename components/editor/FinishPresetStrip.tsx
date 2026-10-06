"use client"

import type { FinishPreviewFill } from "../3d/FinishThumbnails"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import { FinishPresetPicker } from "./FinishPresetPicker"
import { QUICK_FINISHES, finishLabel, finishTile } from "./FinishRegistry"
import {
  FinishSwatch,
  useFinishThumbnails,
  useFinishThumbnailVisibility,
} from "./FinishSwatch"

/** The selected finish always has a swatch: it takes the last slot if needed. */
function visibleFinishes(value: MaterialPresetId) {
  return QUICK_FINISHES.includes(finishTile(value))
    ? QUICK_FINISHES
    : [...QUICK_FINISHES.slice(0, -1), value]
}

export function FinishPresetStrip({
  value,
  fill,
  onChange,
}: {
  value: MaterialPresetId
  fill: FinishPreviewFill
  onChange: (value: MaterialPresetId) => void
}) {
  const finishes = visibleFinishes(value)
  const { ref, visible } = useFinishThumbnailVisibility()
  const thumbnails = useFinishThumbnails(finishes, fill, visible)

  return (
    <div
      ref={ref}
      className="grid grid-cols-6 gap-0.5 py-0.5"
      aria-label="Popular finishes"
    >
      {finishes.map((preset) => (
        <button
          key={preset}
          type="button"
          aria-label={`Use ${finishLabel(preset)} finish`}
          aria-pressed={value === preset}
          title={finishLabel(preset)}
          onClick={() => onChange(preset)}
          className="group grid size-10 place-items-center justify-self-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          {/* The ring hugs the swatch even when touch widens the button. */}
          <span className="grid size-10 place-items-center rounded-full ring-1 ring-transparent transition-[box-shadow,transform] duration-150 group-hover:ring-foreground/20 group-active:scale-95 group-aria-pressed:ring-(length:--editor-ring-width) group-aria-pressed:ring-foreground/60">
            <FinishSwatch
              preset={preset}
              thumbnail={thumbnails[preset]}
              className="size-8.5 transition-transform duration-150 group-hover:scale-105"
            />
          </span>
        </button>
      ))}
      <FinishPresetPicker
        value={value}
        fill={fill}
        onChange={onChange}
        thumbnailsVisible={visible}
      />
    </div>
  )
}
