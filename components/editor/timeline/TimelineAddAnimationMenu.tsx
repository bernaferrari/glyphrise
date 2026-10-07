"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  ANIMATION_PRESETS,
  type AnimationPresetId,
} from "../AnimationPresetModel"
import { MotionPresetPreview } from "../MotionPresetPreview"
import type { TimelineTrack } from "../TimelineModel"
import { TimelineRowIcon } from "./TimelineRowIcon"

type Preset = (typeof ANIMATION_PRESETS)[number]

/**
 * One place to add motion: ready-made presets up top, grouped by the
 * property row they create (or replace), then plain keyframe rows below.
 */
export function TimelineAddAnimationMenu({
  duration,
  hiddenTracks,
  rotationAnimated,
  scaleAnimated,
  artwork,
  onAddProperty,
  onApplyPreset,
}: {
  duration: number
  hiddenTracks: TimelineTrack[]
  rotationAnimated: boolean
  scaleAnimated: boolean
  artwork?: string
  onAddProperty: (trackId: string) => void
  onApplyPreset?: (id: AnimationPresetId) => void
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<Preset | null>(null)
  const presetGroups = onApplyPreset
    ? (["Rotation", "Scale"] as const).map((property) => ({
        property,
        animated: property === "Rotation" ? rotationAnimated : scaleAnimated,
        presets: ANIMATION_PRESETS.filter(
          (preset) => preset.property === property
        ),
      }))
    : []
  const tracks = [...hiddenTracks].sort(
    (a, b) => Number(b.id === "scale") - Number(a.id === "scale")
  )

  if (presetGroups.length === 0 && tracks.length === 0) return null
  const close = () => setOpen(false)
  const length = `0–${Number(duration.toFixed(2))}s`
  const hint = hovered
    ? `${hovered.description}${
        (hovered.property === "Rotation" ? rotationAnimated : scaleAnimated)
          ? ` Replaces your ${hovered.property.toLowerCase()} keyframes.`
          : ""
      }`
    : `Animates the whole icon across the timeline, ${length}.`

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        setHovered(null)
      }}
    >
      <PopoverTrigger
        render={
          <button
            id="timeline-add-property"
            type="button"
            className="flex h-full min-w-0 flex-1 items-center gap-2 pl-3 text-left text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset"
          />
        }
      >
        <Plus className="size-3.5" />
        <span className="sr-only">Add property</span>
        <span aria-hidden="true">Add animation</span>
      </PopoverTrigger>
      <PopoverContent
        density="menu"
        align="start"
        side="right"
        sideOffset={8}
        collisionPadding={8}
        className="max-h-(--available-height) w-64 overflow-y-auto"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {presetGroups.length > 0 && (
          <div className="grid gap-2 p-1 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              {presetGroups.map((group) => (
                <section
                  key={group.property}
                  aria-label={group.property}
                  className={cn(
                    "grid gap-1.5",
                    group.presets.length === 2
                      ? "col-span-2 grid-cols-2"
                      : "col-span-1"
                  )}
                >
                  {group.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-label={preset.name}
                      onClick={() => {
                        onApplyPreset?.(preset.id)
                        close()
                      }}
                      onPointerEnter={() => setHovered(preset)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered(preset)}
                      onBlur={() => setHovered(null)}
                      className="group relative grid justify-items-center rounded-xl bg-muted/50 pb-2 text-2xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
                    >
                      <span className="grid aspect-square w-full place-items-center">
                        <MotionPresetPreview
                          preset={preset.id}
                          svgContent={artwork}
                          duration={2}
                          className="animation-paused group-hover:animation-running group-focus-visible:animation-running"
                        />
                      </span>
                      {preset.name}
                      {group.animated && (
                        <span
                          aria-hidden="true"
                          className="absolute top-2 right-2 size-1.5 rounded-full bg-warning"
                        />
                      )}
                    </button>
                  ))}
                </section>
              ))}
            </div>
            <p className="line-clamp-2 h-8 px-1 text-2xs leading-4 text-muted-foreground">
              {hint}
            </p>
          </div>
        )}
        {tracks.length > 0 && (
          <section
            aria-label="Keyframes"
            className={cn(
              "grid py-1",
              presetGroups.length > 0 && "border-t border-border"
            )}
          >
            <p className="px-2 pt-1 pb-1 text-2xs font-medium text-muted-foreground">
              Keyframe a property
            </p>
            {tracks.map((track) => (
              <button
                key={track.id}
                type="button"
                aria-label={track.name}
                onClick={() => {
                  onAddProperty(track.id)
                  close()
                }}
                className="group flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <TimelineRowIcon
                  id={track.id}
                  className="size-3.5 text-muted-foreground"
                />
                <span className="flex-1 truncate">{track.name}</span>
                <Plus className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            ))}
          </section>
        )}
      </PopoverContent>
    </Popover>
  )
}
