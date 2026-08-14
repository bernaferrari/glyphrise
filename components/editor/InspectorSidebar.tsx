"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Shapes } from "lucide-react"
import { cn } from "@/lib/utils"
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
    <div className="flex min-h-11 items-center justify-between gap-2 pr-1 pl-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background text-foreground shadow-sm [&_svg]:size-4 [&_svg_*]:fill-current"
          style={{ color: shapeNavigation.color }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: shapeNavigation.svgContent }}
        />
        <span
          className="min-w-0 truncate text-[12px] font-semibold text-foreground"
          title={shapeNavigation.label}
        >
          {shapeNavigation.label}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Change icon for ${shapeNavigation.label}`}
          title="Change icon"
          onClick={shapeNavigation.onChangeIcon}
          className="flex h-7 items-center gap-1.5 rounded-md bg-foreground/[0.055] px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.09] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <Shapes className="size-3.5" />
          Change
        </button>
        {shapeNavigation.canNavigate ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="Previous icon clip"
              title="Previous icon clip"
              onClick={shapeNavigation.onPrevious}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="min-w-[46px] text-center font-mono text-[11px] text-muted-foreground/70 tabular-nums">
              Clip {shapeNavigation.index + 1}/{shapeNavigation.total}
            </span>
            <button
              type="button"
              aria-label="Next icon clip"
              title="Next icon clip"
              onClick={shapeNavigation.onNext}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
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
  const showLayers = transformProps.selectedShapeLayers.length > 0
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
  zenMode,
  compactOpen = false,
  styleProps,
  geometryProps,
  transformProps,
  lightProps,
}: InspectorSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSectionId, setActiveSectionId] = useState("inspector-style")
  const scrollToSection = (id: string) => {
    setActiveSectionId(id)
    document.getElementById(id)?.scrollIntoView({ block: "start" })
  }
  const updateActiveSection = () => {
    const rootTop = scrollRef.current?.getBoundingClientRect().top ?? 0
    const sections = [
      "inspector-style",
      "inspector-geometry",
      "inspector-transform",
      "inspector-light",
    ]
    const active = sections.reduce(
      (closest, id) => {
        const top =
          document.getElementById(id)?.getBoundingClientRect().top ?? Infinity
        return Math.abs(top - rootTop - 48) <
          Math.abs(closest.top - rootTop - 48)
          ? { id, top }
          : closest
      },
      { id: sections[0], top: Infinity }
    )
    setActiveSectionId(active.id)
  }

  return (
    <div
      ref={scrollRef}
      onScroll={updateActiveSection}
      inert={zenMode}
      aria-hidden={zenMode}
      className={`flex shrink-0 flex-col overflow-y-auto bg-background max-[719px]:absolute max-[719px]:inset-0 max-[719px]:z-20 max-[719px]:w-full max-[719px]:border-l-0 max-[719px]:shadow-none ${
        zenMode
          ? "pointer-events-none w-0 border-l-0 p-0 opacity-0"
          : `w-[clamp(280px,28vw,328px)] border-l border-border/40 px-3 py-3 ${
              compactOpen ? "max-[719px]:flex" : "max-[719px]:hidden"
            }`
      }`}
    >
      <InspectorContextHeader transformProps={transformProps} />

      <nav
        aria-label="Inspector sections"
        className="sticky top-0 z-20 -mx-1 mb-1 grid grid-cols-4 gap-1 border-b border-border/40 bg-background/95 px-1 pb-2 backdrop-blur-md"
      >
        {[
          ["inspector-style", "Style"],
          ["inspector-geometry", "Geometry"],
          ["inspector-transform", "Transform"],
          ["inspector-light", "Light"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={activeSectionId === id ? "location" : undefined}
            onClick={() => scrollToSection(id)}
            className={cn(
              "min-h-9 rounded-md px-1 text-[11px] font-medium transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98]",
              activeSectionId === id
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col divide-y divide-border/30">
        <div id="inspector-style" className="scroll-mt-12">
          <StyleInspectorSection {...styleProps} />
        </div>
        <div id="inspector-geometry" className="scroll-mt-12">
          <GeometryInspectorSection {...geometryProps} />
        </div>
        <div id="inspector-transform" className="scroll-mt-12">
          <TransformInspectorSection {...transformProps} />
        </div>
        <div id="inspector-light" className="scroll-mt-12">
          <LightInspectorSection {...lightProps} />
        </div>
      </div>
    </div>
  )
}
