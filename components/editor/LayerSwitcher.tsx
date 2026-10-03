"use client"

import { memo, useState } from "react"
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

function LayerSwatch({ color }: { color?: string }) {
  return color ? (
    <span
      className="size-3 shrink-0 rounded-[3px] ring-1 ring-black/15"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  ) : (
    <Layers aria-hidden="true" className="size-3.5 shrink-0" />
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

  if (layers.length === 0) return null

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          Paths
        </span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label={`SVG path: ${selected?.name ?? "All paths"}`}
            className="ml-auto flex h-8 max-w-48 min-w-0 items-center gap-2 rounded-md bg-muted/70 px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <LayerSwatch color={selected?.color} />
            <span className="truncate">
              {selected?.name ?? `All paths · ${layers.length}`}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="max-h-72 w-56 gap-0 overflow-y-auto p-1"
          >
            {[
              { id: ALL_LAYERS_ID, name: "All paths", color: undefined },
              ...layers,
            ].map((layer, index) => (
              <button
                key={layer.id}
                type="button"
                aria-pressed={layer.id === selectedLayerId}
                title={
                  index > 0 ? `SVG path ${index}: ${layer.name}` : undefined
                }
                onClick={() => {
                  onSelectLayer(layer.id)
                  setOpen(false)
                }}
                className="flex min-h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-[13px] hover:bg-muted focus-visible:bg-muted focus-visible:outline-none aria-pressed:font-medium"
              >
                <LayerSwatch color={layer.color} />
                <span className="min-w-0 flex-1 truncate">{layer.name}</span>
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
            aria-label={visible ? "Hide SVG path" : "Show SVG path"}
            aria-pressed={!visible}
            title={visible ? "Hide path" : "Show path"}
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
              ariaLabel="SVG path scale"
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
              ariaLabel="SVG path depth"
              onChange={onDepthChange}
            />
          </InspectorRow>
        </div>
      ) : null}
    </div>
  )
}

export const LayerSwitcher = memo(LayerSwitcherComponent)
