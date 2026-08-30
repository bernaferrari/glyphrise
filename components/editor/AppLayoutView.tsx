"use client"

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from "react"
import { Box, SlidersHorizontal, Sparkles, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { AppTopBar } from "./AppTopBar"
import { ExportModal } from "./ExportModal"
import { InspectorSidebar } from "./InspectorSidebar"
import { TimelineDock } from "./TimelineDock"
import { ViewportStage } from "./ViewportStage"
import { NewProjectDialog } from "./NewProjectDialog"
import type { QuickStartGuideController } from "./useQuickStartGuideController"
import { QuickStartGuide } from "./QuickStartGuide"

export type AppLayoutViewProps = {
  keyframeNotice?: string | null
  topBarProps: ComponentProps<typeof AppTopBar>
  viewportProps: Omit<ComponentProps<typeof ViewportStage>, "ref"> & {
    quickStartController: Pick<
      QuickStartGuideController,
      | "openGuide"
      | "dismissedRecently"
      | "markExportComplete"
      | "quickStartProps"
    >
  }
  inspectorProps: ComponentProps<typeof InspectorSidebar>
  timelineProps: ComponentProps<typeof TimelineDock>
  exportModalProps: ComponentProps<typeof ExportModal>
  newProjectDialogProps: ComponentProps<typeof NewProjectDialog>
  uploadFileRef: RefObject<HTMLInputElement | null>
  canvas3DRef: RefObject<SvgCanvasRef | null>
  onUploadInputChange: ComponentProps<"input">["onChange"]
}

function useCompactWorkspaceLayout() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(width < 720px)")
    const update = () => setIsCompact(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return isCompact
}

export function AppLayoutView({
  keyframeNotice,
  topBarProps,
  viewportProps,
  inspectorProps,
  timelineProps,
  exportModalProps: exportModalPropsProp,
  newProjectDialogProps,
  uploadFileRef,
  canvas3DRef,
  onUploadInputChange,
}: AppLayoutViewProps) {
  const isCompactLayout = useCompactWorkspaceLayout()
  const quickStartReturnRef = useRef<HTMLButtonElement>(null)
  const [compactPane, setCompactPane] = useState<
    "preview" | "properties" | "timeline"
  >("preview")
  const showCompactPane = (pane: "preview" | "properties" | "timeline") => {
    if (topBarProps.zenMode) topBarProps.onZenModeChange(false)
    setCompactPane(pane)
  }
  const {
    openGuide,
    dismissedRecently,
    markExportComplete,
    quickStartProps: baseQuickStartProps,
  } = viewportProps.quickStartController
  const quickStartProps = {
    ...baseQuickStartProps,
    onDismiss: () => {
      baseQuickStartProps.onDismiss()
      window.requestAnimationFrame(() => quickStartReturnRef.current?.focus())
    },
    onStyle: () => {
      showCompactPane("properties")
      baseQuickStartProps.onStyle()
    },
    onMotion: () => {
      showCompactPane("timeline")
      baseQuickStartProps.onMotion()
    },
  }
  const exportModalProps = {
    ...exportModalPropsProp,
    // The export checklist step completes only on a real export action,
    // not on opening the surface.
    onExportGltf: async () => {
      await exportModalPropsProp.onExportGltf()
      markExportComplete()
    },
    onExportVideo: async (
      settings: Parameters<typeof exportModalPropsProp.onExportVideo>[0]
    ) => {
      await exportModalPropsProp.onExportVideo(settings)
      markExportComplete()
    },
    onExportPng: async (
      settings: Parameters<typeof exportModalPropsProp.onExportPng>[0]
    ) => {
      await exportModalPropsProp.onExportPng(settings)
      markExportComplete()
    },
    onCodeCopied: markExportComplete,
  }
  const showQuickStartOverlay =
    !topBarProps.zenMode &&
    (quickStartProps.open || (!quickStartProps.open && dismissedRecently))

  return (
    <div className="isolate flex h-dvh w-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      <a
        href="#glyphrise-workspace"
        className="sr-only fixed top-2 left-2 z-50 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xl focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to editor workspace
      </a>
      <AppTopBar {...topBarProps} />

      <main
        id="glyphrise-workspace"
        tabIndex={-1}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "pointer-events-none absolute top-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/25 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-[opacity,transform] duration-150",
            keyframeNotice
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          )}
        >
          {keyframeNotice ?? ""}
        </div>
        <div
          className={cn(
            "relative flex min-h-0 flex-1 bg-muted/40",
            compactPane === "timeline" && "max-[720px]:hidden"
          )}
        >
          <ViewportStage
            ref={canvas3DRef}
            {...viewportProps}
            workspaceActive={!isCompactLayout || compactPane === "preview"}
          />
          <InspectorSidebar
            {...inspectorProps}
            compactOpen={compactPane === "properties"}
          />
        </div>

        {showQuickStartOverlay ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-30",
              "bottom-[calc(3.25rem+env(safe-area-inset-bottom))] min-[720px]:bottom-[calc(clamp(152px,24dvh,184px)+8px)]"
            )}
          >
            {quickStartProps.open ? (
              <div className="pointer-events-auto">
                <QuickStartGuide {...quickStartProps} />
              </div>
            ) : null}

            {!quickStartProps.open && dismissedRecently ? (
              <button
                ref={quickStartReturnRef}
                type="button"
                onClick={openGuide}
                aria-label="Reopen quick start"
                className="pointer-events-auto absolute bottom-2 left-2 flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-md transition-[background-color,color,transform] duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.96] max-[720px]:bottom-2"
              >
                <Sparkles aria-hidden="true" className="size-3.5" />
                Quick start
              </button>
            ) : null}
          </div>
        ) : null}

        <TimelineDock
          {...timelineProps}
          compactOpen={compactPane === "timeline"}
        />

        <nav
          aria-label="Workspace views"
          className="grid h-[calc(3.25rem+env(safe-area-inset-bottom))] shrink-0 grid-cols-3 border-t border-border bg-background p-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] min-[720px]:hidden"
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
                aria-controls={`glyphrise-${pane as string}-pane`}
                onClick={() =>
                  showCompactPane(pane as "preview" | "properties" | "timeline")
                }
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-lg text-xs font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.96]",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
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
