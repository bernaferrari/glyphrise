"use client"

import { ChevronLeft, ChevronRight, Plus, Shapes } from "lucide-react"
import { EditScopePanel, type EditScopePanelProps } from "./EditScopePanel"
import { LayerSwitcher } from "./LayerSwitcher"
import {
  GeometryInspectorSection,
  type GeometryInspectorSectionProps,
} from "./GeometryInspectorSection"
import {
  LightInspectorSection,
  type LightInspectorSectionProps,
} from "./LightInspectorSection"
import {
  StyleInspectorSection,
  type StyleInspectorSectionProps,
} from "./StyleInspectorSection"
import {
  TransformInspectorSection,
  type TransformInspectorSectionProps,
} from "./TransformInspectorSection"

export type SidebarStyleProps = StyleInspectorSectionProps
export type SidebarGeometryProps = GeometryInspectorSectionProps
export type SidebarTransformProps = TransformInspectorSectionProps & {
  onSelectLayer: (id: string) => void
  onToggleLayerVisibility: () => void
}
export type SidebarLightProps = LightInspectorSectionProps

export type InspectorSidebarProps = {
  editScopeProps: EditScopePanelProps
  zenMode: boolean
  compactOpen?: boolean
  styleProps: SidebarStyleProps
  geometryProps: SidebarGeometryProps
  transformProps: SidebarTransformProps
  lightProps: SidebarLightProps
}

function ShapeNavRow({
  shapeNavigation,
}: {
  shapeNavigation: NonNullable<SidebarTransformProps["shapeNavigation"]>
}) {
  return (
    <div className="space-y-2 p-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-foreground [&_svg]:size-4 [&_svg_*]:fill-current"
          style={{ color: shapeNavigation.color }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: shapeNavigation.svgContent }}
        />
        <span
          className="min-w-0 truncate text-xs font-semibold"
          title={shapeNavigation.label}
        >
          {shapeNavigation.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-label={`Change icon for ${shapeNavigation.label}`}
          onClick={shapeNavigation.onChangeIcon}
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium whitespace-nowrap hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
        >
          <Shapes className="size-3.5 shrink-0" />
          Change icon
        </button>
        <button
          type="button"
          aria-label="Add icon"
          title="Add an icon at the playhead"
          onClick={shapeNavigation.onAddIcon}
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium whitespace-nowrap hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11"
        >
          <Plus className="size-3.5 shrink-0" />
          Add icon
        </button>
      </div>
      {shapeNavigation.canNavigate && (
        <div className="flex items-center justify-between gap-2 pl-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            Icon {shapeNavigation.index + 1} of {shapeNavigation.total}
          </span>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Previous icon clip"
              title="Previous icon"
              onClick={shapeNavigation.onPrevious}
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-11"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next icon clip"
              title="Next icon"
              onClick={shapeNavigation.onNext}
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-11"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// One "what am I editing" card grouping the two selection controls — shape
// navigation (which shape in the sequence) on top, layer switcher (which path
// within it) below — separated from the property editors by the card boundary
// itself rather than a floating divider line.
function InspectorContextHeader({
  transformProps,
}: {
  transformProps: SidebarTransformProps
}) {
  const { shapeNavigation } = transformProps
  const showShapeNav = !!shapeNavigation
  const showLayers = transformProps.selectedShapeLayers.length > 1
  if (!showShapeNav && !showLayers) return null

  return (
    <div className="mb-3 flex shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/25 shadow-sm">
      {showShapeNav ? <ShapeNavRow shapeNavigation={shapeNavigation} /> : null}
      {showShapeNav && showLayers ? (
        <div className="h-px bg-border/40" />
      ) : null}
      {showLayers ? (
        <LayerSwitcher
          layers={transformProps.selectedShapeLayers}
          selectedLayerId={transformProps.selectedLayerId}
          selectedLayerOverride={transformProps.selectedLayerOverride}
          onSelectLayer={transformProps.onSelectLayer}
          onToggleVisibility={transformProps.onToggleLayerVisibility}
          onScaleChange={transformProps.onLayerScaleChange}
          onDepthChange={transformProps.onLayerDepthChange}
        />
      ) : null}
    </div>
  )
}

export function InspectorSidebar({
  editScopeProps,
  zenMode,
  compactOpen = false,
  styleProps,
  geometryProps,
  transformProps,
  lightProps,
}: InspectorSidebarProps) {
  return (
    <aside
      id="glyphrise-properties-pane"
      aria-label="Properties inspector"
      inert={zenMode}
      aria-hidden={zenMode}
      className={`editor-scrollbar flex shrink-0 flex-col overflow-y-auto bg-background max-[720px]:absolute max-[720px]:inset-0 max-[720px]:z-20 max-[720px]:w-full max-[720px]:border-l-0 max-[720px]:shadow-none ${
        zenMode
          ? "pointer-events-none w-0 border-l-0 p-0 opacity-0"
          : `w-[clamp(280px,28vw,328px)] border-l border-border/40 px-3 py-3 ${
              compactOpen ? "max-[720px]:flex" : "max-[720px]:hidden"
            }`
      }`}
    >
      <InspectorContextHeader transformProps={transformProps} />

      <EditScopePanel {...editScopeProps} />
      <div className="flex flex-col divide-y divide-border/30">
        <div id="inspector-style" className="scroll-mt-3">
          <StyleInspectorSection {...styleProps} />
        </div>
        <div id="inspector-geometry" className="scroll-mt-3">
          <GeometryInspectorSection {...geometryProps} />
        </div>
        <div id="inspector-transform" className="scroll-mt-3">
          <TransformInspectorSection {...transformProps} />
        </div>
        <div id="inspector-light" className="scroll-mt-3">
          <LightInspectorSection {...lightProps} />
        </div>
      </div>
    </aside>
  )
}
