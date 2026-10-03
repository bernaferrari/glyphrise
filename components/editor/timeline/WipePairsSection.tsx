import type { MaterialWipeIconPair } from "../MaterialWipePairs"
import type { ShapeStop } from "../TimelineModel"
import { cn } from "@/lib/utils"
import { WipePairPreview } from "./WipePairPreview"

export function WipePairsSection({
  stop,
  filteredWipePairs,
  materialSymbolClass,
  symbolStyle,
  className,
  onChooseWipePair,
}: {
  stop: ShapeStop
  filteredWipePairs: MaterialWipeIconPair[]
  materialSymbolClass: string
  symbolStyle: React.CSSProperties
  className?: string
  onChooseWipePair: (shapeId: string, pair: MaterialWipeIconPair) => void
}) {
  if (filteredWipePairs.length === 0) return null

  return (
    // Same tiles as the Presets tab: preview on top, name underneath.
    <div className={cn("mb-3", className)}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 pr-1">
        {filteredWipePairs.map((pair) => (
          <button
            key={`wipe-pair-${stop.id}-${pair.enabled}-${pair.disabled}`}
            type="button"
            title={`${pair.label}: ${pair.enabled} -> ${pair.disabled}`}
            onClick={() => onChooseWipePair(stop.id, pair)}
            className="wipe-pair-option group/pair flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-3 text-center transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <WipePairPreview
              pair={pair}
              className={materialSymbolClass}
              style={symbolStyle}
              mode={pair.disabled.endsWith("_off") ? "slash" : "real"}
            />
            <span className="line-clamp-2 w-full text-xs font-medium text-foreground">
              {pair.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
