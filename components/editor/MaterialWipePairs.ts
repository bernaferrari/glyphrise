import catalog from "./MaterialWipePairs.generated.json"

export interface MaterialWipeIconPair {
  label: string
  /** On icon. The off state is this icon with a drawn slash, not a second glyph. */
  enabled: string
}

type MaterialWipeCatalog = {
  ready: MaterialWipeIconPair[]
  refinement: MaterialWipeIconPair[]
}

// Generated from the Flutter demo catalog, with each side resolved through
// material_symbol_assets.dart. Regenerate with `pnpm generate:wipe-pairs`.
const materialWipeCatalog = catalog as MaterialWipeCatalog

export const MATERIAL_WIPE_READY_PAIRS = materialWipeCatalog.ready
export const MATERIAL_WIPE_REFINEMENT_PAIRS = materialWipeCatalog.refinement
export const MATERIAL_WIPE_PAIRS = [
  ...MATERIAL_WIPE_READY_PAIRS,
  ...MATERIAL_WIPE_REFINEMENT_PAIRS,
]
