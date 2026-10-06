import type { MaterialSymbolPreviewStyle } from "../IconLibrary"
import { Search } from "lucide-react"
import {
  getMaterialSymbolNames,
  type MaterialSymbolFontSettings,
  type MaterialSymbolStyle,
} from "../IconLibrary"
import type { ShapeStop } from "../TimelineModel"
import {
  type MaterialSymbolSettingChange,
  type MaterialSymbolStatus,
} from "./ShapePickerSymbolModel"
import { SymbolOptionsPopover } from "./SymbolOptionsPopover"

export function SymbolSearchRow({
  searchScope = "symbols",
  stop,
  materialSymbolClass,
  symbolStyle,
  materialSymbolStyle,
  materialSymbolSettings,
  materialSymbolOptionsOpen,
  materialSymbolStatus,
  normalizedShapeQuery,
  shapeSearchQuery,
  onMaterialSymbolOptionsOpenChange,
  onMaterialSymbolStyleChange,
  onMaterialSymbolSettingChange,
  onMaterialSymbolStatusChange,
  onShapeSearchQueryChange,
  onImportMaterialSymbol,
}: {
  searchScope?: "symbols" | "presets" | "wipe"
  stop: ShapeStop
  materialSymbolClass: string
  symbolStyle: MaterialSymbolPreviewStyle
  materialSymbolStyle: MaterialSymbolStyle
  materialSymbolSettings: MaterialSymbolFontSettings
  materialSymbolOptionsOpen: boolean
  materialSymbolStatus: MaterialSymbolStatus
  normalizedShapeQuery: string
  shapeSearchQuery: string
  onMaterialSymbolOptionsOpenChange: (open: boolean) => void
  onMaterialSymbolStyleChange: (style: MaterialSymbolStyle) => void
  onMaterialSymbolSettingChange: MaterialSymbolSettingChange
  onMaterialSymbolStatusChange: (status: MaterialSymbolStatus) => void
  onShapeSearchQueryChange: (value: string) => void
  onImportMaterialSymbol: (shapeId: string) => void
}) {
  return (
    <div className="relative mb-2.5 flex items-center">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
      />
      <input
        type="search"
        aria-label={
          searchScope === "presets"
            ? "Search presets"
            : searchScope === "wipe"
              ? "Search wipe pairs"
              : "Search Material Symbols"
        }
        value={shapeSearchQuery}
        onChange={(event) => {
          onShapeSearchQueryChange(event.currentTarget.value)
          if (materialSymbolStatus.state === "error")
            onMaterialSymbolStatusChange({ state: "idle" })
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            searchScope === "symbols" &&
            normalizedShapeQuery &&
            materialSymbolStatus.state !== "loading"
          ) {
            event.preventDefault()
            onImportMaterialSymbol(stop.id)
          }
        }}
        placeholder={
          searchScope === "presets"
            ? "Search presets"
            : searchScope === "wipe"
              ? "Search wipe pairs"
              : `Search ${getMaterialSymbolNames().length.toLocaleString()} symbols`
        }
        className="h-10 w-full min-w-0 rounded-lg bg-muted/70 pr-12 pl-9 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        {searchScope !== "presets" && (
          <SymbolOptionsPopover
            materialSymbolClass={materialSymbolClass}
            symbolStyle={symbolStyle}
            materialSymbolStyle={materialSymbolStyle}
            materialSymbolSettings={materialSymbolSettings}
            materialSymbolOptionsOpen={materialSymbolOptionsOpen}
            onMaterialSymbolOptionsOpenChange={
              onMaterialSymbolOptionsOpenChange
            }
            onMaterialSymbolStyleChange={onMaterialSymbolStyleChange}
            onMaterialSymbolSettingChange={onMaterialSymbolSettingChange}
          />
        )}
      </div>
    </div>
  )
}
