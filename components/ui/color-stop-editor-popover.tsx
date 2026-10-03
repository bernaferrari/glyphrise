"use client"

import * as React from "react"
import { PopoverContent } from "@/components/ui/popover"
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
  return (
    <PopoverContent
      ref={contentRef}
      animated={false}
      align={align}
      side={side}
      sideOffset={12}
      className="w-52.5 rounded-xl border border-border bg-popover p-3 pb-2 text-popover-foreground shadow-2xl backdrop-blur-xl"
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
