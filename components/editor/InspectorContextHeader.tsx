"use client"

import type { ReactNode } from "react"
import { Plus, Replace, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import { LayerSwitcher } from "./LayerSwitcher"
import type { SidebarTransformProps } from "./InspectorSidebar"

export function InspectorContextHeader({
  transformProps,
  onRemoveIcon,
  compact = false,
}: {
  transformProps: SidebarTransformProps
  onRemoveIcon?: () => void
  /** Phones: icon and layers share one row inside the scrolling content. */
  compact?: boolean
}) {
  const { shapeNavigation: shape, selectedShapeLayers: layers } = transformProps
  if (!shape && layers.length <= 1) return null

  const iconButton = shape && (
    <ContextMenu>
      <ContextMenuTrigger className="flex min-w-0 flex-1">
        <button
          type="button"
          aria-label={`Change icon for ${shape.label}`}
          onClick={shape.onChangeIcon}
          className={cn(
            "group flex min-w-0 flex-1 items-center rounded-lg text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
            compact ? "min-h-10 gap-2.5 px-1" : "min-h-11 gap-3 px-1.5"
          )}
        >
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border/70 [&_svg_*]:fill-current",
              compact ? "size-8 [&_svg]:size-4.5" : "size-9 [&_svg]:size-5",
              "text-(--element-color)"
            )}
            style={{ "--element-color": shape.color } as React.CSSProperties}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: shape.svgContent }}
          />
          <span className="min-w-0">
            <span
              title={shape.label}
              className={"block truncate text-sm font-semibold"}
            >
              {shape.label}
            </span>
            {!compact && (
              <span className="block text-2xs text-muted-foreground transition-colors group-hover:text-foreground">
                Change icon
              </span>
            )}
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
  )

  const layerSwitcher = (leading?: ReactNode) => (
    <LayerSwitcher
      layers={layers}
      selectedLayerId={transformProps.selectedLayerId}
      selectedLayerOverride={transformProps.selectedLayerOverride}
      hiddenLayerIds={transformProps.hiddenLayerIds}
      onSelectLayer={transformProps.onSelectLayer}
      onToggleVisibility={transformProps.onToggleLayerVisibility}
      onScaleChange={transformProps.onLayerScaleChange}
      onDepthChange={transformProps.onLayerDepthChange}
      leading={leading}
    />
  )

  if (compact)
    return (
      <div className="-mx-1 mb-3 border-b border-border pb-2">
        {layers.length > 1 ? layerSwitcher(iconButton) : iconButton}
      </div>
    )

  return (
    <div className="flex shrink-0 flex-col border-b border-border bg-background pb-2">
      {iconButton && (
        <div className="flex items-center gap-1 px-3 py-2.5">{iconButton}</div>
      )}
      {layers.length > 1 && layerSwitcher()}
    </div>
  )
}
