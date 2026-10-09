"use client"

import * as React from "react"
import { ChevronRight, Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  isWarpedMesh,
  meshExtraPoints,
  meshNodePoints,
} from "../../lib/mesh-warp"
import { cn } from "@/lib/utils"
import { useCompactViewport } from "@/lib/use-compact-viewport"
import { ColorGradientPresetsPanel } from "./color-gradient-presets-panel"
import {
  ColorGradientModeToggle,
  SHOW_EXPERIMENTAL_GRADIENT_TYPES,
  type GradientType,
  GRADIENT_TYPES,
} from "./color-gradient-mode-toggle"
import type { EditableColorStop } from "./color-stop-model"
import { ColorGradientStopRows, PercentField } from "./color-gradient-stop-rows"
import { ColorGradientRail } from "./color-gradient-rail"
import { ColorMeshEditor } from "./color-mesh-editor"
import { MeshPreviewCanvas } from "./color-mesh-preview"
import { SolidColorEditor } from "./color-solid-editor"
import { useColorPickerDismiss } from "./use-color-picker-dismiss"
import { useColorGradientEditor } from "./use-color-gradient-editor"
import { useSolidColorEditor } from "./use-solid-color-editor"

export { CompactColorInput } from "./compact-color-input"
export type { CompactColorInputProps } from "./compact-color-input"

interface ColorPickerProps extends Pick<
  React.ComponentProps<"button">,
  "aria-label"
> {
  value: string
  onChange: (hex: string) => void
  className?: string
  /** "swatch" is a round custom-color button that sits among preset swatches. */
  variant?: "default" | "inspector" | "swatch"
  /** Swatch only: whether the custom color is the current choice. */
  selected?: boolean
  // Optional gradient support — when onGradientToggle is provided, the popover
  // shows a Solid/Gradient toggle and editable stops.
  gradient?: boolean
  onGradientToggle?: (on: boolean) => void
  gradientType?: GradientType
  onGradientTypeChange?: (type: GradientType) => void
  stops?: EditableColorStop[]
  onStopsChange?: (stops: EditableColorStop[]) => void
  onStopPositionChange?: (stop: number, position: number) => void
  onStopRemove?: (stop: number) => void
  secondaryValue?: string
  onSecondaryChange?: (hex: string) => void
}

