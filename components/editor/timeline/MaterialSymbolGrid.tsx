"use client"

import type { MaterialSymbolPreviewStyle } from "../IconLibrary"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ShapeStop } from "../TimelineModel"
import { cssLength, cn } from "@/lib/utils"
import type { MaterialSymbolStatus } from "./ShapePickerSymbolModel"

const DEFAULT_COLUMN_COUNT = 12
const DEFAULT_ROW_HEIGHT = 50
const GRID_OVERSCAN_ROWS = 3

export function MaterialSymbolGrid({
  stop,
  filteredMaterialSymbols,
  normalizedShapeQuery,
  materialSymbolClass,
  symbolStyle,
  materialSymbolStatus,
  className,
  onChooseMaterialSymbol,
  onImportMaterialSymbol,
}: {
  stop: ShapeStop
  filteredMaterialSymbols: string[]
  normalizedShapeQuery: string
  materialSymbolClass: string
  symbolStyle: MaterialSymbolPreviewStyle
  materialSymbolStatus: MaterialSymbolStatus
  className?: string
  onChooseMaterialSymbol: (shapeId: string, symbolName: string) => void
  onImportMaterialSymbol: (shapeId: string) => void
}) {
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [gridMetrics, setGridMetrics] = useState({
    columns: DEFAULT_COLUMN_COUNT,
    rowHeight: DEFAULT_ROW_HEIGHT,
    rowGap: 6,
    viewportHeight: 250,
  })
  const listKey = `${filteredMaterialSymbols.length}:${filteredMaterialSymbols[0] ?? ""}:${filteredMaterialSymbols.at(-1) ?? ""}`
  const selectedSymbol = stop.iconId.match(
    /^material-symbol-(?:outlined|rounded|sharp)-(.+?)(?:-slash)?$/
  )?.[1]
  const selectedIndex = filteredMaterialSymbols.indexOf(selectedSymbol ?? "")

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const measure = () => {
      const styles = window.getComputedStyle(grid)
      const columns = styles.gridTemplateColumns
        .split(" ")
        .filter(Boolean).length
      const rowGap = Number.parseFloat(styles.rowGap) || 0
      const firstTile = grid.querySelector<HTMLElement>("[data-symbol-tile]")
      const itemHeight = firstTile?.getBoundingClientRect().height
      setGridMetrics({
        columns: Math.max(1, columns || DEFAULT_COLUMN_COUNT),
        rowHeight: Math.max(1, (itemHeight || DEFAULT_ROW_HEIGHT) + rowGap),
        rowGap,
        viewportHeight: grid.clientHeight || 250,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [listKey, normalizedShapeQuery])

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    // Browse from the current icon; searches always start with their first result.
    const top =
      !normalizedShapeQuery && selectedIndex >= 0
        ? Math.max(
            0,
            Math.floor(selectedIndex / gridMetrics.columns) *
              gridMetrics.rowHeight -
              (gridMetrics.viewportHeight - gridMetrics.rowHeight) / 2
          )
        : 0
    grid.scrollTop = top
    setScrollTop(grid.scrollTop)
  }, [normalizedShapeQuery, listKey, selectedIndex, gridMetrics])

  const totalRows = Math.ceil(
    filteredMaterialSymbols.length / gridMetrics.columns
  )
  const visibleStartRow = Math.max(
    0,
    Math.floor(scrollTop / gridMetrics.rowHeight) - GRID_OVERSCAN_ROWS
  )
  const visibleEndRow = Math.min(
    totalRows,
    Math.ceil(
      (scrollTop + gridMetrics.viewportHeight) / gridMetrics.rowHeight
    ) + GRID_OVERSCAN_ROWS
  )
  const visibleSymbols = filteredMaterialSymbols.slice(
    visibleStartRow * gridMetrics.columns,
    Math.min(
      filteredMaterialSymbols.length,
      visibleEndRow * gridMetrics.columns
    )
  )
  const topSpacerHeight = Math.max(
    0,
    visibleStartRow * gridMetrics.rowHeight - gridMetrics.rowGap
  )
  const bottomSpacerHeight = Math.max(
    0,
    (totalRows - visibleEndRow) * gridMetrics.rowHeight - gridMetrics.rowGap
  )

  return (
    <div
      ref={gridRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className={cn(
        "editor-scrollbar grid max-h-62.5 grid-cols-symbols content-start justify-between gap-2 overflow-y-auto pr-1",
        normalizedShapeQuery && "grid-cols-symbol-search",
        className
      )}
    >
      {topSpacerHeight > 0 && (
        <div
          aria-hidden="true"
          className="col-span-full h-(--element-height)"
          style={
            {
              "--element-height": cssLength(topSpacerHeight),
            } as React.CSSProperties
          }
        />
      )}
      {visibleSymbols.map((symbolName) => (
        <div
          key={`material-symbol-${stop.id}-${symbolName}`}
          data-symbol-tile
          className={cn(
            "group/symbol relative aspect-square",
            normalizedShapeQuery && "aspect-auto min-h-20"
          )}
        >
          <button
            type="button"
            title={symbolName.replace(/_/g, " ")}
            aria-label={symbolName.replace(/_/g, " ")}
            aria-pressed={symbolName === selectedSymbol}
            onClick={() => onChooseMaterialSymbol(stop.id, symbolName)}
            className="flex size-full flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-1 text-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
          >
            <span
              aria-hidden="true"
              className={`${materialSymbolClass} text-symbol leading-none`}
              style={
                {
                  "--symbol-variation": symbolStyle["--symbol-variation"],
                } as React.CSSProperties
              }
            >
              {symbolName}
            </span>
            {normalizedShapeQuery && (
              <span className="text-center text-xs leading-4">
                {symbolName.replace(/_/g, " ")}
              </span>
            )}
          </button>
        </div>
      ))}
      {bottomSpacerHeight > 0 && (
        <div
          aria-hidden="true"
          className="col-span-full h-(--element-height)"
          style={
            {
              "--element-height": cssLength(bottomSpacerHeight),
            } as React.CSSProperties
          }
        />
      )}
      {filteredMaterialSymbols.length === 0 && normalizedShapeQuery && (
        <button
          type="button"
          onClick={() => onImportMaterialSymbol(stop.id)}
          disabled={materialSymbolStatus.state === "loading"}
          className="col-span-full flex h-10 items-center justify-between rounded-lg border border-dashed border-border bg-muted/40 px-3 text-left text-2xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="min-w-0">
            No matching symbols. Try another word or an exact symbol name.
          </span>
          <span className="text-2xs text-muted-foreground">Try name</span>
        </button>
      )}
    </div>
  )
}
