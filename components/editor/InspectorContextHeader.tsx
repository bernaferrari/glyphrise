"use client"

import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { LayerSwitcher } from "./LayerSwitcher"
import type { SidebarTransformProps } from "./InspectorSidebar"

export function InspectorContextHeader({
  transformProps,
}: {
  transformProps: SidebarTransformProps
}) {
  const { shapeNavigation: shape, selectedShapeLayers: layers } = transformProps
  if (!shape && layers.length <= 1) return null
  return (
    <div className="flex shrink-0 flex-col border-b border-border bg-background">
      {shape && (
        <div className="px-4 pt-4 pb-2 max-[720px]:px-3 max-[720px]:py-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label={`Change icon for ${shape.label}`}
              onClick={shape.onChangeIcon}
              className="order-1 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring max-[720px]:min-h-11 max-[720px]:gap-2"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted max-[720px]:size-8 [&_svg]:size-6 [&_svg_*]:fill-current"
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
                <span className="mt-1 block text-xs text-muted-foreground max-[720px]:hidden">
                  Change icon
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label="Add icon"
              title="Add an icon at the playhead"
              onClick={shape.onAddIcon}
              className="order-2 grid size-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring max-[720px]:order-3"
            >
              <Plus className="size-4" />
            </button>
            {shape.canNavigate && (
              <div className="order-3 flex min-h-10 w-full items-center justify-between gap-2 max-[720px]:order-2 max-[720px]:w-auto">
                <span className="text-xs text-muted-foreground tabular-nums max-[720px]:hidden">
                  Icon {shape.index + 1} of {shape.total}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Previous icon clip"
                    title="Previous icon"
                    onClick={shape.onPrevious}
                    className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring max-[720px]:size-11"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next icon clip"
                    title="Next icon"
                    onClick={shape.onNext}
                    className="grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring max-[720px]:size-11"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
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
