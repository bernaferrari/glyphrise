"use client"

import { useEffect, useRef } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EditScopePanelProps } from "./EditScopePanel"
import { PropertyEditScopeProvider } from "./PropertyEditScope"
import { InspectorContextHeader } from "./InspectorContextHeader"
import type { InspectorTab } from "./InspectorNavigationModel"
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
  activeTab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  editScopeProps: EditScopePanelProps
  zenMode: boolean
  compactOpen?: boolean
  styleProps: SidebarStyleProps
  geometryProps: SidebarGeometryProps
  transformProps: SidebarTransformProps
  lightProps: SidebarLightProps
  onRemoveIcon?: () => void
  /** Phones use tabs; desktop shows every section in one column. */
  compact?: boolean
}

export function InspectorSidebar({
  activeTab,
  onTabChange,
  editScopeProps,
  zenMode,
  compactOpen = false,
  styleProps,
  geometryProps,
  transformProps,
  lightProps,
  onRemoveIcon,
  compact = false,
}: InspectorSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sections = {
    style: (
      <div id="inspector-style">
        <StyleInspectorSection {...styleProps} />
      </div>
    ),
    geometry: (
      <div id="inspector-geometry">
        <GeometryInspectorSection {...geometryProps} />
      </div>
    ),
    transform: (
      <div id="inspector-transform">
        <TransformInspectorSection {...transformProps} />
      </div>
    ),
    light: (
      <div id="inspector-light">
        <LightInspectorSection {...lightProps} />
      </div>
    ),
  }
  const previousTab = useRef(activeTab)
  useEffect(() => {
    if (compact || previousTab.current === activeTab) return
    previousTab.current = activeTab
    const id = {
      design: "inspector-style",
      transform: "inspector-transform",
      lighting: "inspector-light",
    }[activeTab]
    scrollRef.current
      ?.querySelector(`#${id}`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [activeTab, compact])
  return (
    <aside
      id="glyphrise-properties-pane"
      aria-label="Properties inspector"
      inert={zenMode}
      aria-hidden={zenMode}
      className={`flex shrink-0 flex-col overflow-hidden bg-background max-[720px]:relative max-[720px]:h-[min(352px,48dvh)] max-[720px]:w-full max-[720px]:border-t max-[720px]:border-l-0 ${zenMode ? "pointer-events-none w-0 border-l-0 opacity-0" : `w-[clamp(300px,28vw,352px)] border-l border-border ${compactOpen ? "max-[720px]:flex" : "max-[720px]:hidden"}`}`}
    >
      <InspectorContextHeader
        transformProps={transformProps}
        onRemoveIcon={onRemoveIcon}
      />
      <PropertyEditScopeProvider value={editScopeProps}>
        {compact ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => onTabChange(value as InspectorTab)}
            className="min-h-0 flex-1 gap-0"
          >
            <TabsList
              activateOnFocus
              aria-label="Object properties"
              variant="line"
              className="w-full shrink-0 border-b border-border px-3 group-data-horizontal/tabs:h-11"
            >
              <TabsTrigger value="design" className="min-h-11 text-xs">
                Design
              </TabsTrigger>
              <TabsTrigger value="transform" className="min-h-11 text-xs">
                Transform
              </TabsTrigger>
              <TabsTrigger value="lighting" className="min-h-11 text-xs">
                Lighting
              </TabsTrigger>
            </TabsList>
            <div className="editor-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <TabsContent keepMounted value="design">
                {sections.style}
                <div className="mt-4 border-t border-border pt-3">
                  {sections.geometry}
                </div>
              </TabsContent>
              <TabsContent keepMounted value="transform">
                {sections.transform}
              </TabsContent>
              <TabsContent keepMounted value="lighting">
                {sections.light}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          // Desktop: one scrolling column, like Figma. Selecting something
          // on the timeline scrolls its section into view.
          <div
            ref={scrollRef}
            className="editor-scrollbar min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-4 [&>*]:py-3"
          >
            {sections.style}
            {sections.geometry}
            {sections.transform}
            {sections.light}
          </div>
        )}
      </PropertyEditScopeProvider>
    </aside>
  )
}
