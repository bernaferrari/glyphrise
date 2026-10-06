"use client"

import { memo, useEffect, useRef } from "react"

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

function InspectorSidebarContent({
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
      className={`compact-sheet-pane flex shrink-0 flex-col overflow-hidden bg-background max-[720px]:relative max-[720px]:h-(--compact-pane-height) max-[720px]:w-full max-[720px]:border-t max-[720px]:border-l-0 ${zenMode ? "pointer-events-none w-0 border-l-0 opacity-0" : `w-(--spacing-inspector) border-l border-border ${compactOpen ? "max-[720px]:flex" : "max-[720px]:hidden"}`}`}
    >
      {!compact && (
        <InspectorContextHeader
          transformProps={transformProps}
          onRemoveIcon={onRemoveIcon}
        />
      )}
      <PropertyEditScopeProvider value={editScopeProps}>
        {compact ? (
          <Tabs
            spacing="flush"
            value={activeTab}
            onValueChange={(value) => onTabChange(value as InspectorTab)}
            className="min-h-0 flex-1"
          >
            <div className="shrink-0 border-b border-border px-3 py-2">
              <TabsList
                activateOnFocus
                aria-label="Object properties"
                className="w-full group-data-horizontal/tabs:h-auto"
              >
                {(
                  [
                    ["design", "Design"],
                    ["transform", "Transform"],
                    ["lighting", "Lighting"],
                  ] as const
                ).map(([value, label]) => (
                  <TabsTrigger
                    size="inspector"
                    key={value}
                    value={value}
                    className="h-9"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="editor-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {/* Tabs stay on top; what's being edited scrolls with the content. */}
              <InspectorContextHeader
                transformProps={transformProps}
                onRemoveIcon={onRemoveIcon}
                compact
              />
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

// A closed phone sheet has no visible values to update. Reopening receives
// the latest props while retaining the existing inputs and scroll position.
export const InspectorSidebar = memo(
  InspectorSidebarContent,
  (previous, next) =>
    previous.compact === next.compact &&
    previous.compactOpen === next.compactOpen &&
    previous.zenMode === next.zenMode &&
    (next.zenMode || Boolean(next.compact && !next.compactOpen))
)
