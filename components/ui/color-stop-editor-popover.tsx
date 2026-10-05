"use client"

import * as React from "react"
import { PopoverContent } from "@/components/ui/popover"
import { useCompactViewport } from "@/lib/use-compact-viewport"
import {
  SolidColorEditor,
  type SolidColorEditorProps,
} from "./color-solid-editor"

/** Color editor props plus optional extras shown under the color controls. */
export type StopEditorProps = SolidColorEditorProps & {
  footer?: React.ReactNode
}

interface ColorStopEditorPopoverProps extends StopEditorProps {
  contentRef: React.RefObject<HTMLDivElement | null>
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function ColorStopEditorPopover({
  contentRef,
  align = "center",
  side = "top",
  footer,
  ...editorProps
}: ColorStopEditorPopoverProps) {
  // Phones have no room beside the gradient editor; stack above or below.
  const compact = useCompactViewport()
  const sideways = side === "left" || side === "right"
  return (
    <PopoverContent
      variant="editor"
      ref={contentRef}
      animated={false}
      align={compact ? "center" : align}
      side={compact && sideways ? "bottom" : side}
      sideOffset={compact ? 8 : 12}
      collisionPadding={12}
      collisionAvoidance={
        compact ? { side: "flip", align: "shift" } : undefined
      }
      className="max-h-(--available-height) w-52.5 overflow-y-auto overscroll-contain p-3 pb-2"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SolidColorEditor {...editorProps} framed={false} compact />
      {footer && (
        <div className="-mx-3 mt-1 border-t border-border px-3 pt-2.5 pb-1">
          {footer}
        </div>
      )}
    </PopoverContent>
  )
}
