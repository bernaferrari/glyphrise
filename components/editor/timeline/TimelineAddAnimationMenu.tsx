"use client"

import { useState, type ReactNode } from "react"
import { Diamond, Plus } from "lucide-react"
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
import { starterPeak } from "./StarterTrackModel"
import { describeStarterMotion } from "./TimelinePrimitives"
import { TimelineRowIcon } from "./TimelineRowIcon"

type Group = {
  id: string
  name: string
  animated: boolean
  presets: (typeof ANIMATION_PRESETS)[number][]
  custom?: TimelineTrack
}

/**
 * One place to add motion, organised by the property it animates — so a
 * preset says exactly which row it creates (or replaces) on the timeline.
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
  const presetsFor = (property: "Rotation" | "Scale") =>
    onApplyPreset
      ? ANIMATION_PRESETS.filter((preset) => preset.property === property)
      : []
  const groups: Group[] = [
    {
      id: "rotation",
      name: "Rotation",
      animated: rotationAnimated,
      presets: presetsFor("Rotation"),
    },
    {
      id: "scale",
      name: "Scale",
      animated: scaleAnimated,
      presets: presetsFor("Scale"),
      custom: hiddenTracks.find((track) => track.id === "scale"),
    },
    ...hiddenTracks
      .filter((track) => track.id !== "scale")
      .map((track) => ({
        id: track.id,
        name: track.name,
        animated: false,
        presets: [],
        custom: track,
      })),
  ].filter((group) => group.presets.length > 0 || group.custom)

  if (groups.length === 0) return null
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        className="max-h-(--available-height) overflow-y-auto"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="px-2 pt-1 pb-2 text-[11px] leading-4 text-muted-foreground">
          Everything here animates the whole icon across the timeline,{" "}
          <span className="text-foreground tabular-nums">
            0s → {Number(duration.toFixed(2))}s
          </span>
          . Fine-tune it afterwards with the keyframes.
        </p>
        {groups.map((group) => (
          <section
            key={group.id}
            aria-label={group.name}
            className="border-t border-border py-1.5"
          >
            <div className="flex items-center gap-2 px-2 pb-1 text-[11px] font-medium text-muted-foreground">
              <TimelineRowIcon id={group.id} className="size-3.5" />
              {group.name}
              {group.animated && (
                <span className="ml-auto rounded bg-warning/12 px-1.5 py-px text-[10px] text-warning">
                  Replaces current
                </span>
              )}
            </div>
            {group.presets.map((preset) => (
              <MenuItem
                key={preset.id}
                ariaLabel={preset.name}
                icon={
                  <MotionPresetPreview
                    preset={preset.id}
                    svgContent={artwork}
                    duration={2}
                    size="sm"
                  />
                }
                title={preset.name}
                description={preset.summary}
                onSelect={() => {
                  onApplyPreset?.(preset.id)
                  close()
                }}
              />
            ))}
            {group.custom && (
              <MenuItem
                ariaLabel={group.custom.name}
                icon={<Diamond className="size-3.5" />}
                title={
                  group.presets.length ? "Your own keyframes" : "Keyframes"
                }
                description={describeStarterMotion(
                  group.custom,
                  starterPeak(group.custom)
                )}
                onSelect={() => {
                  onAddProperty(group.custom!.id)
                  close()
                }}
              />
            )}
          </section>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function MenuItem({
  ariaLabel,
  icon,
  title,
  description,
  onSelect,
}: {
  ariaLabel: string
  icon: ReactNode
  title: string
  description: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onSelect}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-foreground">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground tabular-nums">
          {description}
        </span>
      </span>
    </button>
  )
}
