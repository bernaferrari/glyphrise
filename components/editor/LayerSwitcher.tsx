"use client"

import { memo, useId, useState } from "react"
import { Check, ChevronDown, Eye, EyeOff, Layers } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { PathOverride } from "../3d/SvgTypes"
import { InspectorRow } from "./InspectorPrimitives"
import { InspectorSlider } from "./InspectorSlider"
import { ALL_LAYERS_ID, type SvgLayer } from "./SvgLayerModel"

type LayerSwitcherProps = {
  layers: SvgLayer[]
  selectedLayerId: string
  selectedLayerOverride: PathOverride | null
  onSelectLayer: (id: string) => void
  onToggleVisibility: () => void
  onScaleChange: (value: number) => void
  onDepthChange: (value: number) => void
}

function LayerThumbnail({
  layer,
  contextId,
  viewBox,
}: {
  layer?: SvgLayer
  contextId: string
  viewBox?: string
}) {
  if (!viewBox) return <Layers aria-hidden="true" className="size-5 shrink-0" />

  return (
    <svg viewBox={viewBox} className="size-full" aria-hidden="true">
      <use
        href={`#${contextId}`}
        fill="currentColor"
        fillRule="evenodd"
        className={
          layer ? "text-muted-foreground opacity-30" : "text-foreground"
        }
      />
      {layer?.preview && (
        <path
          d={layer.preview.path}
          fill="currentColor"
          fillRule="evenodd"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-foreground"
        />
      )}
    </svg>
  )
}

function LayerSwitcherComponent({
  layers,
  selectedLayerId,
  selectedLayerOverride,
  onSelectLayer,
  onToggleVisibility,
  onScaleChange,
  onDepthChange,
}: LayerSwitcherProps) {
  const isAllLayers = selectedLayerId === ALL_LAYERS_ID
  const visible = selectedLayerOverride?.visible ?? true
  const showLayerControls = !isAllLayers && selectedLayerOverride

  const [open, setOpen] = useState(false)
  const selected = layers.find((layer) => layer.id === selectedLayerId)
  const contextId = useId()
  const viewBox = layers.find((layer) => layer.preview)?.preview?.viewBox

  if (layers.length === 0) return null

  return (
    <div className="flex flex-col">
      <svg className="absolute size-0" aria-hidden="true">
        <defs>
          <g id={contextId}>
            {layers.map((layer) => (
              <path key={layer.id} d={layer.preview?.path} fillRule="evenodd" />
            ))}
          </g>
        </defs>
      </svg>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          Layers
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label={`SVG layer: ${selected?.name ?? "All layers"}`}
            className="ml-auto flex h-8 max-w-48 min-w-0 items-center gap-2 rounded-md bg-muted/70 px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="size-6 shrink-0">
              <LayerThumbnail
                layer={selected}
                contextId={contextId}
                viewBox={viewBox}
              />
            </span>
            <span className="truncate">
              {selected?.name ?? `All layers · ${layers.length}`}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent
            density="compact"
            align="end"
            className="max-h-112 w-64 overflow-y-auto"
          >
            {[
              { id: ALL_LAYERS_ID, name: "All layers", color: "" },
              ...layers,
            ].map((layer, index) => (
              <button
                key={layer.id}
                type="button"
                aria-pressed={layer.id === selectedLayerId}
                title={
                  index > 0 ? `SVG layer ${index}: ${layer.name}` : undefined
                }
                onClick={() => {
                  onSelectLayer(layer.id)
                  setOpen(false)
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:font-medium"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted/50 p-0.5">
                  <LayerThumbnail
                    layer={layer.id === ALL_LAYERS_ID ? undefined : layer}
                    contextId={contextId}
                    viewBox={viewBox}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{layer.name}</span>
                  {"preview" in layer && layer.preview?.position && (
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {layer.preview.position}
                    </span>
                  )}
                </span>
                {layer.id === selectedLayerId && (
                  <Check aria-hidden="true" className="size-3.5" />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        {showLayerControls && (
          <button
            type="button"
            aria-label={visible ? "Hide SVG layer" : "Show SVG layer"}
            aria-pressed={!visible}
            title={visible ? "Hide layer" : "Show layer"}
            onClick={onToggleVisibility}
            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {visible ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
          </button>
        )}
      </div>

      {showLayerControls ? (
        <div className="flex flex-col gap-0.5 border-t border-border/40 p-1">
          <InspectorRow label="Scale">
            <InspectorSlider
              value={selectedLayerOverride.scale?.x ?? 1}
              min={0.1}
              max={2.25}
              sliderMax={1.6}
              step={0.01}
              scrubStep={0.03}
              precision={2}
              ariaLabel="SVG layer scale"
              onChange={onScaleChange}
            />
          </InspectorRow>
          <InspectorRow label="Depth">
            <InspectorSlider
              value={selectedLayerOverride.depthMultiplier}
              min={0.05}
              max={2.5}
              sliderMax={1.8}
              step={0.05}
              precision={2}
              ariaLabel="SVG layer depth"
              onChange={onDepthChange}
            />
          </InspectorRow>
        </div>
      ) : null}
    </div>
  )
}

export const LayerSwitcher = memo(LayerSwitcherComponent)
