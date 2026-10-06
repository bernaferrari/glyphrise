"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const dialogContentVariants = cva("", {
  variants: {
    variant: {
      default: "",
      flush: "gap-0 p-0",
      picker: "gap-0 p-0 shadow-2xl",
      welcome: "gap-5 p-5 sm:gap-6 sm:p-8",
    },
  },
  defaultVariants: { variant: "default" },
})
const dialogHeaderVariants = cva("", {
  variants: {
    variant: {
      default: "",
      picker: "px-4 pt-3.5 pr-12 pb-1",
      export: "gap-2 border-b border-border px-5 py-3.5 pr-12",
      files: "px-6 pt-6 pb-2",
      welcome: "gap-2 pr-8 sm:gap-3",
    },
  },
  defaultVariants: { variant: "default" },
})
const dialogTitleVariants = cva("", {
  variants: {
    variant: {
      default: "",
      editor: "text-sm font-semibold text-foreground",
      section: "text-lg font-semibold tracking-tight",
      preset: "text-base font-semibold",
      welcome: "text-2xl font-semibold tracking-tight text-balance sm:text-3xl",
    },
  },
  defaultVariants: { variant: "default" },
})
const dialogDescriptionVariants = cva("", {
  variants: {
    variant: {
      default: "",
      welcome: "leading-6 text-pretty",
      detail: "text-control leading-5",
      compact: "text-xs",
    },
  },
  defaultVariants: { variant: "default" },
})

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/15 duration-150 supports-backdrop-filter:backdrop-blur-xs motion-reduce:animate-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  variant = "default",
  scrollable = false,
  children,
  showCloseButton = true,
  backdropClassName,
  ...props
}: DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
    scrollable?: boolean
    backdropClassName?: string
  }) {
  return (
    <DialogPortal>
      {/* Slot styling is forwarded unchanged; callers own static class strings. */}
      {/* oxlint-disable-next-line shadcn/require-static-classes */}
      <DialogOverlay className={backdropClassName} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-(--spacing-dialog-width) -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl bg-popover p-4 text-sm text-popover-foreground shadow-dialog ring-1 ring-foreground/10 duration-150 outline-none motion-reduce:animate-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          dialogContentVariants({ variant }),
          scrollable && "editor-scrollbar",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-lg"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof dialogHeaderVariants>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-2 pr-8",
        dialogHeaderVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  variant = "default",
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "files"
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        variant === "files" &&
          "gap-2 border-t border-border bg-muted/30 px-6 py-3",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  variant = "default",
  truncate = false,
  ...props
}: DialogPrimitive.Title.Props &
  VariantProps<typeof dialogTitleVariants> & { truncate?: boolean }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        dialogTitleVariants({ variant }),
        truncate && "truncate",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  variant = "default",
  ...props
}: DialogPrimitive.Description.Props &
  VariantProps<typeof dialogDescriptionVariants>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        dialogDescriptionVariants({ variant }),
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
