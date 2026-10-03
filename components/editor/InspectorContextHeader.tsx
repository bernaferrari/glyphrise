"use client"

import { Plus, Replace, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { LayerSwitcher } from "./LayerSwitcher"
import type { SidebarTransformProps } from "./InspectorSidebar"

export function InspectorContextHeader({
  transformProps,
  onRemoveIcon,
}: {
  transformProps: SidebarTransformProps
  onRemoveIcon?: () => void
}) {
  const { shapeNavigation: shape, selectedShapeLayers: layers } = transformProps
  if (!shape && layers.length <= 1) return null
  return (
    <div className="flex shrink-0 flex-col border-b border-border bg-background">
      {shape && (
        <div className="flex items-center gap-1 px-3 py-2.5">
          <ContextMenu>
            <ContextMenuTrigger className="flex min-w-0 flex-1">
              <button
                type="button"
                aria-label={`Change icon for ${shape.label}`}
                onClick={shape.onChangeIcon}
                className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border/70 [&_svg]:size-5 [&_svg_*]:fill-current"
                  style={{ color: shape.color }}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: shape.svgContent }}
                />
                <span className="min-w-0">
                  <span
                    title={shape.label}
                    className="block truncate text-sm font-semibold"
                  >
                    {shape.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground transition-colors group-hover:text-foreground max-[720px]:hidden">
                    Change icon
                  </span>
                </span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={shape.onChangeIcon}>
                <Replace />
                Change icon…
              </ContextMenuItem>
              <ContextMenuItem onClick={shape.onAddIcon}>
                <Plus />
                Add icon after
              </ContextMenuItem>
              {onRemoveIcon && shape.total > 1 && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onClick={onRemoveIcon}>
                    <Trash2 />
                    Remove icon
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
      {layers.length > 1 && (
        <LayerSwitcher
          layers={layers}
          selectedLayerId={transformProps.selectedLayerId}
          selectedLayerOverride={transformProps.selectedLayerOverride}
          onSelectLayer={transformProps.onSelectLayer}
          onToggleVisibility={transformProps.onToggleLayerVisibility}
          onScaleChange={transformProps.onLayerScaleChange}
          onDepthChange={transformProps.onLayerDepthChange}
        />
      )}
    </div>
  )
}
