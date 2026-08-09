"use client"

import { useRef } from "react"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import {
  FINISH_PRESETS,
  MATERIAL_METADATA,
  MATERIAL_PREVIEW,
} from "./FinishRegistry"

type FinishPresetPickerProps = {
  value: MaterialPresetId
  onChange: (preset: MaterialPresetId) => void
}

// Swatch row only — the "Finish" label is supplied by the enclosing InspectorRow.
export function FinishPresetPicker({
  value,
  onChange,
}: FinishPresetPickerProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedName = MATERIAL_METADATA[value].name

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-1.5">
      <span className="rounded-md bg-foreground/[0.055] px-2 py-1 text-[11px] font-medium text-foreground">
        {selectedName}
      </span>
      <div
        role="radiogroup"
        aria-label="Finish preset"
        className="flex min-w-0 flex-wrap items-center justify-end gap-1"
      >
        {FINISH_PRESETS.map((preset, index) => {
          const isActive = value === preset
          const name = MATERIAL_METADATA[preset].name

          return (
            <button
              key={preset}
              ref={(node) => {
                buttonRefs.current[index] = node
              }}
              type="button"
              aria-label={name}
              aria-pressed={isActive}
              title={name}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(preset)}
              onKeyDown={(event) => {
                if (
                  event.key !== "ArrowRight" &&
                  event.key !== "ArrowDown" &&
                  event.key !== "ArrowLeft" &&
                  event.key !== "ArrowUp"
                ) {
                  return
                }
                event.preventDefault()
                const direction =
                  event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? 1
                    : -1
                const nextIndex =
                  (index + direction + FINISH_PRESETS.length) %
                  FINISH_PRESETS.length
                onChange(FINISH_PRESETS[nextIndex])
                buttonRefs.current[nextIndex]?.focus()
              }}
              className="group/finish relative flex size-7 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <span
                className={`size-6 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(0,0,0,0.2)] transition-[box-shadow] duration-100 ${
                  isActive
                    ? "ring-2 ring-ring/60 ring-offset-1 ring-offset-background"
                    : "hover:ring-2 hover:ring-foreground/20 hover:ring-offset-1 hover:ring-offset-background"
                }`}
                style={{ background: MATERIAL_PREVIEW[preset] }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 z-30 -translate-x-1/2 rounded border border-border bg-popover px-2 py-1 text-[11px] font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-md transition-opacity duration-100 group-hover/finish:opacity-100">
                {name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
