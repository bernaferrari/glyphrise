"use client"

import { useRef, useState } from "react"
import { Check, LayoutGrid } from "lucide-react"
import type { MaterialPresetId } from "../3d/MaterialPresets"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FINISH_PRESETS,
  MATERIAL_METADATA,
  MATERIAL_PREVIEW,
} from "./FinishRegistry"

type FinishPresetPickerProps = {
  value: MaterialPresetId
  onChange: (preset: MaterialPresetId) => void
}

const FINISH_GROUPS: Array<{
  label: string
  presets: MaterialPresetId[]
}> = [
  { label: "Soft", presets: ["frost", "satin", "pearl"] },
  { label: "Transparent", presets: ["glass", "gelGlass", "prismChrome"] },
  { label: "Reflective", presets: ["chrome", "holo"] },
  { label: "Bold", presets: ["aura", "lacquer", "neon", "ink"] },
  {
    label: "Relief",
    presets: ["cutInk", "cutInner", "cutOuter", "softCut"],
  },
]

export function FinishPresetPicker({
  value,
  onChange,
}: FinishPresetPickerProps) {
  const [open, setOpen] = useState(false)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="All finishes"
        title="All finishes"
        className="group grid size-9 place-items-center justify-self-center rounded-full text-muted-foreground ring-1 ring-transparent transition-[box-shadow,color,transform] duration-150 hover:text-foreground hover:ring-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 data-open:text-foreground data-open:ring-2 data-open:ring-foreground/80"
      >
        <span className="grid size-7 place-items-center rounded-full border border-foreground/15 bg-muted/60 transition-colors group-hover:bg-muted">
          <LayoutGrid className="size-3.5" aria-hidden="true" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="left"
        sideOffset={10}
        className="editor-scrollbar max-h-[min(560px,calc(100dvh-32px))] w-[min(390px,calc(100vw-32px))] overflow-y-auto p-3"
      >
        <PopoverHeader>
          <PopoverTitle>Choose a finish</PopoverTitle>
          <PopoverDescription>
            The surface type applies throughout the animation. Its settings
            follow the edit scope shown in the inspector.
          </PopoverDescription>
        </PopoverHeader>
        <div role="radiogroup" aria-label="Finish preset" className="space-y-3">
          {FINISH_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {group.label}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {group.presets.map((preset) => {
                  const index = FINISH_PRESETS.indexOf(preset)
                  const metadata = MATERIAL_METADATA[preset]
                  const active = value === preset
                  return (
                    <button
                      key={preset}
                      ref={(node) => {
                        buttonRefs.current[index] = node
                      }}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      tabIndex={active ? 0 : -1}
                      onClick={() => {
                        onChange(preset)
                        setOpen(false)
                      }}
                      onKeyDown={(event) => {
                        if (
                          ![
                            "ArrowRight",
                            "ArrowDown",
                            "ArrowLeft",
                            "ArrowUp",
                          ].includes(event.key)
                        )
                          return
                        event.preventDefault()
                        const direction =
                          event.key === "ArrowRight" ||
                          event.key === "ArrowDown"
                            ? 1
                            : -1
                        const nextIndex =
                          (index + direction + FINISH_PRESETS.length) %
                          FINISH_PRESETS.length
                        onChange(FINISH_PRESETS[nextIndex])
                        buttonRefs.current[nextIndex]?.focus()
                      }}
                      className="relative flex min-h-16 items-start gap-2.5 rounded-lg border border-border bg-muted/25 p-2.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-ring/40 hover:bg-muted/55 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.99]"
                    >
                      <span
                        className="mt-0.5 size-8 shrink-0 rounded-full border border-border shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(0,0,0,0.2)]"
                        style={{ background: MATERIAL_PREVIEW[preset] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          {metadata.name}
                          {active ? (
                            <Check className="size-3.5 text-primary" />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                          {metadata.subtitle}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
