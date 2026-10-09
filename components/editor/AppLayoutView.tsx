"use client"

import { useEffect, useState, type ComponentProps, type RefObject } from "react"
import dynamic from "next/dynamic"
import { Box, SlidersHorizontal, Waypoints, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompactViewport } from "@/lib/use-compact-viewport"
import type { SvgCanvasRef } from "../3d/SvgCanvas"
import { useLayoutTransition, usePanelTransition } from "./usePanelTransition"
import { AppTopBar } from "./AppTopBar"
import type { ExportModal } from "./ExportModal"
import { InspectorSidebar } from "./InspectorSidebar"
import { TimelineDock } from "./TimelineDock"
import { ViewportStage } from "./ViewportStage"
import { NewProjectDialog } from "./NewProjectDialog"
import type { CreationJourney } from "./useCreationJourney"
import { Vector3NumberFields } from "./Vector3NumberFields"
import { ROTATION_MIN, ROTATION_MAX } from "./EditorModel"
import type { AnimateDialogProps } from "./AnimateDialog"
import { WelcomeDialog } from "./WelcomeDialog"
import { CreationGuide } from "./CreationGuide"

const LazyExportModal = dynamic(
  () => import("./ExportModal").then((module) => module.ExportModal),
  { ssr: false }
)
const LazyAnimateDialog = dynamic(
  () => import("./AnimateDialog").then((module) => module.AnimateDialog),
  { ssr: false }
)

