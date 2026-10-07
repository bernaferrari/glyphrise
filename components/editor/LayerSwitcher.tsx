"use client"

import { memo, useId, useState, type ReactNode } from "react"
import { Check, ChevronDown, Eye, EyeOff, Layers, X } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { PathOverride } from "../3d/SvgTypes"
import { cn } from "@/lib/utils"
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
  /** Replaces the "Layers" label, letting phones fit the row on one line. */
  leading?: ReactNode
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
  leading,
}: LayerSwitcherProps) {
  const isAllLayers = selectedLayerId === ALL_LAYERS_ID
  const visible = selectedLayerOverride?.visible ?? true
  const showLayerControls = !isAllLayers && selectedLayerOverride
  const modified = Boolean(
    selectedLayerOverride &&
    (!visible ||
      (selectedLayerOverride.scale?.x ?? 1) !== 1 ||
      selectedLayerOverride.depthMultiplier !== 1)
  )

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
      <div
        className={
          leading
            ? "flex items-center gap-2 pb-2"
            : "flex items-center gap-2 px-3 pt-1.5 pb-2"
        }
      >
        {leading ?? (
          <span className="text-2xs font-medium text-muted-foreground">
            Layers
          </span>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label={`SVG layer: ${selected?.name ?? "All layers"}`}
            className="ml-auto flex h-8 max-w-48 min-w-0 shrink-0 items-center gap-2 rounded-md bg-muted/70 px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
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
            collisionPadding={12}
            className="max-h-(--available-height) w-64"
          >
            <div className="max-h-112 min-h-0 overflow-y-auto overscroll-contain">
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
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {showLayerControls ? (
        <section
          aria-label={`${selected?.name ?? "Layer"} settings`}
          className={cn(
            "mb-1 rounded-xl bg-muted/30 ring-1 ring-border",
            !leading && "mx-3"
          )}
        >
          <div className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-2.5">
            <span className="size-5 shrink-0 text-foreground">
              <LayerThumbnail
                layer={selected}
                contextId={contextId}
                viewBox={viewBox}
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
              {selected?.name}
            </span>
            {modified && (
              <button
                type="button"
                onClick={() => {
                  if (!visible) onToggleVisibility()
                  onScaleChange(1)
                  onDepthChange(1)
                }}
                className="h-7 shrink-0 rounded-md px-2 text-2xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              aria-label={visible ? "Hide SVG layer" : "Show SVG layer"}
              aria-pressed={!visible}
              title={visible ? "Hide layer" : "Show layer"}
              onClick={onToggleVisibility}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:text-foreground"
            >
              {visible ? (
                <Eye aria-hidden="true" className="size-3.5" />
              ) : (
                <EyeOff aria-hidden="true" className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Back to all layers"
              title="Back to all layers"
              onClick={() => onSelectLayer(ALL_LAYERS_ID)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
          <div
            className={cn(
              "flex flex-col gap-0.5 pt-1 pb-1.5 transition-opacity",
              !visible && "opacity-50"
            )}
          >
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
        </section>
      ) : null}
    </div>
  )
}

export const LayerSwitcher = memo(LayerSwitcherComponent)
