"use client"

import { CircleHelp } from "lucide-react"
import { keyframeTimeMatches } from "./EditorKeyframeModel"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type EditScopePanelProps = {
  currentTime: number
  autoKeyEnabled: boolean
  onAutoKeyChange: (enabled: boolean) => void
  properties: Array<{ name: string; times: number[] }>
}

export function EditScopePanel({
  currentTime,
  autoKeyEnabled,
  onAutoKeyChange,
  properties,
}: EditScopePanelProps) {
  const keyed = properties.filter((property) =>
    property.times.some((time) => keyframeTimeMatches(time, currentTime))
  )
  const animated = properties.some((property) => property.times.length > 0)
  return (
    <div className="mb-2 border-b border-border/40 px-1 pb-3 text-xs">
      <div className="flex min-h-9 items-center gap-1">
        <label className="flex min-h-9 flex-1 items-center justify-between gap-2 font-medium">
          Auto-key
          <Switch
            aria-label="Create keyframes when editing"
            checked={autoKeyEnabled}
            onCheckedChange={onAutoKeyChange}
          />
        </label>
        <Popover>
          <PopoverTrigger
            aria-label="How Auto-key works"
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CircleHelp className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="max-w-[calc(100vw-32px)] space-y-2 text-xs leading-relaxed"
          >
            <p className="font-medium">Auto-key</p>
            <p>
              When on, changing an animated property adds or updates a keyframe
              at {currentTime.toFixed(2)}s.
            </p>
            <p>
              When off, you can still edit an existing keyframe. Between
              keyframes, turn Auto-key on to change the animation at that time.
            </p>
            <p>
              Properties without keyframes use one value throughout the
              animation. Non-animated settings, such as edge roundness, always
              apply throughout.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground tabular-nums">
        {autoKeyEnabled
          ? `Changes add keyframes at ${currentTime.toFixed(2)}s.`
          : keyed.length
            ? `${keyed.map((item) => item.name).join(", ")}: editing this keyframe.`
            : animated
              ? `Enable to animate changes at ${currentTime.toFixed(2)}s.`
              : "Changes apply throughout the animation."}
      </p>
    </div>
  )
}