export function ColorPicker({
  value,
  onChange,
  className,
  variant = "default",
  gradient,
  onGradientToggle,
  gradientType = "linear",
  onGradientTypeChange,
  stops,
  onStopsChange,
  onStopPositionChange,
  onStopRemove,
  secondaryValue,
  onSecondaryChange,
  "aria-label": ariaLabel,
  selected,
}: ColorPickerProps) {
  const compact = useCompactViewport()
  const supportsGradient = !!onGradientToggle
  const isGradient = !!gradient
  const [isOpen, setIsOpen] = React.useState(false)
  const rootTriggerRef = React.useRef<HTMLButtonElement | null>(null)
  const rootContentRef = React.useRef<HTMLDivElement | null>(null)
  const stopContentRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (
      isGradient &&
      !SHOW_EXPERIMENTAL_GRADIENT_TYPES &&
      gradientType !== "mesh"
    ) {
      onGradientTypeChange?.("mesh")
    }
  }, [gradientType, isGradient, onGradientTypeChange])

  const primaryHex = value.startsWith("#") ? value : `#${value}`
  const secondaryHex = (secondaryValue ?? value).startsWith("#")
    ? (secondaryValue ?? value)
    : `#${secondaryValue ?? value}`

  const gradientEditor = useColorGradientEditor({
    value,
    primaryHex,
    secondaryHex,
    isOpen,
    isGradient,
    gradientType,
    stops,
    hasSecondary: Boolean(onSecondaryChange),
    onChange,
    onGradientToggle,
    onGradientTypeChange,
    onSecondaryChange,
    onStopsChange,
    onStopPositionChange,
  })

  const {
    activeStop,
    activeValue,
    addStopAtMiddle,
    addStopAtRailPosition,
    applyGradientPreset,
    canRemoveStop,
    closeStopEditor,
    commitStopColorInput,
    commitStopPositionInput,
    gradientCss,
    gradientRailRef,
    handleStopPointerDown,
    markStopEditorOpenIntent,
    normalizedStops,
    openStopEditor,
    openStopEditorAnchor,
    openingStopEditorRef,
    removeStop,
    setActiveStop,
    setOpenStopEditor,
    setOpenStopEditorAnchor,
    setOpenStopEditorState,
    handleHuePointerDown,
    remixMeshStops,
    shiftHueStep,
    hueScrubbing,
    addMeshPoint,
    moveMeshPoint,
    reorderMeshPoints,
    resetMeshPoints,
    updateActiveStopColor,
  } = gradientEditor
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null)
  const [pointsOpen, setPointsOpen] = React.useState(false)
  // Grid nodes first, then free points, in stop order.
  const meshPoints = React.useMemo(
    () => [
      ...meshNodePoints(normalizedStops),
      ...meshExtraPoints(normalizedStops),
    ],
    [normalizedStops]
  )

  const closeRoot = React.useCallback(() => {
    openingStopEditorRef.current = false
    setOpenStopEditor(null)
    setOpenStopEditorAnchor(null)
    setIsOpen(false)
  }, [openingStopEditorRef, setOpenStopEditor, setOpenStopEditorAnchor])

  const { captureRootOutsidePointer, captureStopOutsidePointer } =
    useColorPickerDismiss({
      isOpen,
      hasOpenStopEditor: openStopEditor !== null,
      rootContentRef,
      rootTriggerRef,
      stopContentRef,
      closeRoot,
      closeStopEditor,
    })

  // The stop currently being edited (stop 1 only exists in gradient mode).
  const activeOnChange = updateActiveStopColor
  const solidEditorProps = useSolidColorEditor({
    value: activeValue,
    onChange: activeOnChange,
  })
  // Mesh points keep their position with the color, Figma-style.
  const activePoint = meshPoints[activeStop]
  const stopEditorProps =
    isGradient && gradientType === "mesh" && activePoint
      ? {
          ...solidEditorProps,
          footer: (
            <div className="flex items-center gap-1">
              <span className="mr-auto text-2xs text-muted-foreground">
                Position
              </span>
              {(["x", "y"] as const).map((axis) => (
                <div key={axis} className="w-14.5">
                  <PercentField
                    key={`${activeStop}-${axis}-${Math.round(activePoint[axis] * 1000)}`}
                    label={`Point ${activeStop + 1} ${axis.toUpperCase()}`}
                    prefix={axis.toUpperCase()}
                    value={activePoint[axis]}
                    onFocus={() => {}}
                    onCommit={(raw) => {
                      const parsed = Number.parseFloat(raw.replace("%", ""))
                      if (!Number.isFinite(parsed)) return
                      const value = Math.max(0, Math.min(1, parsed / 100))
                      moveMeshPoint(
                        activeStop,
                        axis === "x" ? value : activePoint.x,
                        axis === "y" ? value : activePoint.y
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          ),
        }
      : solidEditorProps

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open, eventDetails) => {
        if (!open && eventDetails.reason === "outside-press") {
          const event = eventDetails.event
          if (
            event.target instanceof Node &&
            stopContentRef.current?.contains(event.target)
          ) {
            eventDetails.cancel()
            return
          }
          if ("clientX" in event && "clientY" in event) {
            captureRootOutsidePointer(event)
            eventDetails.cancel()
            return
          }
        }
        if (
          !open &&
          eventDetails.reason !== "outside-press" &&
          (openingStopEditorRef.current || openStopEditor !== null)
        ) {
          eventDetails.cancel()
          return
        }
        if (!open) {
          openingStopEditorRef.current = false
          setOpenStopEditor(null)
          setOpenStopEditorAnchor(null)
        }
        setIsOpen(open)
      }}
    >
      {variant === "swatch" ? (
        <PopoverTrigger
          ref={rootTriggerRef}
          aria-label={ariaLabel}
          aria-pressed={selected}
          title={primaryHex.toUpperCase()}
          className={cn(
            "group/swatch relative grid size-8 shrink-0 place-items-center rounded-full bg-custom-swatch transition-[box-shadow,transform] outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-popover",
            className
          )}
        >
          <span
            aria-hidden="true"
            className="size-5 rounded-full ring-2 ring-popover [background:var(--preview-background)]"
            style={
              { "--preview-background": primaryHex } as React.CSSProperties
            }
          />
        </PopoverTrigger>
      ) : (
        <PopoverTrigger
          ref={rootTriggerRef}
          aria-label={ariaLabel}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-muted/45 px-2.5 py-2 text-left transition-colors hover:border-ring/50 hover:bg-muted/70 focus:ring-2 focus:ring-ring/35 focus:outline-none active:scale-99",
            variant === "inspector" &&
              "rounded-md border-0 bg-muted/80 px-2 py-0 text-xs text-foreground hover:bg-muted",
            className
          )}
        >
          {isGradient && gradientType === "mesh" ? (
            <MeshPreviewCanvas
              variant="swatch"
              stops={normalizedStops}
              fallback={primaryHex}
              width={14}
              height={14}
              className="size-3.5 shrink-0"
            />
          ) : (
            <div
              className="size-3.5 shrink-0 rounded border border-foreground/10 shadow-sm [background:var(--preview-background)]"
              style={
                {
                  "--preview-background": isGradient ? gradientCss : primaryHex,
                } as React.CSSProperties
              }
            />
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-foreground tabular-nums">
            {isGradient
              ? `${GRADIENT_TYPES.find((type) => type.id === gradientType)?.label ?? "Linear"} gradient`
              : primaryHex.toUpperCase()}
          </span>
        </PopoverTrigger>
      )}

      <PopoverContent
        density="flush"
        scrollable={true}
        variant="editor"
        ref={rootContentRef}
        className={cn(
          "max-h-(--available-height) overflow-x-hidden overflow-y-auto overscroll-contain select-none",
          compact ? "w-96 max-w-(--spacing-toast)" : "w-65"
        )}
        // Desktop opens beside the inspector and stays there: growing content
        // scrolls instead of flipping. Phones have no room beside the full-width
        // inspector, so the editor drops under the row (or above it).
        side={compact ? "bottom" : "left"}
        align={compact ? "center" : "start"}
        sideOffset={compact ? 8 : 12}
        collisionPadding={12}
        collisionAvoidance={
          compact
            ? { side: "flip", align: "shift" }
            : { side: "none", align: "shift" }
        }
      >
        <div className="space-y-3 p-3">
          {supportsGradient && (
            <ColorGradientModeToggle
              isGradient={isGradient}
              gradientType={gradientType}
              onGradientToggle={onGradientToggle}
              onGradientTypeChange={onGradientTypeChange}
            />
          )}

          {isGradient && (
            <div className="space-y-3">
              {gradientType === "mesh" ? (
                <>
                  <ColorMeshEditor
                    stops={normalizedStops}
                    points={meshPoints}
                    fallback={primaryHex}
                    highlightedPoint={hoveredPoint}
                    openStopEditor={openStopEditor}
                    openStopEditorAnchor={openStopEditorAnchor}
                    stopContentRef={stopContentRef}
                    stopEditorProps={stopEditorProps}
                    onStopEditorOpenIntent={markStopEditorOpenIntent}
                    onActiveStopChange={setActiveStop}
                    onOpenStopEditorChange={setOpenStopEditorState}
                    onCaptureStopOutsidePointer={captureStopOutsidePointer}
                    onCloseStopEditor={closeStopEditor}
                    onMovePoint={moveMeshPoint}
                    onAddPoint={addMeshPoint}
                  />
                  <div>
                    <div className="flex h-7 items-center gap-1">
                      <button
                        type="button"
                        aria-expanded={pointsOpen}
                        className="-ml-1.5 flex h-7 flex-1 items-center gap-1 rounded-md px-1.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none"
                        onClick={() => setPointsOpen((open) => !open)}
                      >
                        <ChevronRight
                          aria-hidden="true"
                          className={cn(
                            "size-3.5 text-muted-foreground transition-transform duration-150",
                            pointsOpen && "rotate-90"
                          )}
                        />
                        Points
                        <span className="ml-0.5 text-2xs font-normal text-muted-foreground tabular-nums">
                          {normalizedStops.length}
                        </span>
                      </button>
                      {isWarpedMesh(meshPoints.slice(0, 9)) && (
                        <button
                          type="button"
                          title="Move grid points back to their spots"
                          className="h-7 rounded-md px-1.5 text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none"
                          onClick={resetMeshPoints}
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Add a free point"
                        title="Add a free point (or double-click the canvas)"
                        className="-mr-1 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none"
                        onClick={() => addMeshPoint()}
                      >
                        <Plus aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    {pointsOpen && (
                      <div className="mt-1">
                        <ColorGradientStopRows
                          stops={normalizedStops}
                          openStopEditor={openStopEditor}
                          openStopEditorAnchor={openStopEditorAnchor}
                          canRemoveStop={canRemoveStop}
                          removeLabel="Remove color"
                          onReorder={reorderMeshPoints}
                          onRemoveStop={removeStop}
                          onHoverStop={setHoveredPoint}
                          stopContentRef={stopContentRef}
                          stopEditorProps={stopEditorProps}
                          onActiveStopChange={setActiveStop}
                          onStopEditorOpenIntent={markStopEditorOpenIntent}
                          onOpenStopEditorChange={setOpenStopEditorState}
                          onCaptureStopOutsidePointer={
                            captureStopOutsidePointer
                          }
                          onCommitStopPositionInput={commitStopPositionInput}
                          onCommitStopColorInput={commitStopColorInput}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <ColorGradientRail
                    railRef={gradientRailRef}
                    stops={normalizedStops}
                    gradientCss={gradientCss}
                    openStopEditor={openStopEditor}
                    openStopEditorAnchor={openStopEditorAnchor}
                    stopContentRef={stopContentRef}
                    stopEditorProps={stopEditorProps}
                    onAddStopAtRailPosition={addStopAtRailPosition}
                    onStopPointerDown={handleStopPointerDown}
                    onStopEditorOpenIntent={markStopEditorOpenIntent}
                    onActiveStopChange={setActiveStop}
                    onOpenStopEditorChange={(stop, anchor) => {
                      setOpenStopEditorState(stop, anchor)
                    }}
                    onCaptureStopOutsidePointer={captureStopOutsidePointer}
                  />

                  <div className="flex h-7 items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      Stops
                    </span>
                    <button
                      type="button"
                      aria-label="Add a color stop"
                      title="Add a color stop"
                      className="-mr-1 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none"
                      onClick={addStopAtMiddle}
                    >
                      <Plus aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                  <ColorGradientStopRows
                    stops={normalizedStops}
                    openStopEditor={openStopEditor}
                    openStopEditorAnchor={openStopEditorAnchor}
                    canRemoveStop={canRemoveStop}
                    stopContentRef={stopContentRef}
                    stopEditorProps={stopEditorProps}
                    onActiveStopChange={setActiveStop}
                    onStopEditorOpenIntent={markStopEditorOpenIntent}
                    onOpenStopEditorChange={(stop, anchor) => {
                      setOpenStopEditorState(stop, anchor)
                    }}
                    onCaptureStopOutsidePointer={captureStopOutsidePointer}
                    onCommitStopPositionInput={commitStopPositionInput}
                    onCommitStopColorInput={commitStopColorInput}
                    onRemoveStop={onStopRemove ?? removeStop}
                  />
                </>
              )}

              <ColorGradientPresetsPanel
                gradientType={gradientType}
                stops={normalizedStops}
                onPresetSelect={applyGradientPreset}
                onRemixMesh={remixMeshStops}
                onHuePointerDown={handleHuePointerDown}
                onHueStep={shiftHueStep}
                hueScrubbing={hueScrubbing}
              />
            </div>
          )}

          {!isGradient && (
            <SolidColorEditor {...solidEditorProps} framed={false} compact />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