export type AppLayoutViewProps = {
  onCreateStarter: (
    starterId: string,
    name: string,
    svgContent?: string
  ) => boolean
  animationProps: Pick<
    AnimateDialogProps,
    "duration" | "onApply" | "existingKeyframes"
  >
  keyframeNotice?: string | null
  topBarProps: Omit<ComponentProps<typeof AppTopBar>, "onGettingStarted">
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
  const isCompactLayout = useCompactViewport()
  const preparePreviewSnapshot = () =>
    canvas3DRef.current?.renderLayoutSnapshot()
  const changePanelVisibility = usePanelTransition(
    topBarProps.onZenModeChange,
    preparePreviewSnapshot
  )
  const transitionCompactPane = useLayoutTransition(preparePreviewSnapshot)
  const [animateOpen, setAnimateOpen] = useState(false)
  const [animateMounted, setAnimateMounted] = useState(false)
  const [exportMounted, setExportMounted] = useState(false)
  // Keep each dialog mounted after its first use so close animations and
  // the user's selected export tab/settings still survive reopening.
  useEffect(() => {
    if (animateOpen) setAnimateMounted(true)
  }, [animateOpen])
  useEffect(() => {
    if (exportModalPropsProp.isOpen) setExportMounted(true)
  }, [exportModalPropsProp.isOpen])
  const [manualWelcomeOpen, setManualWelcomeOpen] = useState(false)
  // Starting a new icon from Help switches projects; keep a way back.
  const [returnTo, setReturnTo] = useState<{ id: string; name: string } | null>(
    null
  )
  const goBack = () => {
    if (!returnTo) return
    newProjectDialogProps.onOpenRecent(returnTo.id)
    setReturnTo(null)
  }
  useEffect(() => {
    if (!returnTo) return
    const timer = window.setTimeout(() => setReturnTo(null), 10000)
    return () => window.clearTimeout(timer)
  }, [returnTo])
  const [journeyProjectId, setJourneyProjectId] = useState<string | null>(null)
  // Choosing "Style it" completes the guide's style step. Kept here: on phones
  // styling opens another pane, which unmounts the guide.
  const [styleOpenedFor, setStyleOpenedFor] = useState<string | null>(null)
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
  // Keep the sheet mounted as the same preview expands or contracts above it.
  const [sheetPane, setSheetPane] = useState<"properties" | "timeline">(
    "properties"
  )
  const [sheetMotion, setSheetMotion] = useState<"entering" | "open">("open")
  const showCompactPane = (pane: "preview" | "properties" | "timeline") => {
    if (pane === compactPane) return
    const update = () => {
      if (topBarProps.zenMode) topBarProps.onZenModeChange(false)
      if (pane !== "preview") {
        setSheetMotion(compactPane === "preview" ? "entering" : "open")
        setSheetPane(pane)
      }
      setCompactPane(pane)
    }
    transitionCompactPane(
      update,
      compactPane !== "preview" && pane !== "preview" ? "instant" : "compact"
    )
  }
  const compactSheet = compactPane === "preview" ? "closed" : sheetMotion
  const { markExportComplete } = viewportProps.creationJourney
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
        canUndo={topBarProps.canUndo || returnTo !== null}
        onUndo={() => {
          if (!topBarProps.canUndo && returnTo) goBack()
          else topBarProps.onUndo()
        }}
        onZenModeChange={changePanelVisibility}
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
            "pointer-events-none absolute top-3 left-1/2 z-50 max-w-(--spacing-toast) -translate-x-1/2 truncate rounded-xl bg-popover px-3.5 py-2 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-border transition-[opacity,transform] duration-150",
            keyframeNotice
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          )}
        >
          {keyframeNotice ?? ""}
        </div>
        {returnTo && (
          <div
            role="status"
            className="absolute bottom-4 left-1/2 z-50 flex h-11 w-max max-w-(--spacing-toast) -translate-x-1/2 animate-in items-center gap-1 rounded-xl bg-popover pr-1 pl-3.5 text-xs text-popover-foreground shadow-lg ring-1 ring-border duration-150 fade-in-0 slide-in-from-bottom-2 max-[720px]:bottom-(--spacing-toast-bottom)"
          >
            <span className="min-w-0 flex-1 truncate">New project created</span>
            <button
              type="button"
              title={`Back to ${returnTo.name}`}
              onClick={goBack}
              className="h-9 shrink-0 rounded-lg px-2.5 font-medium text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Undo
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setReturnTo(null)}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}
        <div
          data-compact-sheet={compactSheet}
          className="relative flex min-h-0 flex-1 max-[720px]:flex-col"
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="relative flex min-h-0 flex-1 bg-muted/40">
              <ViewportStage
                ref={canvas3DRef}
                {...viewportProps}
                canvasReady={topBarProps.projectStatus !== "restoring"}
                showPlayback={!isCompactLayout || compactPane !== "timeline"}
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
              {journeyProjectId &&
                !topBarProps.zenMode &&
                (!isCompactLayout || compactPane === "preview") && (
                  <CreationGuide
                    key={journeyProjectId}
                    hasStyle={
                      creationJourney.hasStyle ||
                      styleOpenedFor === journeyProjectId
                    }
                    hasMotion={creationJourney.hasMotion}
                    hasPreviewed={creationJourney.hasPreviewed}
                    completed={creationJourney.exportCompleted}
                    onStyle={() => {
                      setStyleOpenedFor(journeyProjectId)
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
              compactOpen={sheetPane === "timeline"}
              timelineProps={{
                ...timelineProps.timelineProps,
                compactMode: isCompactLayout,
                renderPropertyValueEditor: (rowId) => {
                  const transform = inspectorProps.transformProps
                  if (rowId === "rotation")
                    return (
                      <Vector3NumberFields
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
                presetArtwork:
                  inspectorProps.transformProps.shapeNavigation?.svgContent,
                onApplyMotionPreset: (id) =>
                  animationProps.onApply(
                    id,
                    timelineProps.timelineProps.duration,
                    1
                  ),
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
            compact={isCompactLayout}
            onRemoveIcon={() => {
              const { shapes, selectedShapeId, onRemoveShape } =
                timelineProps.timelineProps
              const id = selectedShapeId ?? shapes[0]?.id
              if (id && shapes.length > 1) onRemoveShape(id)
            }}
            compactOpen={
              compactPane !== "preview" && sheetPane === "properties"
            }
          />
        </div>

        <nav
          aria-label="Workspace views"
          className="grid h-(--spacing-mobile-tabs) shrink-0 touch-pinch-zoom grid-cols-3 border-t border-border bg-background p-1 pb-safe-tab select-none min-[720px]:hidden"
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
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-2xs font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:scale-96",
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

      {(animateOpen || animateMounted) && (
        <LazyAnimateDialog
          svgContent={inspectorProps.transformProps.shapeNavigation?.svgContent}
          {...animationProps}
          open={animateOpen}
          onOpenChange={setAnimateOpen}
          onApply={(...args) => {
            animationProps.onApply(...args)
            showCompactPane("preview")
          }}
        />
      )}
      {(exportModalProps.isOpen || exportMounted) && (
        <LazyExportModal {...exportModalProps} />
      )}
      <NewProjectDialog {...newProjectDialogProps} />
      <WelcomeDialog
        open={
          topBarProps.projectStatus !== "restoring" &&
          (manualWelcomeOpen || creationJourney.welcomeOpen)
        }
        onDismiss={dismissWelcome}
        onCreate={(starterId, name, svgContent) => {
          const previous =
            manualWelcomeOpen && newProjectDialogProps.currentProjectId
              ? {
                  id: newProjectDialogProps.currentProjectId,
                  name: topBarProps.projectName,
                }
              : null
          if (!onCreateStarter(starterId, name, svgContent)) return false
          setReturnTo(previous)
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
