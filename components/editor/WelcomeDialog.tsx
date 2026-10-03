"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { STARTER_ARTWORK } from "./StarterProjectModel"

export function WelcomeDialog({
  open,
  onDismiss,
  onCreate,
  error,
}: {
  open: boolean
  onDismiss: () => void
  onCreate: (iconId: string, name: string) => boolean
  error?: string
}) {
  const [selectedId, setSelectedId] = useState("heart")
  const selected = STARTER_ARTWORK.find((icon) => icon.id === selectedId)!
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onDismiss()}>
      <DialogContent className="editor-scrollbar max-h-[calc(100dvh-32px)] gap-6 overflow-y-auto p-6 sm:max-w-xl sm:p-8">
        <DialogHeader className="gap-3 pr-8">
          <span className="text-xs font-medium text-primary">
            Glyphrise · Icon motion
          </span>
          <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Make something move.
          </DialogTitle>
          <DialogDescription className="max-w-sm leading-6">
            Start with an icon. Make it yours with color and depth, add a little
            motion, then download it.
          </DialogDescription>
        </DialogHeader>
        <div
          className="grid grid-cols-3 gap-2 sm:gap-3"
          aria-label="Starter artwork"
        >
          {STARTER_ARTWORK.map((icon) => (
            <button
              type="button"
              key={icon.id}
              aria-label={`Start with ${icon.name}`}
              aria-pressed={icon.id === selectedId}
              onClick={() => setSelectedId(icon.id)}
              className="group relative flex min-h-36 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/30 p-3 text-xs font-medium transition-[background-color,border-color] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary/60 aria-pressed:bg-primary/5 sm:min-h-44 sm:text-sm"
            >
              <span
                aria-hidden="true"
                className="starter-art grid size-14 place-items-center sm:size-18 [&_svg]:size-full [&_svg_*]:fill-current"
                style={{ color: icon.defaultTint }}
                dangerouslySetInnerHTML={{ __html: icon.svgContent }}
              />
              {icon.name === "Lightning Bolt" ? "Bolt" : icon.name}
              {selectedId === icon.id && (
                <Check
                  aria-hidden="true"
                  className="absolute top-3 right-3 size-4 text-primary"
                />
              )}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid gap-2">
          <Button
            className="min-h-12 w-full rounded-xl"
            onClick={() => onCreate(selectedId, `${selected.name} motion`)}
          >
            Create with{" "}
            {selected.name === "Lightning Bolt" ? "Bolt" : selected.name}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Explore the editor
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
