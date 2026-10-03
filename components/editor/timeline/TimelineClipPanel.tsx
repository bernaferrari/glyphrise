"use client"

import { Replace, Trash2, Upload, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
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
}: {
  open: boolean
  stop: ShapeStop | undefined
  label: string
  canRemove: boolean
  onClose: () => void
  onChangeIcon: () => void
  onUpload: () => void
  onRemove: () => void
}) {
  return (
    <Popover
      open={open && !!stop}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <PopoverContent
        anchor={() =>
          stop ? document.querySelector(`[data-clip-id="${stop.id}"]`) : null
        }
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        initialFocus={false}
        finalFocus={false}
        className="w-72 gap-0 p-0"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {stop && (
          <>
            <div className="flex items-center gap-2.5 border-b border-border py-1.5 pr-1.5 pl-2">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-md bg-muted [&_svg]:size-4 [&_svg]:fill-current [&_svg]:stroke-current"
                style={{ color: stop.color }}
                dangerouslySetInnerHTML={{ __html: stop.svgContent }}
              />
              <div className="min-w-0 flex-1">
                <PopoverTitle className="truncate text-[13px] font-medium">
                  {label}
                </PopoverTitle>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Starts at {stop.time.toFixed(2)}s
                </p>
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
            <p className="px-3 pb-2.5 text-[11px] text-muted-foreground">
              Drag the clip to retime it. Click the striped band to edit the
              transition.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
