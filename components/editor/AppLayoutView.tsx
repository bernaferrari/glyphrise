"use client"

import { useEffect, useState, type ComponentProps, type RefObject } from "react"
import { Box, SlidersHorizontal, Waypoints } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { usePanelTransition } from "./usePanelTransition"
import { AppTopBar } from "./AppTopBar"
import { ExportModal } from "./ExportModal"
import { InspectorSidebar } from "./InspectorSidebar"
import { TimelineDock } from "./TimelineDock"
import { ViewportStage } from "./ViewportStage"
import { NewProjectDialog } from "./NewProjectDialog"
import type { CreationJourney } from "./useCreationJourney"
import { Vector3NumberFields } from "./Vector3NumberFields"
import { ROTATION_MIN, ROTATION_MAX } from "./EditorModel"
import { AnimateDialog, type AnimateDialogProps } from "./AnimateDialog"
import { WelcomeDialog } from "./WelcomeDialog"
import { CreationGuide } from "./CreationGuide"

export type AppLayoutViewProps = {
  onCreateStarter: (iconId: string, name: string) => boolean
  animationProps: Pick<AnimateDialogProps, "duration" | "onApply">
  keyframeNotice?: string | null
  topBarProps: Omit<
    ComponentProps<typeof AppTopBar>,
    "onAnimateOpen" | "onGettingStarted"
  >
  viewportProps: Omit<ComponentProps<typeof ViewportStage>, "ref"> & {
    creationJourney: CreationJourney
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
  onCreateStarter,
  animationProps,
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
  const changePanelVisibility = usePanelTransition(topBarProps.onZenModeChange)
  const [animateOpen, setAnimateOpen] = useState(false)
  const [manualWelcomeOpen, setManualWelcomeOpen] = useState(false)
  const [journeyProjectId, setJourneyProjectId] = useState<string | null>(null)
  const [startJourney, setStartJourney] = useState(false)
  const creationJourney = viewportProps.creationJourney
  useEffect(() => {
    if (startJourney) {
      setJourneyProjectId(newProjectDialogProps.currentProjectId)
      setStartJourney(false)
    } else if (
      journeyProjectId &&
      journeyProjectId !== newProjectDialogProps.currentProjectId
    ) {
      setJourneyProjectId(null)
    }
  }, [startJourney, journeyProjectId, newProjectDialogProps.currentProjectId])
  const dismissWelcome = () => {
    creationJourney.dismissWelcome()
    setManualWelcomeOpen(false)
  }
  const [compactPane, setCompactPane] = useState<
    "preview" | "properties" | "timeline"
  >("preview")
  const showCompactPane = (pane: "preview" | "properties" | "timeline") => {
    if (topBarProps.zenMode) topBarProps.onZenModeChange(false)
    setCompactPane(pane)
  }
  const { markExportComplete } = viewportProps.creationJourney
  const exportModalProps = {
    ...exportModalPropsProp,
    artwork: inspectorProps.transformProps.shapeNavigation,
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
  }

  return (
    <div className="isolate flex h-dvh w-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      <a
        href="#glyphrise-workspace"
        className="sr-only fixed top-2 left-2 z-50 rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xl focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Skip to editor workspace
      </a>
      <AppTopBar
        {...topBarProps}
        onZenModeChange={changePanelVisibility}
        onAnimateOpen={() => setAnimateOpen(true)}
        onGettingStarted={() => setManualWelcomeOpen(true)}
      />

      <main
        id="glyphrise-workspace"
        tabIndex={-1}
        inert={topBarProps.projectStatus === "restoring"}
        aria-busy={topBarProps.projectStatus === "restoring"}
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
        <div className="relative flex min-h-0 flex-1 max-[720px]:flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative flex min-h-0 flex-1 bg-muted/40">
              <ViewportStage
                ref={canvas3DRef}
                {...viewportProps}
                showPlayback={isCompactLayout && compactPane !== "timeline"}
                onAnimate={
                  isCompactLayout ? () => setAnimateOpen(true) : undefined
                }
                playbackProps={{
                  ...viewportProps.playbackProps,
                  onExitZenMode: () => changePanelVisibility(false),
                }}
                presentation={
                  isCompactLayout &&
                  compactPane !== "preview" &&
                  !topBarProps.zenMode
                    ? "motion-preview"
                    : "workspace"
                }
              />
              {inspectorProps.editScopeProps.autoKeyEnabled &&
                !topBarProps.zenMode && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 z-20 rounded-2xl ring-2 ring-red-500/70 ring-inset max-[720px]:inset-0 max-[720px]:rounded-none"
                  >
                    <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white">
                      <span className="size-1.5 rounded-full bg-white" />
                      Auto-key
                    </span>
                  </div>
                )}
              {journeyProjectId &&
                !topBarProps.zenMode &&
                (!isCompactLayout || compactPane === "preview") && (
                  <CreationGuide
                    hasStyle={creationJourney.hasStyle}
                    hasMotion={creationJourney.hasMotion}
                    hasPreviewed={creationJourney.hasPreviewed}
                    completed={creationJourney.exportCompleted}
                    onStyle={() => {
                      inspectorProps.onTabChange("design")
                      showCompactPane("properties")
                    }}
                    onAnimate={() => setAnimateOpen(true)}
                    onPlay={creationJourney.playPreview}
                    onExport={creationJourney.openExport}
                    onDismiss={() => setJourneyProjectId(null)}
                  />
                )}
            </div>

            <TimelineDock
              {...timelineProps}
              compactOpen={compactPane === "timeline"}
              timelineProps={{
                ...timelineProps.timelineProps,
                compactMode: isCompactLayout,
                renderPropertyValueEditor: (rowId) => {
                  const transform = inspectorProps.transformProps
                  if (rowId === "rotation")
                    return (
                      <Vector3NumberFields
                        size="large"
                        values={transform.rotationOffset}
                        min={ROTATION_MIN}
                        max={ROTATION_MAX}
                        step={1}
                        scrubStep={3}
                        suffix="°"
                        precision={0}
                        ariaLabel="Keyframe rotation"
                        onChange={transform.onRotationAxisChange}
                      />
                    )
                  if (rowId === "move")
                    return (
                      <Vector3NumberFields
                        size="large"
                        values={transform.activeMoveOffset}
                        min={-100}
                        max={100}
                        step={1}
                        precision={0}
                        ariaLabel="Keyframe position"
                        onChange={transform.onMoveAxisChange}
                      />
                    )
                  return null
                },
                onPlayToggle: viewportProps.playbackProps.onPlayToggle,
                playback: viewportProps.playbackProps,
                onOpenMotionPresets: () => setAnimateOpen(true),
                autoKeyEnabled: inspectorProps.editScopeProps.autoKeyEnabled,
                onAutoKeyChange: inspectorProps.editScopeProps.onAutoKeyChange,
                onEditKeyframeValue: (selection) => {
                  showCompactPane("properties")
                  if (selection.type === "property")
                    timelineProps.timelineProps.onActivePropertyRowChange?.(
                      selection.rowId
                    )
                  else
                    timelineProps.timelineProps.onActiveTrackChange?.(
                      selection.trackId
                    )
                  requestAnimationFrame(() => {
                    const pane = document.getElementById(
                      "glyphrise-properties-pane"
                    )
                    const property =
                      selection.type === "property"
                        ? {
                            rotation: "Rotation",
                            move: "Position",
                            style: "Fill",
                          }[selection.rowId]
                        : undefined
                    const target =
                      selection.type === "property" &&
                      selection.rowId === "light-position"
                        ? pane?.querySelector<HTMLElement>(
                            'button[title="Light direction & color"]'
                          )
                        : property
                          ? pane?.querySelector<HTMLElement>(
                              `[data-edit-property="${property}"] input:not(:disabled), [data-edit-property="${property}"] button:not(:disabled)`
                            )
                          : pane?.querySelector<HTMLElement>(
                              "input:not(:disabled), button:not(:disabled)"
                            )
                    target?.focus({ preventScroll: true })
                  })
                },
              }}
            />
          </div>
          <InspectorSidebar
            {...inspectorProps}
            onRemoveIcon={() => {
              const { shapes, selectedShapeId, onRemoveShape } =
                timelineProps.timelineProps
              const id = selectedShapeId ?? shapes[0]?.id
              if (id && shapes.length > 1) onRemoveShape(id)
            }}
            compactOpen={compactPane === "properties"}
          />
        </div>

        <nav
          aria-label="Workspace views"
          className="grid h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 grid-cols-3 border-t border-border bg-background p-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] min-[720px]:hidden"
        >
          {[
            ["preview", "Canvas", Box],
            ["properties", "Properties", SlidersHorizontal],
            ["timeline", "Motion", Waypoints],
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
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-[0.96]",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
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

      <AnimateDialog
        svgContent={inspectorProps.transformProps.shapeNavigation?.svgContent}
        {...animationProps}
        open={animateOpen}
        onOpenChange={setAnimateOpen}
        onApply={(...args) => {
          animationProps.onApply(...args)
          showCompactPane("preview")
        }}
      />
      <ExportModal {...exportModalProps} />
      <NewProjectDialog {...newProjectDialogProps} />
      <WelcomeDialog
        open={
          topBarProps.projectStatus !== "restoring" &&
          (manualWelcomeOpen || creationJourney.welcomeOpen)
        }
        onDismiss={dismissWelcome}
        onCreate={(iconId, name) => {
          if (!onCreateStarter(iconId, name)) return false
          dismissWelcome()
          setStartJourney(true)
          showCompactPane("preview")
          inspectorProps.onTabChange("design")
          return true
        }}
        error={newProjectDialogProps.actionError?.message}
      />
    </div>
  )
}
