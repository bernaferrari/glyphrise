"use client"

import { Replace, Trash2, Upload, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { NumberField } from "../NumberField"
import type { ShapeStop } from "../TimelineModel"

const actionButton =
  "flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 text-xs font-medium transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring"

/** Actions for the selected icon clip, anchored above it. */
export function TimelineClipPanel({
  open,
  stop,
  label,
  canRemove,
  onClose,
  onChangeIcon,
  onUpload,
  onRemove,
  onTimeChange,
  duration,
}: {
  open: boolean
  stop: ShapeStop | undefined
  label: string
  canRemove: boolean
  onClose: () => void
  onChangeIcon: () => void
  onUpload: () => void
  onRemove: () => void
  onTimeChange: (time: number) => void
  duration: number
}) {
  return (
    <Popover
      open={open && !!stop}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <PopoverContent
        density="flush"
        anchor={() =>
          stop ? document.querySelector(`[data-clip-id="${stop.id}"]`) : null
        }
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        initialFocus={false}
        finalFocus={false}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {stop && (
          <>
            <div className="flex items-center gap-2.5 border-b border-border py-1.5 pr-1.5 pl-2">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-(--element-color) [&_svg]:size-4 [&_svg]:fill-current [&_svg]:stroke-current"
                style={{ "--element-color": stop.color } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: stop.svgContent }}
              />
              <div className="min-w-0 flex-1">
                <PopoverTitle size="control" truncate={true}>
                  {label}
                </PopoverTitle>
                {stop.time === 0 ? (
                  <p className="text-2xs text-muted-foreground tabular-nums">
                    Opens the animation
                  </p>
                ) : (
                  <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                    Starts at
                    <NumberField
                      value={stop.time}
                      min={0}
                      max={duration}
                      step={0.1}
                      precision={2}
                      suffix="s"
                      className="h-6 w-16 text-2xs"
                      ariaLabel={`${label} start time in seconds`}
                      onChange={onTimeChange}
                    />
                  </label>
                )}
              </div>
              {canRemove && (
                <button
                  type="button"
                  aria-label={`Delete ${label} icon`}
                  title="Delete (Delete)"
                  onClick={onRemove}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Close icon clip panel"
                onClick={onClose}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex gap-2 p-2.5">
              <button
                type="button"
                onClick={onChangeIcon}
                className={actionButton}
              >
                <Replace className="size-3.5" />
                Change icon
              </button>
              <button type="button" onClick={onUpload} className={actionButton}>
                <Upload className="size-3.5" />
                Upload SVG
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
