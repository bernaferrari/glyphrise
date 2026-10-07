"use client"

import { cssLength } from "@/lib/utils"

import React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type GoToEditorState = {
  x: number
  y: number
  draft: string
}

type TimelineGoToPopoverProps = {
  editor: GoToEditorState | null
  onEditorChange: React.Dispatch<React.SetStateAction<GoToEditorState | null>>
  onCommit: () => void
  onCancel: () => void
}

export function TimelineGoToPopover({
  editor,
  onEditorChange,
  onCommit,
  onCancel,
}: TimelineGoToPopoverProps) {
  if (!editor) return null

  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onCommit()
      }}
    >
      <PopoverTrigger
        aria-hidden="true"
        tabIndex={-1}
        className="fixed top-(--position-y) left-(--position-x) size-px opacity-0"
        style={
          {
            "--position-x": cssLength(editor.x),
            "--position-y": cssLength(editor.y),
          } as React.CSSProperties
        }
      />
      <PopoverContent
        density="tight"
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-32"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <label className="mb-1 block text-2xs font-medium tracking-widest text-muted-foreground uppercase">
          Go to
        </label>
        <div className="flex h-8 items-center rounded-md bg-muted/70 ring-1 ring-border">
          <input
            autoFocus
            aria-label="Timeline time in seconds"
            value={editor.draft}
            onChange={(event) =>
              onEditorChange((current) =>
                current
                  ? { ...current, draft: event.currentTarget.value }
                  : current
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onCommit()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                onCancel()
              }
            }}
            onBlur={onCommit}
            className="min-w-0 flex-1 bg-transparent px-2 text-right font-mono text-xs text-foreground outline-none"
          />
          <span className="pr-2 text-2xs text-muted-foreground">s</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
