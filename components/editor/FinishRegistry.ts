import {
  finishDefaultSettings,
  isGraphiteCutPreset,
  type MaterialPresetId,
} from "../3d/MaterialPresets"
import type { MaterialSettings } from "./EditorModel"

export const MATERIAL_METADATA: Record<
  MaterialPresetId,
  { name: string; subtitle: string; description: string }
> = {
  matte: {
    name: "Matte",
    subtitle: "Dry clay",
    description:
      "No shine at all. Shape reads through shadow alone, like a printed clay model.",
  },
  satin: {
    name: "Satin",
    subtitle: "Soft sheen",
    description:
      "A tactile surface with broad, gentle highlights. The safe default for any icon.",
  },
  gloss: {
    name: "Gloss",
    subtitle: "Clear-coated paint",
    description:
      "Saturated color under a sharp clear coat, like an enamel pin or a car body.",
  },
  pearl: {
    name: "Pearl",
    subtitle: "Ceramic sheen",
    description:
      "A pale, porcelain body with a faint pearlescent shimmer at glancing angles.",
  },
  velvet: {
    name: "Velvet",
    subtitle: "Soft-touch rim",
    description:
      "A deep, light-absorbing face with a bright fabric sheen around the silhouette.",
  },
  chrome: {
    name: "Chrome",
    subtitle: "Studio mirror",
    description:
      "A polished mirror that reflects the studio lights while keeping the fill color readable.",
  },
  brushed: {
    name: "Brushed",
    subtitle: "Anodized metal",
    description:
      "Fully metallic, tinted by the fill, with stretched highlights from a brushed grain.",
  },
  holo: {
    name: "Holo",
    subtitle: "Iridescent film",
    description:
      "Thin-film color travel from cyan to violet as the icon turns. Softer than chrome.",
  },
  prism: {
    name: "Prism",
    subtitle: "Spectral gloss",
    description:
      "Black high-gloss with cyan, amber and magenta reflection bands sweeping across it.",
  },
  frost: {
    name: "Frost",
    subtitle: "Frosted acrylic",
    description:
      "Milky acrylic that glows softly from within. Bright and soft on any background.",
  },
  glass: {
    name: "Glass",
    subtitle: "Clear refraction",
    description:
      "Clear, refractive and clear-coated. Works best over a lit or colorful background.",
  },
  gel: {
    name: "Gel",
    subtitle: "Glowing glass",
    description:
      "Luminous translucent candy with a saturated rim glow and colored inner reflections.",
  },
  neon: {
    name: "Neon",
    subtitle: "Self-lit",
    description:
      "The fill color emits its own light, so the icon glows even in a dark scene.",
  },
  xray: {
    name: "X-ray",
    subtitle: "Glowing edges",
    description:
      "Only the silhouette glows. Faces turn see-through and overlapping parts add up in light.",
  },
  toon: {
    name: "Toon",
    subtitle: "Cel-shaded",
    description:
      "Flat color in hard light bands with a crisp rim, like a hand-inked animation frame.",
  },
  carved: {
    name: "Carved",
    subtitle: "Graphite · Center",
    description:
      "Machined graphite with a ridge along the middle of every stroke.",
  },
  carvedInner: {
    name: "Carved",
    subtitle: "Graphite · Inner",
    description:
      "Machined graphite whose counters and inner turns read cut inward.",
  },
  carvedOuter: {
    name: "Carved",
    subtitle: "Graphite · Outer",
    description:
      "Machined graphite with a raised, highlighted outer bevel and rim.",
  },
  carvedSoft: {
    name: "Carved",
    subtitle: "Graphite · Soft",
    description:
      "Graphite with a calmer rounded bevel and flat closed caps instead of a ridge.",
  },
}

export type FinishGroup = {
  label: string
  /** One tile per entry; Carved variants share the `carved` tile. */
  finishes: MaterialPresetId[]
}

export const FINISH_GROUPS: FinishGroup[] = [
  { label: "Solid", finishes: ["matte", "satin", "gloss", "pearl", "velvet"] },
  { label: "Metal", finishes: ["chrome", "brushed", "holo", "prism"] },
  { label: "Translucent", finishes: ["frost", "glass", "gel"] },
  { label: "Stylized", finishes: ["neon", "xray", "toon", "carved"] },
]

/** Every tile in reading order, for arrow-key navigation. */
export const FINISH_TILES = FINISH_GROUPS.flatMap((group) => group.finishes)

