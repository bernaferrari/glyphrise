"use client"

import type { MaterialPresetId } from "../3d/MaterialPresets"
import { MATERIAL_METADATA, MATERIAL_PREVIEW } from "./FinishRegistry"
import { usePropertyEditScope } from "./PropertyEditScope"

const QUICK_FINISHES: MaterialPresetId[] = [
  "satin",
  "glass",
  "chrome",
  "pearl",
  "ink",
  "neon",
]

export function FinishPresetStrip({
  value,
  onChange,
}: {
  value: MaterialPresetId
  onChange: (value: MaterialPresetId) => void
}) {
  const needsKeyframe = usePropertyEditScope("Finish")?.kind === "animated"
  return (
    <div className="grid grid-cols-6 gap-1" aria-label="Popular finishes">
      {QUICK_FINISHES.map((preset) => (
        <button
          key={preset}
          type="button"
          disabled={needsKeyframe}
          aria-label={`Use ${MATERIAL_METADATA[preset].name} finish`}
          aria-pressed={value === preset}
          onClick={() => onChange(preset)}
          className="flex min-h-18 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-transparent px-0.5 text-[11px] font-medium text-muted-foreground transition-[background-color,border-color,color] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:text-muted-foreground/50 aria-pressed:border-border aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          <span
            aria-hidden="true"
            className="size-7 rounded-full shadow-[inset_0_1px_2px_rgb(255_255_255/50%),inset_0_-2px_3px_rgb(0_0_0/20%)]"
            style={{ background: MATERIAL_PREVIEW[preset] }}
          />
          {MATERIAL_METADATA[preset].name}
        </button>
      ))}
    </div>
  )
}
