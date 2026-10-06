"use client"

import { CircleHelp } from "lucide-react"
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
}: EditScopePanelProps) {
  return (
    <div className="px-1 text-xs">
      <div className="flex min-h-11 items-center gap-1">
        <label className="flex min-h-11 flex-1 items-center justify-between gap-2 font-medium">
          Record edits
          <Switch
            aria-label="Create keyframes when editing"
            checked={autoKeyEnabled}
            onCheckedChange={onAutoKeyChange}
          />
        </label>
        <Popover>
          <PopoverTrigger
            aria-label="How recording edits works"
            className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CircleHelp className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent
            variant="help"
            align="end"
            className="max-w-(--spacing-screen-inset-4)"
          >
            <p className="font-medium">Record edits · Auto-key</p>
            <p>
              Turn this on to save a changed value at {currentTime.toFixed(2)}s.
              The animation moves between these saved moments, called keyframes.
            </p>
            <p>
              With this off, properties without motion keep a single value
              throughout. For a property with motion, choose a saved moment to
              edit it, or use Edit here to record a new moment.
            </p>
            <p>Shape details such as edge roundness always apply throughout.</p>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-2xs leading-relaxed text-muted-foreground tabular-nums max-[720px]:hidden">
        {autoKeyEnabled
          ? `Save your next change at ${currentTime.toFixed(2)}s.`
          : "Changes to unanimated values apply throughout."}
      </p>
    </div>
  )
}
