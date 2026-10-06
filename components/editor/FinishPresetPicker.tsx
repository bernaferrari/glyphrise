"use client"

import { cssLength, cn } from "@/lib/utils"

import { useRef, useState, type KeyboardEvent } from "react"
import { Plus } from "lucide-react"
import { useCompactViewport } from "@/lib/use-compact-viewport"
import {
  THUMBNAIL_SPHERE_FILL,
  type FinishPreviewFill,
} from "../3d/FinishThumbnails"
import {
  isGraphiteCutPreset,
  type MaterialPresetId,
} from "../3d/MaterialPresets"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FINISH_GROUPS,
  FINISH_TILES,
  MATERIAL_METADATA,
  MATERIAL_PREVIEW,
  QUICK_FINISHES,
  finishTile,
} from "./FinishRegistry"
import { FinishSwatch, useFinishThumbnails } from "./FinishSwatch"
import { CarvedVariantControl } from "./CarvedVariantControl"

type FinishPresetPickerProps = {
  value: MaterialPresetId
  fill: FinishPreviewFill
  thumbnailsVisible: boolean
  onChange: (preset: MaterialPresetId) => void
}

/** Candidates for the trigger mosaic, alternating families for contrast. */
const MORE_CANDIDATES: MaterialPresetId[] = [
  "holo",
  "gel",
  "velvet",
  "toon",
  "prism",
  "pearl",
  "glass",
  "brushed",
  "xray",
  "matte",
]

/** Four catalog finishes that the strip is not already showing. */
const morePreview = (value: MaterialPresetId) =>
  MORE_CANDIDATES.filter(
    (preset) => !QUICK_FINISHES.includes(preset) && preset !== finishTile(value)
  ).slice(0, 4)

// Scaling each image so the
// sphere fills the 28px mosaic and anchoring it at the mosaic's center makes
// every quadrant show its own quarter, so the four read as one lit sphere.
const MOSAIC_SIZE = 28
const MOSAIC_IMAGE = MOSAIC_SIZE / THUMBNAIL_SPHERE_FILL
const QUADRANT_OFFSETS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
].map(([x, y]) =>
  [x, y]
    .map((side) =>
      cssLength(MOSAIC_SIZE / 2 - MOSAIC_IMAGE / 2 - side * (MOSAIC_SIZE / 2))
    )
    .join(" ")
)

const ARROW_STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

