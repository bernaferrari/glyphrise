"use client"

import { MoreHorizontal, Trash2, X } from "lucide-react"
import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NumberField } from "../NumberField"
import { EasingPicker } from "./TimelineEasingControls"
import type { ListFrame, ListRow } from "./TimelineKeyframeListRow"

export function TimelineKeyframeEditor({
  row,
  frame,
  duration,
  open,
  onClose,
  onDelete,
  onEditValue,
  finalFocus,
  valueEditor,
}: {
  row: ListRow | undefined
  frame: ListFrame | undefined
  duration: number
  open: boolean
  onClose: () => void
  onDelete: () => void
  onEditValue: () => void
  finalFocus: () => HTMLElement | false
  valueEditor?: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        backdropClassName="bg-black/20 supports-backdrop-filter:backdrop-blur-none"
        finalFocus={finalFocus}
        className="gap-0 overflow-hidden p-0 max-[720px]:top-auto max-[720px]:bottom-0 max-[720px]:max-w-full max-[720px]:translate-y-0 max-[720px]:rounded-t-2xl max-[720px]:rounded-b-none"
      >
        {row && frame && (
          <>
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3">
              <div className="min-w-0 flex-1">
                <DialogTitle>{row.name}</DialogTitle>
                <DialogDescription className="mt-1 text-xs">
                  Keyframe{" "}
                  {row.keyframes.findIndex(
                    (candidate) => candidate.id === frame.id
                  ) + 1}{" "}
                  of {row.keyframes.length}
                </DialogDescription>
              </div>
              {row.onRemove && (
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Keyframe actions"
                        className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent align="end" side="top" className="w-52 p-1">
                    <button
                      type="button"
                      aria-label={`Delete ${row.name} keyframe at ${frame.time.toFixed(2)}s`}
                      onClick={onDelete}
                      className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-destructive hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Trash2 className="size-4" />
                      Delete keyframe
                    </button>
                  </PopoverContent>
                </Popover>
              )}
              <button
                type="button"
                aria-label="Close keyframe editor"
                onClick={onClose}
                className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-5 px-5 py-5">
              {valueEditor && (
                <div className="grid gap-2">
                  <span className="text-xs font-medium">
                    {row.name === "Rotation" ? "Angle" : "Position"}
                  </span>
                  {valueEditor}
                </div>
              )}
              {row.valueRange && frame.value !== undefined && (
                <label className="flex items-center justify-between gap-4 text-sm">
                  Value
                  <NumberField
                    value={frame.value}
                    min={row.valueRange.min}
                    max={row.valueRange.max}
                    step={0.05}
                    precision={2}
                    ariaLabel={`${row.name} keyframe value`}
                    className="min-h-11 w-28"
                    onChange={(value) => row.valueRange?.onChange(frame, value)}
                  />
                </label>
              )}
              <div className="grid grid-cols-2 gap-4">
                <label className="grid min-w-0 grid-cols-1 gap-2 text-xs font-medium">
                  Time
                  <NumberField
                    value={frame.time}
                    min={0}
                    max={duration}
                    step={0.1}
                    precision={2}
                    suffix="s"
                    ariaLabel={`${row.name} keyframe time in seconds`}
                    className="min-h-11 w-full min-w-0"
                    onChange={(time) => row.onMove(frame, time)}
                  />
                </label>
                {row.onEasing && (
                  <div className="grid min-w-0 grid-cols-1 gap-2 text-xs font-medium">
                    <span>Easing</span>
                    <div className="flex min-h-11 items-center rounded-lg bg-muted/40">
                      <EasingPicker
                        showLabel
                        value={frame.easing ?? "ease-in-out"}
                        scopeLabel={`Selected ${row.name} keyframe easing`}
                        onChange={(easing) => row.onEasing?.(frame, easing)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {!valueEditor && row.onEditValue && (
                <button
                  type="button"
                  onClick={onEditValue}
                  className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Edit{" "}
                  {row.name === "Style" ? "appearance" : row.name.toLowerCase()}
                </button>
              )}
            </div>
            <div className="border-t border-border/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 w-full rounded-lg bg-foreground text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Done
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
