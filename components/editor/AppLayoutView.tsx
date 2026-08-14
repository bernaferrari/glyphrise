"use client"

import { useState, type ComponentProps, type RefObject } from "react"
import { Box, SlidersHorizontal, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { AppTopBar } from "./AppTopBar"
import { ExportModal } from "./ExportModal"
import { InspectorSidebar } from "./InspectorSidebar"
import { TimelineDock } from "./TimelineDock"
import { ViewportStage } from "./ViewportStage"
import { NewProjectDialog } from "./NewProjectDialog"

export type AppLayoutViewProps = {
  topBarProps: ComponentProps<typeof AppTopBar>
  viewportProps: Omit<ComponentProps<typeof ViewportStage>, "ref">
  inspectorProps: ComponentProps<typeof InspectorSidebar>
  timelineProps: ComponentProps<typeof TimelineDock>
  exportModalProps: ComponentProps<typeof ExportModal>
  newProjectDialogProps: ComponentProps<typeof NewProjectDialog>
  uploadFileRef: RefObject<HTMLInputElement | null>
  canvas3DRef: RefObject<SvgCanvasRef | null>
  onUploadInputChange: ComponentProps<"input">["onChange"]
}

export function AppLayoutView({
  topBarProps,
  viewportProps,
  inspectorProps,
  timelineProps,
  exportModalProps,
  newProjectDialogProps,
  uploadFileRef,
  canvas3DRef,
  onUploadInputChange,
}: AppLayoutViewProps) {
  const [compactPane, setCompactPane] = useState<
    "preview" | "properties" | "timeline"
  >("preview")
  const showCompactPane = (pane: "preview" | "properties" | "timeline") => {
    if (topBarProps.zenMode) topBarProps.onZenModeChange(false)
    setCompactPane(pane)
  }
  const quickStartProps = {
    ...viewportProps.quickStartProps,
    onStyle: () => {
      showCompactPane("properties")
      viewportProps.quickStartProps.onStyle()
    },
    onMotion: () => {
      showCompactPane("timeline")
      viewportProps.quickStartProps.onMotion()
    },
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased select-none">
      <a
        href="#vectorforge-workspace"
        className="sr-only fixed top-2 left-2 z-50 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xl focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to editor workspace
      </a>
      <AppTopBar {...topBarProps} />

      <main
        id="vectorforge-workspace"
        tabIndex={-1}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div
          className={cn(
            "relative flex min-h-0 flex-1 bg-muted/40",
            compactPane === "timeline" && "max-[719px]:hidden"
          )}
        >
          <ViewportStage
            ref={canvas3DRef}
            {...viewportProps}
            quickStartProps={quickStartProps}
          />
          <InspectorSidebar
            {...inspectorProps}
            compactOpen={compactPane === "properties"}
          />
        </div>

        <TimelineDock
          {...timelineProps}
          compactOpen={compactPane === "timeline"}
        />

        <nav
          aria-label="Workspace views"
          className="grid h-13 shrink-0 grid-cols-3 border-t border-border bg-background p-1 min-[720px]:hidden"
        >
          {[
            ["preview", "Preview", Box],
            ["properties", "Properties", SlidersHorizontal],
            ["timeline", "Timeline", Waypoints],
          ].map(([pane, label, Icon]) => {
            const active = compactPane === pane
            return (
              <button
                key={pane as string}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  showCompactPane(pane as "preview" | "properties" | "timeline")
                }
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.98]",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label as string}
              </button>
            )
          })}
        </nav>
      </main>

      <input
        ref={uploadFileRef}
        type="file"
        aria-label="Upload SVG"
        accept=".svg"
        className="hidden"
        onChange={onUploadInputChange}
      />

      <ExportModal {...exportModalProps} />
      <NewProjectDialog {...newProjectDialogProps} />
    </div>
  )
}
