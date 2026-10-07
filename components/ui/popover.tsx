"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const popoverContentVariants = cva(
  "z-50 flex w-72 origin-(--transform-origin) flex-col rounded-lg bg-popover text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
  {
    variants: {
      variant: {
        default: "",
        editor: "rounded-xl border border-border shadow-2xl backdrop-blur-xl",
        elevated: "text-foreground shadow-lg",
        help: "space-y-2 text-xs leading-relaxed",
      },
      density: {
        default: "gap-2.5 p-2.5",
        menu: "gap-0 p-1.5",
        compact: "gap-0 p-1",
        flush: "gap-0 p-0",
        tight: "p-2",
        toolbar: "gap-2",
        spacious: "p-3",
        color: "p-3 pb-2",
      },
      size: {
        default: "",
        finish:
          "max-h-finish-picker-height w-85 max-w-(--spacing-toast) max-[720px]:w-96",
      },
      tone: { default: "", foreground: "text-foreground" },
      font: { default: "", sans: "font-sans" },
    },
    defaultVariants: { variant: "default", density: "default" },
  }
)

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  animated = true,
  variant = "default",
  density = "default",
  tone = "default",
  font = "default",
  size = "default",
  scrollable = false,
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  collisionPadding,
  collisionAvoidance,
  ...props
}: PopoverPrimitive.Popup.Props &
  VariantProps<typeof popoverContentVariants> &
  Pick<
    PopoverPrimitive.Positioner.Props,
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "anchor"
    | "collisionPadding"
    | "collisionAvoidance"
  > & {
    animated?: boolean
    scrollable?: boolean
  }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            popoverContentVariants({ variant, density, tone, font, size }),
            scrollable && "editor-scrollbar",
            animated &&
              "duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({
  className,
  truncate = false,
  ...props
}: PopoverPrimitive.Title.Props & {
  truncate?: boolean
}) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", truncate && "truncate", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
