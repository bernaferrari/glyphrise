"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditScopePanel, type EditScopePanelProps } from "./EditScopePanel"
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
}: InspectorSidebarProps) {
  return (
    <aside
      id="glyphrise-properties-pane"
      aria-label="Properties inspector"
      inert={zenMode}
      aria-hidden={zenMode}
      className={`flex shrink-0 flex-col overflow-hidden bg-background max-[720px]:relative max-[720px]:h-[min(352px,48dvh)] max-[720px]:w-full max-[720px]:border-t max-[720px]:border-l-0 ${zenMode ? "pointer-events-none w-0 border-l-0 opacity-0" : `w-[clamp(300px,28vw,352px)] border-l border-border ${compactOpen ? "max-[720px]:flex" : "max-[720px]:hidden"}`}`}
    >
      <InspectorContextHeader transformProps={transformProps} />
      <PropertyEditScopeProvider value={editScopeProps}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as InspectorTab)}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList
            activateOnFocus
            aria-label="Object properties"
            variant="line"
            className="w-full shrink-0 border-b border-border px-3 group-data-horizontal/tabs:h-12 max-[720px]:group-data-horizontal/tabs:h-11"
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
              <div id="inspector-style">
                <StyleInspectorSection {...styleProps} />
              </div>
              <div
                id="inspector-geometry"
                className="mt-4 border-t border-border pt-3"
              >
                <GeometryInspectorSection {...geometryProps} />
              </div>
            </TabsContent>
            <TabsContent keepMounted value="transform">
              <div id="inspector-transform">
                <TransformInspectorSection {...transformProps} />
              </div>
            </TabsContent>
            <TabsContent keepMounted value="lighting">
              <div id="inspector-light">
                <LightInspectorSection {...lightProps} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </PropertyEditScopeProvider>
      <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-2">
        <EditScopePanel {...editScopeProps} />
      </div>
    </aside>
  )
}