export function FinishPresetPicker({
  value,
  fill,
  thumbnailsVisible,
  onChange,
}: FinishPresetPickerProps) {
  const compact = useCompactViewport()
  const [open, setOpen] = useState(false)
  // Start rendering swatches on hover so the catalog is ready when it opens.
  const [warm, setWarm] = useState(false)
  const [previewed, setPreviewed] = useState<MaterialPresetId | null>(null)
  const buttonRefs = useRef(new Map<MaterialPresetId, HTMLButtonElement>())
  const activeTile = finishTile(value)
  // The Carved tile previews whichever variant is in use.
  const tilePreset = (tile: MaterialPresetId) =>
    tile === activeTile ? value : tile
  const more = morePreview(value)
  const moreThumbnails = useFinishThumbnails(more, fill, thumbnailsVisible)
  const thumbnails = useFinishThumbnails(
    open || warm ? FINISH_TILES.map(tilePreset) : [],
    fill,
    open || (warm && thumbnailsVisible)
  )

  const detailPreset = previewed ?? value
  const detail = MATERIAL_METADATA[detailPreset]

  const selectTile = (tile: MaterialPresetId) =>
    onChange(tile === activeTile ? value : tile)

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tile: MaterialPresetId
  ) => {
    const step = ARROW_STEP[event.key]
    if (!step) return
    event.preventDefault()
    const index = FINISH_TILES.indexOf(tile)
    const next =
      FINISH_TILES[(index + step + FINISH_TILES.length) % FINISH_TILES.length]
    selectTile(next)
    buttonRefs.current.get(next)?.focus()
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        setPreviewed(null)
      }}
    >
      <PopoverTrigger
        aria-label="All finishes"
        onPointerEnter={() => setWarm(true)}
        onFocus={() => setWarm(true)}
        title="All finishes"
        className="group grid size-10 place-items-center justify-self-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <span className="relative grid size-10 place-items-center rounded-full ring-1 ring-transparent transition-[box-shadow,transform] duration-150 group-hover:ring-foreground/20 group-active:scale-95 group-data-open:ring-editor group-data-open:ring-foreground/60">
          <span className="relative grid size-7 grid-cols-2 overflow-hidden rounded-full transition-transform duration-150 group-hover:scale-105">
            {more.map((preset, index) => (
              <span
                key={preset}
                className={cn(
                  "bg-muted",
                  moreThumbnails[preset]
                    ? "bg-preview-image bg-preview-size bg-preview-position"
                    : moreThumbnails[preset] === null && "bg-preview"
                )}
                style={
                  {
                    "--preview-image": moreThumbnails[preset]
                      ? `url(${moreThumbnails[preset]})`
                      : undefined,
                    "--preview-size": moreThumbnails[preset]
                      ? cssLength(MOSAIC_IMAGE)
                      : undefined,
                    "--preview-position": moreThumbnails[preset]
                      ? QUADRANT_OFFSETS[index]
                      : undefined,
                    "--preview-background":
                      moreThumbnails[preset] === null
                        ? MATERIAL_PREVIEW[preset]
                        : undefined,
                  } as React.CSSProperties
                }
              />
            ))}
            {/* One soft highlight across the quadrants makes them read as one sphere. */}
            <span className="absolute inset-0 rounded-full bg-finish-highlight shadow-finish-mosaic" />
          </span>
          <span className="absolute right-0 bottom-0 grid size-3.5 place-items-center rounded-full bg-foreground text-background ring-2 ring-background">
            <Plus className="size-2.5" strokeWidth={3} aria-hidden="true" />
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent
        size="finish"
        scrollable={true}
        density="flush"
        // Desktop opens beside the inspector; phones drop it under the strip.
        align={compact ? "center" : "end"}
        side={compact ? "bottom" : "left"}
        sideOffset={compact ? 6 : 10}
        collisionPadding={12}
        collisionAvoidance={{ side: "flip", align: "shift" }}
        className="overflow-y-auto overscroll-contain"
      >
        <div className="px-3.5 pt-3 pb-1">
          <PopoverTitle>Finish</PopoverTitle>
        </div>
        <div
          role="radiogroup"
          aria-label="Finish"
          className="space-y-3 px-2.5 pt-1 pb-3"
          onPointerLeave={() => setPreviewed(null)}
        >
          {FINISH_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="mb-1 px-1 text-3xs font-semibold tracking-label text-muted-foreground uppercase">
                {group.label}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {group.finishes.map((tile) => {
                  const active = tile === activeTile
                  const preset = tilePreset(tile)
                  return (
                    <button
                      key={tile}
                      ref={(node) => {
                        if (node) buttonRefs.current.set(tile, node)
                        else buttonRefs.current.delete(tile)
                      }}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={MATERIAL_METADATA[tile].name}
                      tabIndex={active ? 0 : -1}
                      onClick={() => selectTile(tile)}
                      onKeyDown={(event) => handleKeyDown(event, tile)}
                      onPointerEnter={() => setPreviewed(preset)}
                      onFocus={() => setPreviewed(preset)}
                      className="group flex flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-2 transition-colors duration-150 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-checked:bg-muted/50"
                    >
                      <span className="grid size-11 place-items-center rounded-full ring-editor ring-transparent transition-[box-shadow,transform] duration-200 ease-out group-hover:scale-104 group-active:scale-95 group-aria-checked:ring-foreground/60">
                        <FinishSwatch
                          preset={preset}
                          thumbnail={thumbnails[preset]}
                          className="size-11"
                        />
                      </span>
                      <span className="max-w-full truncate text-2xs leading-4 text-muted-foreground group-hover:text-foreground group-aria-checked:font-medium group-aria-checked:text-foreground">
                        {MATERIAL_METADATA[tile].name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 border-t border-border/70 bg-popover/95 px-3.5 py-3 backdrop-blur">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-foreground">
              {detail.name}
            </span>
            <span className="truncate text-2xs text-muted-foreground">
              {detail.subtitle}
            </span>
          </div>
          <p className="mt-1 min-h-8 text-2xs leading-4 text-muted-foreground">
            {detail.description}
          </p>
          {isGraphiteCutPreset(value) ? (
            <CarvedVariantControl
              value={value}
              onChange={onChange}
              className="mt-2.5"
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
