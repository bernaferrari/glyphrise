"use client"

import type { MaterialPresetId } from "../3d/MaterialPresets"
import { FinishPresetPicker } from "./FinishPresetPicker"
import { MATERIAL_METADATA, MATERIAL_PREVIEW } from "./FinishRegistry"

const QUICK_FINISHES: MaterialPresetId[] = [
  "satin",
  "glass",
  "chrome",
  "pearl",
  "neon",
]

/** The selected finish always has a swatch: it takes the last slot if needed. */
function visibleFinishes(value: MaterialPresetId) {
  return QUICK_FINISHES.includes(value)
    ? QUICK_FINISHES
    : [...QUICK_FINISHES.slice(0, -1), value]
}

export function FinishPresetStrip({
  value,
  onChange,
}: {
  value: MaterialPresetId
  onChange: (value: MaterialPresetId) => void
}) {
  return (
    <div
      className="grid grid-cols-6 gap-1 py-0.5"
      aria-label="Popular finishes"
    >
      {visibleFinishes(value).map((preset) => (
        <button
          key={preset}
          type="button"
          aria-label={`Use ${MATERIAL_METADATA[preset].name} finish`}
          aria-pressed={value === preset}
          title={MATERIAL_METADATA[preset].name}
          onClick={() => onChange(preset)}
          className="grid size-9 place-items-center justify-self-center rounded-full ring-1 ring-transparent transition-[box-shadow,transform] duration-150 hover:ring-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 aria-pressed:ring-2 aria-pressed:ring-foreground/80"
        >
          <span
            aria-hidden="true"
            className="size-7 rounded-full border border-foreground/15 shadow-[inset_0_1px_2px_rgb(255_255_255/50%),inset_0_-2px_3px_rgb(0_0_0/20%)]"
            style={{ background: MATERIAL_PREVIEW[preset] }}
          />
        </button>
      ))}
      <FinishPresetPicker value={value} onChange={onChange} />
    </div>
  )
}