/** One per family, so the strip itself shows the range at a glance. */
export const QUICK_FINISHES: MaterialPresetId[] = [
  "satin",
  "chrome",
  "frost",
  "holo",
  "neon",
]

export const CARVED_VARIANTS: Array<{ id: MaterialPresetId; label: string }> = [
  { id: "carved", label: "Center" },
  { id: "carvedInner", label: "Inner" },
  { id: "carvedOuter", label: "Outer" },
  { id: "carvedSoft", label: "Soft" },
]

/** The tile a finish lives under: Carved variants collapse into one. */
export const finishTile = (preset: MaterialPresetId): MaterialPresetId =>
  isGraphiteCutPreset(preset) ? "carved" : preset

export const finishLabel = (preset: MaterialPresetId) => {
  const metadata = MATERIAL_METADATA[preset]
  if (!isGraphiteCutPreset(preset)) return metadata.name
  const variant = CARVED_VARIANTS.find((entry) => entry.id === preset)
  return `${metadata.name} · ${variant?.label ?? "Center"}`
}

const CARVED_PREVIEW =
  "linear-gradient(135deg, #f8fafc 0%, #111827 16%, #020617 42%, #334155 58%, #050505 78%, #94a3b8 100%)"

/** Shown until the rendered 3D swatch is ready, and where WebGL is missing. */
export const MATERIAL_PREVIEW: Record<MaterialPresetId, string> = {
  matte:
    "radial-gradient(circle at 34% 28%, #94a3b8 0%, #64748b 30%, #334155 70%, #1e293b 100%)",
  satin:
    "radial-gradient(circle at 30% 26%, #e0e7ff 0%, #818cf8 26%, #4f46e5 64%, #312e81 100%)",
  gloss:
    "radial-gradient(circle at 32% 24%, #ffffff 0%, #fecdd3 10%, #f43f5e 34%, #9f1239 100%)",
  pearl:
    "radial-gradient(circle at 30% 24%, #ffffff 0%, #fdf4ff 30%, #e9d5ff 62%, #a5b4fc 100%)",
  velvet:
    "radial-gradient(circle at 50% 50%, #4c1d95 0%, #5b21b6 55%, #a78bfa 88%, #ede9fe 100%)",
  chrome:
    "radial-gradient(circle at 30% 22%, #ffffff 0%, #e0f2fe 18%, #64748b 31%, #ffffff 43%, #38bdf8 58%, #f8fafc 68%, #27272a 100%)",
  brushed:
    "linear-gradient(160deg, #e2e8f0 0%, #94a3b8 22%, #f1f5f9 40%, #64748b 62%, #cbd5e1 80%, #475569 100%)",
  holo: "radial-gradient(circle at 26% 22%, #ffffff 0%, #a5f3fc 18%, #c4b5fd 38%, #f0abfc 58%, #7dd3fc 78%, #312e81 100%)",
  prism:
    "conic-gradient(from 220deg at 48% 42%, #020617 0deg, #020617 42deg, #008cff 70deg, #00f5ff 92deg, #ff8a00 128deg, #020617 160deg, #050505 220deg, #d946ef 260deg, #00b7ff 306deg, #020617 360deg)",
  frost:
    "radial-gradient(circle at 32% 24%, #ffffff 0%, rgba(226,244,255,.9) 28%, rgba(148,197,255,.42) 56%, rgba(196,181,253,.38) 100%)",
  glass:
    "radial-gradient(circle at 30% 24%, #ffffff, rgba(186,230,253,.92) 30%, rgba(59,130,246,.18) 62%, rgba(14,116,144,.46))",
  gel: "radial-gradient(circle at 30% 22%, #ffffff 0%, #67e8f9 18%, #22d3ee 34%, #d946ef 54%, #2563eb 76%, #7c3aed 100%)",
  neon: "radial-gradient(circle at 34% 28%, #ecfeff 0%, #67e8f9 20%, #22d3ee 46%, #0e7490 74%, #164e63 100%)",
  xray: "radial-gradient(circle at 50% 50%, #020617 0%, #0c4a6e 55%, #38bdf8 82%, #e0f2fe 100%)",
  toon: "linear-gradient(135deg, #a5b4fc 0%, #a5b4fc 38%, #6366f1 38%, #6366f1 70%, #3730a3 70%)",
  carved: CARVED_PREVIEW,
  carvedInner: CARVED_PREVIEW,
  carvedOuter: CARVED_PREVIEW,
  carvedSoft: CARVED_PREVIEW,
}

export const materialDefaultSettings = (
  preset: MaterialPresetId
): MaterialSettings => ({ ...finishDefaultSettings(preset) })
